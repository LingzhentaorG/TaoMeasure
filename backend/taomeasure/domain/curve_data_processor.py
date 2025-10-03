"""
Curve measurement data normalization tool.

This script converts raw curve survey outputs into a canonical data contract
required by the DXF exporter. It validates topology, normalises numeric
formats, and serialises the final payload for downstream consumption.
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple, Union

Number = Union[int, float]
PointLike = Union[Sequence[Number], Dict[str, Number]]

ANGLE_FORMAT_DECIMAL = "decimal_degree"
ANGLE_FORMAT_DMS_STRING = "dms_string"
ANGLE_FORMAT_DD_MMSSS = "dd.mmsss"


class CurveMeasurementDataProcessor:
    """Provide helpers to parse, normalise, and persist curve survey data."""

    def load_raw_data(self, path: Path) -> Dict[str, Any]:
        """Load the raw JSON payload from disk."""
        with path.open("r", encoding="utf-8") as fp:
            return json.load(fp)

    def save_normalized_data(self, data: Dict[str, Any], path: Path) -> None:
        """Persist the normalised payload as UTF-8 encoded JSON."""
        with path.open("w", encoding="utf-8") as fp:
            json.dump(data, fp, ensure_ascii=False, indent=2)

    def normalize(
        self,
        raw_data: Dict[str, Any],
        *,
        angle_columns: Optional[Iterable[Union[int, str]]] = None,
        numeric_precision: int = 3,
    ) -> Dict[str, Any]:
        """Transform raw curve survey data into the canonical data contract."""
        normalized: Dict[str, Any] = {}

        if "frame" in raw_data:
            normalized["frame"] = self._normalize_frame(raw_data["frame"])
        if "north_arrow" in raw_data:
            normalized["north_arrow"] = self._normalize_north_arrow(raw_data["north_arrow"])

        for key in (
            "centerline",
            "left_lane",
            "right_lane",
            "left_roadbed_edge",
            "right_roadbed_edge",
            "pi_line",
        ):
            if key in raw_data and raw_data[key] is not None:
                normalized[key] = self._normalize_polyline(raw_data[key])

        if "key_points" in raw_data:
            normalized["key_points"] = self._normalize_key_points(raw_data["key_points"])
        if "hm_stakes" in raw_data:
            normalized["hm_stakes"] = self._normalize_hm_stakes(raw_data["hm_stakes"])
        if "curve_table" in raw_data:
            normalized["curve_table"] = self._normalize_curve_table(
                raw_data["curve_table"],
                angle_columns=angle_columns,
                numeric_precision=numeric_precision,
            )

        passthrough_keys = ["metadata", "version"]
        for key in passthrough_keys:
            if key in raw_data:
                normalized[key] = raw_data[key]

        return normalized

    def _normalize_frame(self, frame: Dict[str, Any]) -> Dict[str, Any]:
        """Validate drawing frame coordinates and ensure four-point outlines."""
        outer = self._normalize_polyline(frame.get("outer_rect", []))
        inner = self._normalize_polyline(frame.get("inner_rect", []))
        if len(outer) < 4 or len(inner) < 4:
            raise ValueError("frame.outer_rect and frame.inner_rect require at least four points each")
        return {"outer_rect": outer, "inner_rect": inner}

    def _normalize_north_arrow(self, arrow: Dict[str, Any]) -> Dict[str, Any]:
        """Normalise north arrow information and validate radius."""
        center = self._normalize_point(arrow.get("center"))
        radius = float(arrow.get("radius", 10.0))
        if radius <= 0:
            raise ValueError("north_arrow.radius must be positive")
        return {"center": center, "radius": radius}

    def _normalize_polyline(self, value: Sequence[PointLike]) -> List[List[float]]:
        """Convert a polyline definition to lists of float coordinates."""
        points: List[List[float]] = []
        for point_like in value:
            points.append(self._normalize_point(point_like))
        return points

    def _normalize_point(self, value: PointLike) -> List[float]:
        """Coerce any point-like payload into an [x, y] pair."""
        if isinstance(value, dict):
            x = value.get("x")
            y = value.get("y")
        else:
            seq = list(value)
            if len(seq) < 2:
                raise ValueError("point definitions must contain at least two numeric values")
            x, y = seq[0], seq[1]
        if x is None or y is None:
            raise ValueError("point definitions require both x and y")
        return [float(x), float(y)]

    def _normalize_key_points(self, key_points: Sequence[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Normalise key point markers including station labels and leader lines."""
        normalized: List[Dict[str, Any]] = []
        for item in key_points:
            point = self._normalize_point(item.get("point"))
            leader_end = item.get("leader_end")
            normalized_item: Dict[str, Any] = {
                "name": str(item.get("name", "")),
                "station": str(item.get("station", "")),
                "point": point,
                "radius": float(item.get("radius", 0.75)),
                "text_rotation_deg": float(item.get("text_rotation_deg", 0.0)),
            }
            if leader_end is not None:
                normalized_item["leader_end"] = self._normalize_point(leader_end)
            normalized.append(normalized_item)
        return normalized

    def _normalize_hm_stakes(self, stakes: Sequence[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Normalise stake annotations with leader segments and text parameters."""
        normalized: List[Dict[str, Any]] = []
        for stake in stakes:
            line = stake.get("line", {})
            label = stake.get("label", {})
            norm_stake: Dict[str, Any] = {
                "line": {
                    "start": self._normalize_point(line.get("start")),
                    "end": self._normalize_point(line.get("end")),
                }
            }
            if label:
                norm_label: Dict[str, Any] = {
                    "text": str(label.get("text", "")),
                    "pos": self._normalize_point(label.get("pos")),
                    "rotation_deg": float(label.get("rotation_deg", 0.0)),
                }
                if "height" in label:
                    norm_label["height"] = float(label.get("height"))
                norm_stake["label"] = norm_label
            normalized.append(norm_stake)
        return normalized

    def _normalize_curve_table(
        self,
        table: Dict[str, Any],
        *,
        angle_columns: Optional[Iterable[Union[int, str]]] = None,
        numeric_precision: int,
    ) -> Dict[str, Any]:
        """Standardise the curve element table layout and cell formatting."""
        headers = [str(h) for h in table.get("headers", [])]
        rows = table.get("rows", [])
        if not headers:
            raise ValueError("curve_table.headers cannot be empty")

        angle_index_set = self._resolve_angle_columns(angle_columns, headers)

        normalized_rows: List[List[str]] = []
        for row in rows:
            normalized_row: List[str] = []
            for idx, cell in enumerate(row):
                is_angle = idx in angle_index_set or self._cell_declares_angle(cell)
                normalized_row.append(
                    self._normalize_table_cell(cell, is_angle=is_angle, precision=numeric_precision)
                )
            normalized_rows.append(normalized_row)

        origin = self._normalize_point(table.get("origin", [0, 0]))
        col_widths = [float(w) for w in table.get("col_widths", [25.0] * len(headers))]
        row_height = float(table.get("row_height", 7.5))
        text_height = float(table.get("text_height", 3.0))

        return {
            "origin": origin,
            "headers": headers,
            "rows": normalized_rows,
            "col_widths": col_widths,
            "row_height": row_height,
            "text_height": text_height,
        }

    def _cell_declares_angle(self, cell: Any) -> bool:
        """Return True when a cell payload explicitly marks itself as an angle."""
        return isinstance(cell, dict) and str(cell.get("format", "")).lower() in {
            ANGLE_FORMAT_DECIMAL,
            ANGLE_FORMAT_DMS_STRING,
            ANGLE_FORMAT_DD_MMSSS,
        }

    def _normalize_table_cell(self, cell: Any, *, is_angle: bool, precision: int) -> str:
        """Convert a table cell into a printable string with optional angle formatting."""
        if cell is None:
            return ""
        if is_angle:
            return self._normalize_angle_value(cell)
        if isinstance(cell, dict) and "value" in cell:
            value = cell.get("value")
        else:
            value = cell
        if isinstance(value, (int, float)):
            return self._format_number(float(value), precision)
        return str(value)

    def _format_number(self, value: float, precision: int) -> str:
        """Format numeric cells with a fixed precision and trimmed trailing zeros."""
        formatted = f"{value:.{precision}f}"
        if "." in formatted:
            formatted = formatted.rstrip("0").rstrip(".")
        return formatted

    def _resolve_angle_columns(
        self, hint: Optional[Iterable[Union[int, str]]], headers: List[str]
    ) -> set:
        """Infer angle columns from user hints and header keywords."""
        result: set = set()
        if not hint:
            for idx, header in enumerate(headers):
                lowered = header.lower()
                if any(token in lowered for token in ("angle", "deflection", "\u8f6c\u89d2", "\u89d2")):
                    result.add(idx)
            return result

        for item in hint:
            if isinstance(item, int):
                result.add(item)
            else:
                lowered = str(item).lower()
                for idx, header in enumerate(headers):
                    if lowered in header.lower():
                        result.add(idx)
        return result

    def _normalize_angle_value(self, angle: Any) -> str:
        """Convert any supported angle representation into a DMS string."""
        if isinstance(angle, dict):
            fmt = str(angle.get("format", "")).lower()
            value = angle.get("value")
        else:
            fmt = ""
            value = angle

        if value is None:
            return ""

        if isinstance(value, str) and not fmt:
            if any(symbol in value for symbol in ("\u00b0", "'", '"', "d", "deg")):
                return self._sanitize_dms_string(value)
            try:
                value = float(value)
            except ValueError as exc:
                raise ValueError(f"unable to parse angle literal: {value}") from exc

        if fmt in {"", ANGLE_FORMAT_DECIMAL} and isinstance(value, (int, float)):
            decimal = float(value)
        elif fmt == ANGLE_FORMAT_DD_MMSSS or (fmt == "" and isinstance(value, (int, float))):
            decimal = self._ddmmsss_to_decimal(float(value))
        elif fmt == ANGLE_FORMAT_DMS_STRING:
            return self._sanitize_dms_string(str(value))
        else:
            raise ValueError(f"unsupported angle format: {fmt or type(value)}")

        return self._decimal_to_dms_string(decimal)

    def _sanitize_dms_string(self, value: str) -> str:
        """Normalise an existing DMS string into a compact ASCII representation."""
        cleaned = value.strip()
        replacements = {
            "deg": "\u00b0",
            "d": "\u00b0",
            " min": "'",
            "min": "'",
            " sec": '"',
            "sec": '"',
        }
        for src, dst in replacements.items():
            cleaned = cleaned.replace(src, dst)
        cleaned = cleaned.replace(" ", "")
        cleaned = cleaned.replace("\u2032", "'")
        cleaned = cleaned.replace("\u2033", '"')
        if "\u00b0" not in cleaned and "'" not in cleaned and '"' not in cleaned:
            return cleaned
        return cleaned

    def _decimal_to_dms_string(self, decimal_degrees: float) -> str:
        """Render decimal degrees as a DMS string (DDD\u00b0MM'SS.sss")."""
        sign = "-" if decimal_degrees < 0 else ""
        value = abs(decimal_degrees)
        degrees = int(math.floor(value))
        minutes_full = (value - degrees) * 60
        minutes = int(math.floor(minutes_full))
        seconds = (minutes_full - minutes) * 60
        return f"{sign}{degrees:02d}\u00b0{minutes:02d}'{seconds:06.3f}\""

    def _ddmmsss_to_decimal(self, value: float) -> float:
        """Convert dd.mmsss formatted numbers into decimal degrees."""
        sign = -1.0 if value < 0 else 1.0
        abs_value = abs(value)
        degrees = int(math.floor(abs_value))
        fraction = abs_value - degrees
        mmsss = f"{fraction:.10f}".split(".")[1]
        mmsss = mmsss.rstrip("0")
        if len(mmsss) < 2:
            minutes = int(mmsss or 0)
            seconds_str = ""
        else:
            minutes = int(mmsss[:2])
            seconds_str = mmsss[2:]
        seconds = float(seconds_str) if seconds_str else 0.0
        decimal = degrees + minutes / 60.0 + seconds / 3600.0
        return sign * decimal


def parse_args() -> argparse.Namespace:
    """Configure CLI argument parsing."""
    parser = argparse.ArgumentParser(
        description="Normalise raw curve-survey results into DXF-ready JSON"
    )
    parser.add_argument("input", type=Path, help="Path to the raw JSON input file")
    parser.add_argument("output", type=Path, help="Path to the normalised JSON output file")
    parser.add_argument(
        "--angle-column",
        dest="angle_columns",
        action="append",
        help="Columns that should be formatted as DMS; accepts indices or header fragments",
    )
    parser.add_argument(
        "--precision",
        dest="precision",
        type=int,
        default=3,
        help="Number of decimal places for numeric fields (default: 3)",
    )
    return parser.parse_args()


def main() -> None:
    """Command-line entry point: load, normalise, and save curve data."""
    args = parse_args()
    processor = CurveMeasurementDataProcessor()
    raw_data = processor.load_raw_data(args.input)

    angle_hints: Optional[List[Union[int, str]]] = None
    if args.angle_columns:
        angle_hints = []
        for item in args.angle_columns:
            try:
                angle_hints.append(int(item))
            except (TypeError, ValueError):
                angle_hints.append(item)

    normalized = processor.normalize(
        raw_data,
        angle_columns=angle_hints,
        numeric_precision=args.precision,
    )
    processor.save_normalized_data(normalized, args.output)


if __name__ == "__main__":
    main()
