from __future__ import annotations

import math
import re
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

Point = Tuple[float, float]


@dataclass
class BoundingBox:
    min_x: float
    min_y: float
    max_x: float
    max_y: float

    @property
    def width(self) -> float:
        return self.max_x - self.min_x

    @property
    def height(self) -> float:
        return self.max_y - self.min_y

    def expand(self, padding: float) -> "BoundingBox":
        return BoundingBox(
            self.min_x - padding,
            self.min_y - padding,
            self.max_x + padding,
            self.max_y + padding,
        )


class CurveDxfBuilder:
    """Translate frontend curve results into the DXF exporter data contract."""

    STATION_RE = re.compile(r"^K?(?P<km>\d+)(?:\+(?P<m>[0-9]+(?:\.[0-9]+)?))?$")

    def __init__(self, payload: Dict[str, Any]):
        self.payload = payload or {}
        self.layout_data: List[Dict[str, Any]] = self._normalize_sequence(self.payload.get("layoutData"))
        self.station_data: List[Dict[str, Any]] = self._normalize_sequence(self.payload.get("stationData"))
        self.main_points: List[Dict[str, Any]] = self._normalize_main_points(self.payload.get("mainPoints"))
        curve_elements = self.payload.get("curveElements") or {}
        self.curve_elements: Dict[str, Any] = curve_elements.get("elements") or {}
        self.project_name: str = self.payload.get("projectName") or "道路曲线工程"
        self.left_distance: float = self._resolve_side_distance("left")
        self.right_distance: float = self._resolve_side_distance("right")
        self.edge_extra: float = 0.375  # 参考示例图纸，路基较车道外扩约 0.375m
        self._ordered_layout_cache: Optional[List[Dict[str, Any]]] = None
        self._ordered_station_cache: Optional[List[Dict[str, Any]]] = None

    # ------------------------------------------------------------------
    # Public API
    def build(self) -> Dict[str, Any]:
        centerline = self._build_centerline()
        left_lane, right_lane = self._build_lanes(centerline)
        left_edge, right_edge = self._build_roadbed_edges(centerline, left_lane, right_lane)
        pi_line = self._build_pi_line()
        key_points = self._build_key_points()
        hm_stakes = self._build_stakes()

        frame = self._build_frame([centerline, left_lane, right_lane, left_edge, right_edge])
        north_arrow = self._build_north_arrow(frame)
        curve_table = self._build_curve_table(frame)

        return {
            "frame": frame,
            "north_arrow": north_arrow,
            "centerline": centerline,
            "left_lane": left_lane,
            "right_lane": right_lane,
            "left_roadbed_edge": left_edge,
            "right_roadbed_edge": right_edge,
            "pi_line": pi_line,
            "key_points": key_points,
            "hm_stakes": hm_stakes,
            "curve_table": curve_table,
        }

    # ------------------------------------------------------------------
    # Geometry builders
    def _build_centerline(self) -> List[Point]:
        ordered = self._ordered_layout_data()
        if ordered:
            return [(float(item.get("x", 0.0)), float(item.get("y", 0.0))) for item in ordered]
        ordered = self._ordered_station_data()
        return [(float(item.get("x", 0.0)), float(item.get("y", 0.0))) for item in ordered]

    def _build_lanes(self, centerline: List[Point]) -> Tuple[List[Point], List[Point]]:
        ordered = self._ordered_layout_data()
        if ordered and all("leftCoords" in item and "rightCoords" in item for item in ordered):
            left = [(float(item["leftCoords"]["x"]), float(item["leftCoords"]["y"])) for item in ordered]
            right = [(float(item["rightCoords"]["x"]), float(item["rightCoords"]["y"])) for item in ordered]
            return left, right

        source = ordered if ordered else self._ordered_station_data()
        left_points: List[Point] = []
        right_points: List[Point] = []
        for item in source:
            x = float(item.get("x", 0.0))
            y = float(item.get("y", 0.0))
            az = self._to_float(item.get("azimuth")) or 0.0
            left_points.append(self._offset_point((x, y), az, self.left_distance, side="left"))
            right_points.append(self._offset_point((x, y), az, self.right_distance, side="right"))
        return left_points, right_points

    def _build_roadbed_edges(
        self,
        centerline: List[Point],
        left_lane: List[Point],
        right_lane: List[Point],
    ) -> Tuple[List[Point], List[Point]]:
        if not centerline:
            return [], []

        ordered = self._ordered_layout_data()
        if not ordered:
            ordered = self._ordered_station_data()

        edge_left: List[Point] = []
        edge_right: List[Point] = []
        for idx, (x, y) in enumerate(centerline):
            az = self._azimuth_for_index(idx, ordered)

            if idx < len(left_lane):
                lx, ly = left_lane[idx]
                edge_left.append(self._extend_vector((x, y), (lx, ly), self.edge_extra))
            else:
                edge_left.append(self._offset_point((x, y), az, self.left_distance + self.edge_extra, side="left"))

            if idx < len(right_lane):
                rx, ry = right_lane[idx]
                edge_right.append(self._extend_vector((x, y), (rx, ry), self.edge_extra))
            else:
                edge_right.append(self._offset_point((x, y), az, self.right_distance + self.edge_extra, side="right"))

        return edge_left, edge_right

    def _build_pi_line(self) -> List[Point]:
        layout_map = self._layout_point_lookup()
        names = ["ZH", "HY", "QZ", "YH", "HZ"]
        pi_points: List[Point] = []
        for name in names:
            entry = layout_map.get(name)
            if entry:
                pi_points.append((float(entry.get("x", 0.0)), float(entry.get("y", 0.0))))
            else:
                mp = self._find_main_point(name)
                if mp:
                    pi_points.append((float(mp.get("x", 0.0)), float(mp.get("y", 0.0))))
        return pi_points

    def _build_key_points(self) -> List[Dict[str, Any]]:
        layout_map = self._layout_point_lookup()
        key_points: List[Dict[str, Any]] = []
        for mp in sorted(self.main_points, key=lambda item: item.get("station", 0.0)):
            name = str(mp.get("name", "")).upper()
            base_x = self._to_float(mp.get("x"))
            base_y = self._to_float(mp.get("y"))
            azimuth = self._to_float(mp.get("azimuth")) or 0.0
            layout_entry = layout_map.get(name)
            if layout_entry:
                base_x = self._to_float(layout_entry.get("x")) or base_x
                base_y = self._to_float(layout_entry.get("y")) or base_y
                azimuth = self._to_float(layout_entry.get("azimuth")) or azimuth
            if base_x is None or base_y is None:
                continue
            leader_dx, leader_dy = self._unit_perp(azimuth, side="left")
            leader_length = 6.0
            leader_end = (base_x + leader_dx * leader_length, base_y + leader_dy * leader_length)
            key_points.append({
                "name": mp.get("name", ""),
                "station": self._format_station(mp.get("station"), mp.get("station_label")),
                "point": (base_x, base_y),
                "radius": 1.2,
                "text_rotation_deg": 0.0,
                "leader_end": leader_end,
            })
        return key_points

    def _build_stakes(self) -> List[Dict[str, Any]]:
        stakes: List[Dict[str, Any]] = []
        ordered = self._ordered_layout_data()
        if not ordered:
            ordered = self._ordered_station_data()
        tick_length = 4.0
        label_offset = 5.0
        for item in ordered:
            x = float(item.get("x", 0.0))
            y = float(item.get("y", 0.0))
            az = self._to_float(item.get("azimuth")) or 0.0
            station_value = item.get("_station_numeric")
            station_raw = item.get("_station_raw")
            nx, ny = self._unit_perp(az, side="left")
            start = (x - nx * tick_length / 2, y - ny * tick_length / 2)
            end = (x + nx * tick_length / 2, y + ny * tick_length / 2)
            label_pos = (x + nx * (tick_length / 2 + label_offset), y + ny * (tick_length / 2 + label_offset))
            stakes.append({
                "line": {"start": start, "end": end},
                "label": {
                    "text": self._format_station(station_value, station_raw),
                    "pos": label_pos,
                    "rotation_deg": 0.0,
                    "height": 3.0,
                },
            })
        return stakes

    # ------------------------------------------------------------------
    # Layout helpers
    def _build_frame(self, collections: Sequence[Sequence[Point]]) -> Dict[str, List[Point]]:
        points: List[Point] = []
        for seq in collections:
            points.extend(seq or [])
        if not points:
            points = [(0.0, 0.0)]
        bbox = self._bounding_box(points)
        padding = max(50.0, max(bbox.width, bbox.height) * 0.1)
        outer = bbox.expand(padding)
        inner_padding = min(20.0, max(5.0, min(outer.width, outer.height) / 4))
        inner = outer.expand(-inner_padding)
        outer_rect = [
            (outer.min_x, outer.max_y),
            (outer.max_x, outer.max_y),
            (outer.max_x, outer.min_y),
            (outer.min_x, outer.min_y),
        ]
        inner_rect = [
            (inner.min_x, inner.max_y),
            (inner.max_x, inner.max_y),
            (inner.max_x, inner.min_y),
            (inner.min_x, inner.min_y),
        ]
        return {"outer_rect": outer_rect, "inner_rect": inner_rect}

    def _build_north_arrow(self, frame: Dict[str, List[Point]]) -> Dict[str, Any]:
        outer_rect = frame["outer_rect"]
        max_x = max(pt[0] for pt in outer_rect)
        max_y = max(pt[1] for pt in outer_rect)
        min_x = min(pt[0] for pt in outer_rect)
        min_y = min(pt[1] for pt in outer_rect)
        radius = max((max_x - min_x), (max_y - min_y)) * 0.035
        radius = max(radius, 8.0)
        center = (max_x - radius * 1.5, max_y - radius * 1.5)
        return {"center": center, "radius": radius}

    def _build_curve_table(self, frame: Dict[str, List[Point]]) -> Dict[str, Any]:
        inner_rect = frame["inner_rect"]
        min_x = min(pt[0] for pt in inner_rect)
        min_y = min(pt[1] for pt in inner_rect)
        origin = (min_x + 20.0, min_y + 80.0)
        headers = ["点名", "桩号", "坐标X", "坐标Y", "方位角", "R(m)"]
        rows: List[List[str]] = []
        radius_value = self.curve_elements.get("R")
        layout_map = self._layout_point_lookup()
        for mp in sorted(self.main_points, key=lambda item: item.get("station", 0.0)):
            name = mp.get("name", "")
            layout_entry = layout_map.get(str(name).upper())
            x = self._to_float(mp.get("x"))
            y = self._to_float(mp.get("y"))
            azimuth = self._to_float(mp.get("azimuth"))
            if layout_entry:
                x = self._to_float(layout_entry.get("x")) or x
                y = self._to_float(layout_entry.get("y")) or y
                azimuth = self._to_float(layout_entry.get("azimuth")) or azimuth
            rows.append([
                str(name),
                self._format_station(mp.get("station"), mp.get("station_label")),
                self._format_number(x),
                self._format_number(y),
                self._format_dms(azimuth),
                self._format_number(radius_value),
            ])
        col_widths = [22.0, 42.0, 40.0, 40.0, 48.0, 28.0]
        return {
            "origin": origin,
            "headers": headers,
            "rows": rows,
            "col_widths": col_widths,
            "row_height": 8.0,
            "text_height": 3.0,
        }

    # ------------------------------------------------------------------
    # Normalisation helpers
    def _normalize_sequence(self, items: Optional[Any]) -> List[Dict[str, Any]]:
        normalized: List[Dict[str, Any]] = []
        for item in items or []:
            if not isinstance(item, dict):
                continue
            entry = dict(item)
            entry["_station_raw"] = entry.get("station")
            entry["_station_numeric"] = self._parse_station(entry.get("station"))
            normalized.append(entry)
        return normalized

    def _normalize_main_points(self, main_points: Optional[Any]) -> List[Dict[str, Any]]:
        if not main_points:
            return []
        if isinstance(main_points, dict):
            values = main_points.values()
        else:
            values = main_points
        normalized: List[Dict[str, Any]] = []
        for item in values:
            if not isinstance(item, dict):
                continue
            coords = item.get("coordinates") or {}
            station_raw = item.get("station")
            station_numeric = self._parse_station(station_raw)
            normalized.append({
                "name": item.get("name", item.get("pointName", "")),
                "station": station_numeric,
                "station_label": station_raw if isinstance(station_raw, str) else None,
                "x": self._to_float(item.get("x", coords.get("x"))),
                "y": self._to_float(item.get("y", coords.get("y"))),
                "azimuth": self._to_float(item.get("azimuth", coords.get("azimuth"))),
            })
        return normalized

    # ------------------------------------------------------------------
    # Utility helpers
    def _ordered_layout_data(self) -> List[Dict[str, Any]]:
        if not self.layout_data:
            return []
        if self._ordered_layout_cache is None:
            self._ordered_layout_cache = self._sorted_sequence(self.layout_data)
        return self._ordered_layout_cache

    def _ordered_station_data(self) -> List[Dict[str, Any]]:
        if not self.station_data:
            return []
        if self._ordered_station_cache is None:
            self._ordered_station_cache = self._sorted_sequence(self.station_data)
        return self._ordered_station_cache

    def _sorted_sequence(self, items: Sequence[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return sorted(items, key=self._station_sort_key)

    def _station_sort_key(self, item: Dict[str, Any]) -> float:
        value = item.get("_station_numeric")
        if value is None:
            value = self._parse_station(item.get("station"))
            item["_station_numeric"] = value
        return float(value or 0.0)

    def _parse_station(self, value: Optional[Any]) -> Optional[float]:
        if value is None:
            return None
        if isinstance(value, (int, float)) and not math.isnan(value):
            return float(value)
        if isinstance(value, str):
            raw = value.strip()
            if not raw:
                return None
            match = self.STATION_RE.match(raw)
            if match:
                km = int(match.group("km"))
                meters = float(match.group("m") or 0.0)
                return km * 1000.0 + meters
            try:
                return float(raw)
            except ValueError:
                return None
        return None

    def _layout_point_lookup(self) -> Dict[str, Dict[str, Any]]:
        mapping: Dict[str, Dict[str, Any]] = {}
        for item in self.layout_data:
            name = item.get("pointName")
            if not name:
                continue
            mapping.setdefault(str(name).upper(), item)
        return mapping

    def _find_main_point(self, name: str) -> Optional[Dict[str, Any]]:
        for mp in self.main_points:
            if str(mp.get("name", "")).upper() == name.upper():
                return mp
        return None

    def _offset_point(self, point: Point, azimuth: float, distance: float, *, side: str) -> Point:
        if not distance:
            return point
        nx, ny = self._unit_perp(azimuth, side)
        return (point[0] + nx * distance, point[1] + ny * distance)

    def _unit_perp(self, azimuth: float, side: str) -> Point:
        if side == "left":
            nx = -math.cos(azimuth)
            ny = math.sin(azimuth)
        else:
            nx = math.cos(azimuth)
            ny = -math.sin(azimuth)
        length = math.hypot(nx, ny) or 1.0
        return nx / length, ny / length

    def _extend_vector(self, origin: Point, target: Point, extra: float) -> Point:
        dx = target[0] - origin[0]
        dy = target[1] - origin[1]
        length = math.hypot(dx, dy) or 1.0
        scale = (length + extra) / length
        return (origin[0] + dx * scale, origin[1] + dy * scale)

    def _azimuth_for_index(self, idx: int, sequence: Sequence[Dict[str, Any]]) -> float:
        if idx < len(sequence):
            return self._to_float(sequence[idx].get("azimuth")) or 0.0
        return 0.0

    def _bounding_box(self, points: Iterable[Point]) -> BoundingBox:
        xs = [p[0] for p in points]
        ys = [p[1] for p in points]
        return BoundingBox(min(xs), min(ys), max(xs), max(ys))

    def _format_station(self, value: Optional[Any], raw: Optional[Any] = None) -> str:
        if isinstance(raw, str) and raw.strip():
            return raw.strip()
        if isinstance(value, str):
            parsed = self._parse_station(value)
            if parsed is None:
                return value
            value = parsed
        if value is None:
            return ''
        km = int(value // 1000)
        meters = value % 1000
        return f"K{km}+{meters:06.3f}"

    def _format_number(self, value: Optional[Any], digits: int = 3) -> str:
        number = self._to_float(value)
        if number is None:
            return ''
        return f"{number:.{digits}f}"

    def _format_dms(self, value: Optional[Any]) -> str:
        number = self._to_float(value)
        if number is None:
            return ''
        degrees = math.degrees(number)
        sign = '-' if degrees < 0 else ''
        abs_val = abs(degrees)
        d = int(abs_val)
        minutes_full = (abs_val - d) * 60
        m = int(minutes_full)
        seconds_full = (minutes_full - m) * 60
        seconds_rounded = round(seconds_full, 1)
        if seconds_rounded >= 60.0:
            seconds_rounded -= 60.0
            m += 1
            if m >= 60:
                m -= 60
                d += 1
        seconds_int = int(seconds_rounded)
        seconds_frac = int(round((seconds_rounded - seconds_int) * 10))
        seconds_part = f"{seconds_int:02d}{seconds_frac}"
        return f"{sign}{d:02d}.{m:02d}{seconds_part}"

    def _to_float(self, value: Optional[Any]) -> Optional[float]:
        if value is None:
            return None
        if isinstance(value, (int, float)) and not math.isnan(value):
            return float(value)
        if isinstance(value, str):
            raw = value.strip()
            if not raw:
                return None
            station_value = self._parse_station(raw)
            if station_value is not None:
                return station_value
            try:
                return float(raw)
            except ValueError:
                return None
        return None

    def _resolve_side_distance(self, side: str) -> float:
        key = f"{side}Distance"
        distances: List[float] = []
        for item in self.layout_data:
            value = item.get(key)
            if isinstance(value, (int, float)):
                distances.append(float(value))
        if distances:
            return sum(distances) / len(distances)
        value = self.payload.get(key)
        if isinstance(value, (int, float)):
            return float(value)
        return 0.0


__all__ = ["CurveDxfBuilder"]
