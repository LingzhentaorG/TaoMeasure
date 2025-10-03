"""
DXF exporter for roadway curve survey drawings.

This module defines the DxfRoadExporter utility which consumes the
canonical curve-survey data contract and emits CAD-ready DXF files using
'ezdxf'. Geometry and annotation responsibilities are centralised here so
that computational modules can remain focused on domain calculations.
"""

from __future__ import annotations

from typing import Any, Dict, List, Mapping, Optional, Sequence, Tuple

import ezdxf
from ezdxf.document import Drawing
from ezdxf.layouts.layout import Modelspace

Point2D = Tuple[float, float]
PointSeq = Sequence[Sequence[float]]

DEFAULT_LAYER_MAP: Mapping[str, str] = {
    "frame_outer": "FRAME_OUTER",
    "frame_inner": "FRAME_INNER",
    "north_arrow": "NORTH_ARROW",
    "centerline": "ALIGNMENT_CENTER",
    "left_lane": "LANE_LEFT",
    "right_lane": "LANE_RIGHT",
    "left_roadbed_edge": "ROADBED_LEFT",
    "right_roadbed_edge": "ROADBED_RIGHT",
    "pi_line": "PI_LINE",
    "key_point": "KEY_POINT",
    "hm_stake": "STAKE",
    "curve_table": "CURVE_TABLE",
}


class CurveContractValidator:
    """Light-weight validator for the curve-survey drawing data contract."""

    def validate(self, data: Dict[str, Any]) -> None:
        """Raise ValueError when mandatory sections are missing or malformed."""
        frame = data.get("frame")
        if frame:
            for key in ("outer_rect", "inner_rect"):
                if key not in frame or not frame[key]:
                    raise ValueError(f"frame.{key} must provide four corner points")
                self._ensure_point_sequence(frame[key], f"frame.{key}")

        if "north_arrow" in data:
            arrow = data["north_arrow"]
            if "center" not in arrow or "radius" not in arrow:
                raise ValueError("north_arrow requires 'center' and 'radius'")
            self._ensure_point_sequence([arrow["center"]], "north_arrow.center")

        for key in ("key_points", "hm_stakes"):
            if key in data and not isinstance(data[key], list):
                raise ValueError(f"{key} must be a list when provided")

        if "curve_table" in data:
            table = data["curve_table"]
            for required in ("headers", "rows", "origin"):
                if required not in table:
                    raise ValueError(f"curve_table requires '{required}' field")
            self._ensure_point_sequence([table["origin"]], "curve_table.origin")

    def _ensure_point_sequence(self, points: Sequence[Sequence[float]], label: str) -> None:
        """Verify that a sequence contains only two-value numeric points."""
        if not isinstance(points, Sequence) or not points:
            raise ValueError(f"{label} must be a non-empty sequence")
        for point in points:
            if not isinstance(point, Sequence) or len(point) < 2:
                raise ValueError(f"{label} contains an invalid point: {point}")


class DxfRoadExporter:
    """Render curve-survey deliverables into a DXF drawing."""

    def __init__(
        self,
        dxf_version: str = "R2010",
        *,
        layer_overrides: Optional[Mapping[str, str]] = None,
        validator: Optional[CurveContractValidator] = None,
    ) -> None:
        """Create a new DXF document and prepare default layers."""
        self.layer_map: Dict[str, str] = dict(DEFAULT_LAYER_MAP)
        if layer_overrides:
            self.layer_map.update(layer_overrides)

        self.doc: Drawing = ezdxf.new(dxf_version)
        self.msp: Modelspace = self.doc.modelspace()
        self.validator = validator or CurveContractValidator()
        self._ensure_layers_exist()

    def layer(self, key: str) -> str:
        """Resolve a logical layer key into a DXF layer name."""
        if key not in self.layer_map:
            raise KeyError(f"layer '{key}' is not defined in the layer map")
        return self.layer_map[key]

    def _ensure_layers_exist(self) -> None:
        """Create all configured layers up-front to avoid runtime lookups."""
        for layer_name in self.layer_map.values():
            if layer_name not in self.doc.layers:
                self.doc.layers.add(name=layer_name)

    def add_polyline(self, points: PointSeq, layer_key: str, *, closed: bool = False) -> None:
        """Add an LWPolyline to the drawing on the specified layer."""
        coords = [self._to_point_tuple(pt) for pt in points]
        if not coords:
            return
        self.msp.add_lwpolyline(coords, dxfattribs={"layer": self.layer(layer_key), "closed": closed})

    def add_line(self, start: Sequence[float], end: Sequence[float], layer_key: str) -> None:
        """Add a simple line entity on the requested layer."""
        self.msp.add_line(self._to_point_tuple(start), self._to_point_tuple(end), dxfattribs={"layer": self.layer(layer_key)})

    def add_circle(self, center: Sequence[float], radius: float, layer_key: str) -> None:
        """Add a circle entity using the default DXF circle primitive."""
        self.msp.add_circle(self._to_point_tuple(center), radius, dxfattribs={"layer": self.layer(layer_key)})

    def add_text(
        self,
        text: str,
        position: Sequence[float],
        *,
        height: float = 3.0,
        rotation_deg: float = 0.0,
        layer_key: str = "curve_table",
        align: str = "LEFT",
    ) -> None:
        """Place a text entity while remaining compatible with legacy ezdxf versions."""
        layer_name = self.layer(layer_key)
        entity = self.msp.add_text(
            text,
            dxfattribs={
                "height": height,
                "rotation": rotation_deg,
                "layer": layer_name,
            },
        )
        insert = self._to_point_tuple(position)
        entity.dxf.insert = insert
        entity.dxf.align_point = insert

        alignment_map = {
            "LEFT": (0, 0),
            "CENTER": (1, 0),
            "RIGHT": (2, 0),
            "MIDDLE_CENTER": (1, 2),
            "TOP_CENTER": (1, 3),
            "BOTTOM_LEFT": (0, 1),
            "TOP_LEFT": (0, 3),
            "TOP_RIGHT": (2, 3),
            "BOTTOM_RIGHT": (2, 1),
        }
        if align in alignment_map:
            horiz, vert = alignment_map[align]
            entity.dxf.halign = horiz
            entity.dxf.valign = vert

    def add_key_point(
        self,
        *,
        name: str,
        station: str,
        point: Sequence[float],
        radius: float = 0.75,
        text_rotation_deg: float = 0.0,
        leader_end: Optional[Sequence[float]] = None,
    ) -> None:
        """Draw a key point marker with optional leader and two-line annotation."""
        layer_key = "key_point"
        anchor = self._to_point_tuple(point)
        self.add_circle(anchor, radius, layer_key)

        if leader_end is not None:
            leader_target = self._to_point_tuple(leader_end)
            self.add_line(anchor, leader_target, layer_key)
            text_base = leader_target
        else:
            text_base = (anchor[0] + radius, anchor[1] + radius)

        self.add_text(
            name,
            text_base,
            height=3.5,
            rotation_deg=text_rotation_deg,
            layer_key=layer_key,
            align="BOTTOM_LEFT",
        )
        station_pos = (text_base[0], text_base[1] - 4.0)
        self.add_text(
            station,
            station_pos,
            height=3.5,
            rotation_deg=text_rotation_deg,
            layer_key=layer_key,
            align="TOP_LEFT",
        )

    def add_hm_stake(
        self,
        *,
        start: Sequence[float],
        end: Sequence[float],
        label_text: Optional[str] = None,
        label_pos: Optional[Sequence[float]] = None,
        rotation_deg: float = 0.0,
        text_height: float = 3.0,
    ) -> None:
        """Render a stake tick with optional station label."""
        layer_key = "hm_stake"
        self.add_line(start, end, layer_key)
        if label_text and label_pos is not None:
            self.add_text(
                label_text,
                label_pos,
                height=text_height,
                rotation_deg=rotation_deg,
                layer_key=layer_key,
                align="CENTER",
            )

    def add_curve_table(
        self,
        *,
        origin: Sequence[float],
        headers: List[str],
        rows: List[List[str]],
        row_height: float,
        col_widths: List[float],
        text_height: float,
    ) -> None:
        """Draw a simple curve element table with grid lines and centred text."""
        layer_key = "curve_table"
        top_left = self._to_point_tuple(origin)
        total_width = sum(col_widths)

        current_x = top_left[0]
        for width, header in zip(col_widths, headers):
            cell_center = (current_x + width / 2.0, top_left[1] - row_height / 2.0)
            self.add_text(
                header,
                cell_center,
                height=text_height,
                layer_key=layer_key,
                align="MIDDLE_CENTER",
            )
            current_x += width

        # Header underline
        self.add_line(
            (top_left[0], top_left[1] - row_height),
            (top_left[0] + total_width, top_left[1] - row_height),
            layer_key,
        )

        current_y = top_left[1] - row_height
        for row in rows:
            current_x = top_left[0]
            for width, cell_text in zip(col_widths, row):
                cell_center = (current_x + width / 2.0, current_y - row_height / 2.0)
                self.add_text(
                    cell_text,
                    cell_center,
                    height=text_height,
                    layer_key=layer_key,
                    align="MIDDLE_CENTER",
                )
                current_x += width
            current_y -= row_height
            self.add_line((top_left[0], current_y), (top_left[0] + total_width, current_y), layer_key)

        # Vertical lines including right boundary
        current_x = top_left[0]
        current_y_bottom = current_y
        for width in col_widths:
            self.add_line((current_x, top_left[1]), (current_x, current_y_bottom), layer_key)
            current_x += width
        self.add_line((current_x, top_left[1]), (current_x, current_y_bottom), layer_key)

    def draw_from_data(self, data: Dict[str, Any]) -> None:
        """Render all entities described by the provided canonical data."""
        self.validator.validate(data)

        frame = data.get("frame", {})
        if frame:
            self.add_polyline(frame.get("outer_rect", []), "frame_outer", closed=True)
            self.add_polyline(frame.get("inner_rect", []), "frame_inner", closed=True)

        if "north_arrow" in data:
            self._draw_north_arrow(data["north_arrow"])

        for key in (
            "centerline",
            "left_lane",
            "right_lane",
            "left_roadbed_edge",
            "right_roadbed_edge",
            "pi_line",
        ):
            if key in data and data[key]:
                self.add_polyline(data[key], key)

        for item in data.get("key_points", []) or []:
            self.add_key_point(**item)

        for stake in data.get("hm_stakes", []) or []:
            line = stake.get("line", {})
            label = stake.get("label", {})
            self.add_hm_stake(
                start=line.get("start", (0, 0)),
                end=line.get("end", (0, 0)),
                label_text=label.get("text"),
                label_pos=label.get("pos"),
                rotation_deg=label.get("rotation_deg", 0.0),
                text_height=label.get("height", 3.0),
            )

        if "curve_table" in data:
            self.add_curve_table(**data["curve_table"])

    def _draw_north_arrow(self, arrow: Dict[str, Any]) -> None:
        """Render a simple circular north arrow with crosshairs."""
        center = arrow.get("center", (0.0, 0.0))
        radius = float(arrow.get("radius", 10.0))
        layer_key = "north_arrow"
        self.add_circle(center, radius, layer_key)
        cx, cy = self._to_point_tuple(center)
        self.add_line((cx, cy - radius), (cx, cy + radius), layer_key)
        self.add_line((cx - radius * 0.5, cy), (cx + radius * 0.5, cy), layer_key)
        self.add_text("N", (cx, cy + radius * 0.6), height=radius * 0.6, layer_key=layer_key, align="CENTER")

    def save(self, filepath: str) -> None:
        """Serialize the DXF document to the specified file path."""
        self.doc.saveas(filepath)

    def _to_point_tuple(self, value: Sequence[float]) -> Point2D:
        """Convert any sequence with two numbers into a float tuple."""
        if len(value) < 2:
            raise ValueError(f"point must contain at least two values: {value}")
        return float(value[0]), float(value[1])
