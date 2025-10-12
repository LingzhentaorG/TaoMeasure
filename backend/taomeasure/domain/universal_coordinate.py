"""Unified coordinate conversion service with automatic data completion."""

from __future__ import annotations

import math
from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional, Tuple

import numpy as np


@dataclass
class Ellipsoid:
    """Basic ellipsoid definition."""

    name: str
    semi_major_axis: float
    flattening: float
    metadata: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        self._refresh()

    def _refresh(self) -> None:
        self.semi_minor_axis = self.semi_major_axis * (1 - self.flattening)
        self.first_eccentricity_squared = 2 * self.flattening - self.flattening**2
        self.second_eccentricity_squared = (
            self.first_eccentricity_squared / (1 - self.first_eccentricity_squared)
        )

    def to_dict(self) -> Dict[str, Any]:
        """Return serialisable representation."""

        payload = {
            "name": self.name,
            "a": self.semi_major_axis,
            "f": self.flattening,
            "f_inverse": 1 / self.flattening if self.flattening else None,
            "b": self.semi_minor_axis,
            "e2": self.first_eccentricity_squared,
            "ep2": self.second_eccentricity_squared,
        }
        if self.metadata:
            payload["metadata"] = self.metadata
        return payload


@dataclass
class ProjectionParams:
    """Gaussian projection configuration."""

    central_meridian: Optional[float] = None
    zone_width: float = 3.0
    false_easting: float = 500000.0
    false_northing: float = 0.0
    scale_factor: float = 1.0
    projection_height: float = 0.0
    auto_false_easting: bool = True
    auto_false_northing: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        payload = asdict(self)
        payload.pop("metadata", None)
        if self.metadata:
            payload["metadata"] = self.metadata
        return payload


@dataclass
class GeoidParams:
    """Geoid undulation / normal height correction."""

    undulation: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {"undulation": self.undulation}


@dataclass
class CoordinateSystemConfig:
    """Bundle of ellipsoid + projection + geoid information."""

    name: str
    ellipsoid: Ellipsoid
    projection: ProjectionParams
    geoid: GeoidParams
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        payload = {
            "name": self.name,
            "ellipsoid": self.ellipsoid.to_dict(),
            "projection": self.projection.to_dict(),
            "geoid": self.geoid.to_dict(),
        }
        if self.metadata:
            payload["metadata"] = self.metadata
        return payload


@dataclass
class PointRecord:
    """Unified container for per-point values."""

    name: str = ""
    B: Optional[float] = None
    L: Optional[float] = None
    H: Optional[float] = None
    X: Optional[float] = None
    Y: Optional[float] = None
    Z: Optional[float] = None
    x: Optional[float] = None
    y: Optional[float] = None
    h: Optional[float] = None
    zone: Optional[int] = None
    source_metadata: Dict[str, Any] = field(default_factory=dict)
    diagnostics: List[str] = field(default_factory=list)

    def clone(self) -> "PointRecord":
        """Create a shallow copy."""

        duplicate = PointRecord(
            name=self.name,
            B=self.B,
            L=self.L,
            H=self.H,
            X=self.X,
            Y=self.Y,
            Z=self.Z,
            x=self.x,
            y=self.y,
            h=self.h,
            zone=self.zone,
            source_metadata=dict(self.source_metadata),
            diagnostics=list(self.diagnostics),
        )
        return duplicate

    def to_payload(self, include_dms: bool = True) -> Dict[str, Any]:
        """Return JSON ready data."""

        payload: Dict[str, Any] = {
            "name": self.name,
            "B": self.B,
            "L": self.L,
            "H": self.H,
            "X": self.X,
            "Y": self.Y,
            "Z": self.Z,
            "x": self.x,
            "y": self.y,
            "h": self.h,
            "zone": self.zone,
        }
        if include_dms:
            payload["B_dms"] = format_dms(self.B) if self.B is not None else None
            payload["L_dms"] = format_dms(self.L) if self.L is not None else None
        if self.diagnostics:
            payload["diagnostics"] = self.diagnostics
        if self.source_metadata:
            payload["meta"] = self.source_metadata
        return payload


def parse_float(value: Any) -> Optional[float]:
    """Convert arbitrary input to float."""

    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return None
        stripped = stripped.replace(",", "")
        try:
            return float(stripped)
        except ValueError:
            return None
    return None


def parse_angle(value: Any) -> Optional[float]:
    """Parse an angle expressed in decimal degrees or DMS string."""

    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip()
    if not text:
        return None
    normalized = (
        text.replace("：", ":")
        .replace("度", "°")
        .replace("分", "′")
        .replace("秒", "″")
        .replace("'", "′")
        .replace('"', "″")
    )
    if ":" in normalized and all(part for part in normalized.split(":")):
        parts = normalized.split(":")
    else:
        for token in ["°", "˚", "º", "∘"]:
            normalized = normalized.replace(token, " ")
        normalized = normalized.replace("′", " ")
        normalized = normalized.replace("″", " ")
        parts = normalized.split()
    try:
        if len(parts) == 1:
            return float(parts[0])
        degrees = float(parts[0])
        minutes = float(parts[1]) if len(parts) > 1 else 0.0
        seconds = float(parts[2]) if len(parts) > 2 else 0.0
        sign = -1 if degrees < 0 else 1
        degrees = abs(degrees)
        decimal = degrees + minutes / 60.0 + seconds / 3600.0
        return sign * decimal
    except (ValueError, TypeError):
        try:
            return float(text)
        except (ValueError, TypeError):
            return None


def format_dms(value: Optional[float], decimals: int = 3) -> Optional[str]:
    """Format decimal degrees into DMS string."""

    if value is None:
        return None
    sign = "-" if value < 0 else ""
    decimal = abs(value)
    degrees = int(decimal)
    minutes_float = (decimal - degrees) * 60
    minutes = int(minutes_float)
    seconds = (minutes_float - minutes) * 60
    return f"{sign}{degrees}°{minutes:02d}′{seconds:0{4 + decimals}.{decimals}f}″"


class UniversalCoordinateService:
    """High level orchestration for the universal coordinate engine."""

    def __init__(self) -> None:
        self._ellipsoid_registry: Dict[str, Dict[str, float]] = {
            "CGCS2000": {"a": 6378137.0, "f_inverse": 298.257222101},
            "WGS84": {"a": 6378137.0, "f_inverse": 298.257223563},
            "Beijing54": {"a": 6378245.0, "f_inverse": 298.3},
            "Xian80": {"a": 6378140.0, "f_inverse": 298.257},
            "IAG75": {"a": 6378140.0, "f_inverse": 298.257},
        }

    # ------------------------------------------------------------------ #
    # Reference data helpers
    # ------------------------------------------------------------------ #
    def get_reference_data(self) -> Dict[str, Any]:
        """Expose internal reference tables (ellipsoids, defaults, etc.)."""

        ellipsoids = []
        for name, payload in self._ellipsoid_registry.items():
            f_inv = payload.get("f_inverse")
            f = 1 / f_inv if f_inv else payload.get("f")
            item = Ellipsoid(name=name, semi_major_axis=payload["a"], flattening=f)
            ellipsoids.append(item.to_dict())
        return {
            "ellipsoids": ellipsoids,
            "defaults": {
                "projection": {
                    "zone_width": 3,
                    "false_easting": 500000,
                    "false_northing": 0,
                    "scale_factor": 1.0,
                    "projection_height": 0,
                },
                "geoid": {"undulation": 0},
            },
        }

    def build_system(self, raw: Dict[str, Any] | None, fallback_name: str) -> CoordinateSystemConfig:
        """Convert arbitrary payload into a consistent system configuration."""

        raw = raw or {}
        name = raw.get("name") or fallback_name

        ellipsoid_payload = raw.get("ellipsoid") or {}
        ellipsoid_name = ellipsoid_payload.get("name")

        if ellipsoid_name and ellipsoid_name in self._ellipsoid_registry:
            registry_entry = self._ellipsoid_registry[ellipsoid_name]
            a = parse_float(ellipsoid_payload.get("a")) or registry_entry["a"]
            f_inv_payload = parse_float(
                ellipsoid_payload.get("f_inverse") or ellipsoid_payload.get("inverse_flattening")
            )
            f_payload = parse_float(ellipsoid_payload.get("f"))
            if f_payload:
                flattening = f_payload
            elif f_inv_payload:
                flattening = 1 / f_inv_payload
            else:
                flattening = 1 / registry_entry.get("f_inverse", 298.257223563)
        else:
            registry_entry = self._ellipsoid_registry["CGCS2000"]
            a = parse_float(ellipsoid_payload.get("a")) or registry_entry["a"]
            f_inv_payload = parse_float(
                ellipsoid_payload.get("f_inverse") or ellipsoid_payload.get("inverse_flattening")
            )
            f_payload = parse_float(ellipsoid_payload.get("f"))
            if f_payload:
                flattening = f_payload
            elif f_inv_payload:
                flattening = 1 / f_inv_payload
            else:
                flattening = 1 / registry_entry.get("f_inverse", 298.257222101)

        ellipsoid = Ellipsoid(
            name=ellipsoid_name or name,
            semi_major_axis=a,
            flattening=flattening,
            metadata={k: v for k, v in ellipsoid_payload.items() if k not in {"a", "f", "f_inverse"}},
        )

        projection_payload = raw.get("projection") or {}
        projection = ProjectionParams(
            central_meridian=parse_float(
                projection_payload.get("central_meridian") or projection_payload.get("L0")
            ),
            zone_width=parse_float(projection_payload.get("zone_width")) or 3.0,
            false_easting=parse_float(projection_payload.get("false_easting")) or 500000.0,
            false_northing=parse_float(projection_payload.get("false_northing")) or 0.0,
            scale_factor=parse_float(projection_payload.get("scale_factor")) or 1.0,
            projection_height=parse_float(projection_payload.get("projection_height")) or 0.0,
            auto_false_easting=bool(
                projection_payload.get("auto_false_easting")
                if projection_payload.get("auto_false_easting") is not None
                else True
            ),
            auto_false_northing=bool(
                projection_payload.get("auto_false_northing")
                if projection_payload.get("auto_false_northing") is not None
                else False
            ),
            metadata={
                k: v
                for k, v in projection_payload.items()
                if k
                not in {
                    "central_meridian",
                    "L0",
                    "zone_width",
                    "false_easting",
                    "false_northing",
                    "scale_factor",
                    "projection_height",
                    "auto_false_easting",
                    "auto_false_northing",
                }
            },
        )

        geoid_payload = raw.get("geoid") or raw.get("height") or {}
        geoid = GeoidParams(undulation=parse_float(geoid_payload.get("undulation")) or 0.0)

        return CoordinateSystemConfig(name=name, ellipsoid=ellipsoid, projection=projection, geoid=geoid)

    # ------------------------------------------------------------------ #
    # Point level helpers
    # ------------------------------------------------------------------ #
    def build_point(self, raw: Dict[str, Any] | None, default_name: str = "") -> PointRecord:
        """Convert payload to PointRecord object."""

        raw = raw or {}
        point = PointRecord(name=raw.get("name") or default_name)
        point.B = parse_angle(raw.get("B") or raw.get("lat") or raw.get("latitude"))
        point.L = parse_angle(raw.get("L") or raw.get("lon") or raw.get("longitude"))
        point.H = parse_float(raw.get("H") or raw.get("H_ellipsoid") or raw.get("ellipsoidal_height"))
        point.X = parse_float(raw.get("X"))
        point.Y = parse_float(raw.get("Y"))
        point.Z = parse_float(raw.get("Z"))
        point.x = parse_float(raw.get("x"))
        point.y = parse_float(raw.get("y"))
        point.h = parse_float(raw.get("h") or raw.get("H_normal") or raw.get("orthometric_height"))
        point.zone = raw.get("zone")
        return point

    def fill_point_components(
        self,
        point: PointRecord,
        system: CoordinateSystemConfig,
        *,
        prefer_h_over_H: bool = False,
    ) -> PointRecord:
        """Derive missing coordinate components whenever feasible."""

        ellipsoid = system.ellipsoid
        projection = system.projection
        geoid = system.geoid

        if point.H is None and point.h is not None:
            point.H = point.h + geoid.undulation
            point.diagnostics.append("Ellipsoidal height inferred from orthometric height + undulation.")
        elif point.H is not None and point.h is None:
            point.h = point.H - geoid.undulation
            point.diagnostics.append("Orthometric height inferred from ellipsoidal height - undulation.")

        if point.B is not None and point.L is not None and (point.X is None or point.Y is None or point.Z is None):
            height_for_xyz = point.H if (point.H is not None and not prefer_h_over_H) else (point.h or point.H or 0.0)
            point.X, point.Y, point.Z = self._blh_to_xyz(point.B, point.L, height_for_xyz, ellipsoid)
            point.diagnostics.append("XYZ computed from BLH.")

        if (point.X is not None and point.Y is not None and point.Z is not None) and (
            point.B is None or point.L is None or (point.H is None and not prefer_h_over_H)
        ):
            B, L, H = self._xyz_to_blh(point.X, point.Y, point.Z, ellipsoid)
            if point.B is None:
                point.B = B
            if point.L is None:
                point.L = L
            if point.H is None:
                point.H = H
            point.diagnostics.append("BLH derived from XYZ.")

        if point.h is None and point.H is not None:
            point.h = point.H - geoid.undulation

        central_meridian = projection.central_meridian
        if central_meridian is None and point.L is not None:
            if point.zone is not None:
                central_meridian = self._central_meridian_from_zone(point.zone, projection.zone_width)
                point.diagnostics.append(
                    f"Central meridian resolved from zone {point.zone} and width {projection.zone_width}°."
                )
            else:
                central_meridian = self._central_meridian_from_longitude(point.L, projection.zone_width)
                point.diagnostics.append(
                    f"Central meridian resolved from longitude {point.L:g} and zone width {projection.zone_width}°."
                )

        if central_meridian is not None and point.B is not None and point.L is not None and (
            point.x is None or point.y is None
        ):
            x, y = self._gauss_forward(point.B, point.L, central_meridian, projection, ellipsoid)
            point.x, point.y = x, y
            point.diagnostics.append("Gauss projection coordinates derived from BL.")

        if (
            central_meridian is not None
            and point.x is not None
            and point.y is not None
            and (point.B is None or point.L is None)
        ):
            B, L = self._gauss_inverse(point.x, point.y, central_meridian, projection, ellipsoid)
            if point.B is None:
                point.B = B
            if point.L is None:
                point.L = L
            point.diagnostics.append("BL inferred from Gauss projection coordinates.")

        return point

    # ------------------------------------------------------------------ #
    # Parameter estimation
    # ------------------------------------------------------------------ #
    def solve_seven_parameters(self, points: List[Tuple[PointRecord, PointRecord]]) -> Dict[str, Any]:
        """Least squares solution for Bursa-Wolf parameters."""

        if len(points) < 3:
            raise ValueError("解算七参数至少需要 3 个公共点。")

        observations = []
        for source, target in points:
            if None in (source.X, source.Y, source.Z, target.X, target.Y, target.Z):
                raise ValueError(f"公共点 {source.name or target.name or '?'} 缺少完整的 XYZ 坐标。")
            observations.append((source, target))

        A_rows: List[List[float]] = []
        L_rows: List[float] = []

        for source, target in observations:
            dx = target.X - source.X
            dy = target.Y - source.Y
            dz = target.Z - source.Z

            A_rows.extend(
                [
                    [1, 0, 0, 0, source.Z, -source.Y, source.X],
                    [0, 1, 0, -source.Z, 0, source.X, source.Y],
                    [0, 0, 1, source.Y, -source.X, 0, source.Z],
                ]
            )
            scale_term = source.X
            L_rows.extend([dx, dy, dz])

        A = np.asarray(A_rows, dtype=float)
        L_vec = np.asarray(L_rows, dtype=float)

        # Column ordering: dx, dy, dz, rx, ry, rz, m
        sol, *_ = np.linalg.lstsq(A, L_vec, rcond=None)

        dx, dy, dz, rx, ry, rz, m = sol.tolist()

        residuals = []
        vx_total = vy_total = vz_total = 0.0
        for source, target in observations:
            x_est, y_est, z_est = self.apply_seven_parameters(source, {"dx": dx, "dy": dy, "dz": dz, "rx": rx, "ry": ry, "rz": rz, "scale": m})
            vx = target.X - x_est
            vy = target.Y - y_est
            vz = target.Z - z_est
            residuals.append(
                {
                    "name": source.name or target.name,
                    "vx": vx,
                    "vy": vy,
                    "vz": vz,
                }
            )
            vx_total += vx**2
            vy_total += vy**2
            vz_total += vz**2

        count = len(observations)
        rmse = {
            "x": math.sqrt(vx_total / count),
            "y": math.sqrt(vy_total / count),
            "z": math.sqrt(vz_total / count),
        }

        return {
            "dx": dx,
            "dy": dy,
            "dz": dz,
            "rx": rx,
            "ry": ry,
            "rz": rz,
            "scale": m,
            "scale_ppm": m * 1_000_000,
            "rotation_arcsec": {axis: value * (180 / math.pi) * 3600 for axis, value in {"rx": rx, "ry": ry, "rz": rz}.items()},
            "residuals": residuals,
            "rmse": rmse,
            "observations": count,
        }

    def solve_four_parameters(self, points: List[Tuple[PointRecord, PointRecord]]) -> Dict[str, Any]:
        """2D similarity transformation via Procrustes alignment."""

        valid_pairs = [
            (src, tgt)
            for src, tgt in points
            if src.x is not None and src.y is not None and tgt.x is not None and tgt.y is not None
        ]
        if len(valid_pairs) < 2:
            raise ValueError("解算四参数至少需要 2 个公共点。")

        src_coords = np.array([[p.x, p.y] for p, _ in valid_pairs], dtype=float)
        tgt_coords = np.array([[p.x, p.y] for _, p in valid_pairs], dtype=float)

        src_centroid = src_coords.mean(axis=0)
        tgt_centroid = tgt_coords.mean(axis=0)

        src_centered = src_coords - src_centroid
        tgt_centered = tgt_coords - tgt_centroid

        H = src_centered.T @ tgt_centered
        U, S, Vt = np.linalg.svd(H)
        R = Vt.T @ U.T
        if np.linalg.det(R) < 0:
            Vt[-1, :] *= -1
            R = Vt.T @ U.T

        scale = S.sum() / (src_centered**2).sum()
        translation = tgt_centroid - scale * (R @ src_centroid)

        dx, dy = translation.tolist()
        rotation = math.atan2(R[1, 0], R[0, 0])
        scale_delta = scale - 1

        residuals = []
        vx_total = vy_total = 0.0
        for src_point, tgt_point in valid_pairs:
            x_trans, y_trans = self.apply_four_parameters(
                src_point, {"dx": dx, "dy": dy, "rotation": rotation, "scale": scale_delta}
            )
            vx = tgt_point.x - x_trans if tgt_point.x is not None else None
            vy = tgt_point.y - y_trans if tgt_point.y is not None else None
            if vx is not None:
                residuals.append({"name": src_point.name or tgt_point.name, "vx": vx, "vy": vy})
                vx_total += vx**2
                vy_total += vy**2

        count = len(residuals)
        rmse = {
            "x": math.sqrt(vx_total / count) if count else None,
            "y": math.sqrt(vy_total / count) if count else None,
        }

        return {
            "dx": dx,
            "dy": dy,
            "rotation": rotation,
            "rotation_arcsec": rotation * (180 / math.pi) * 3600,
            "scale": scale_delta,
            "scale_ppm": scale_delta * 1_000_000,
            "scale_factor": scale,
            "residuals": residuals,
            "rmse": rmse,
            "observations": len(valid_pairs),
        }

    # ------------------------------------------------------------------ #
    # Transformation application
    # ------------------------------------------------------------------ #
    def apply_seven_parameters(self, point: PointRecord, params: Dict[str, float]) -> Tuple[float, float, float]:
        """Apply Bursa-Wolf parameters to XYZ."""

        if None in (point.X, point.Y, point.Z):
            raise ValueError("Point lacks XYZ values for seven-parameter transformation.")

        dx = params.get("dx", 0.0)
        dy = params.get("dy", 0.0)
        dz = params.get("dz", 0.0)
        rx = params.get("rx", 0.0)
        ry = params.get("ry", 0.0)
        rz = params.get("rz", 0.0)
        m = params.get("scale", 0.0)

        scale_factor = 1.0 + m
        x = point.X
        y = point.Y
        z = point.Z

        x_new = dx + scale_factor * (x - rz * y + ry * z)
        y_new = dy + scale_factor * (rz * x + y - rx * z)
        z_new = dz + scale_factor * (-ry * x + rx * y + z)

        return x_new, y_new, z_new

    def apply_four_parameters(self, point: PointRecord, params: Dict[str, float]) -> Tuple[float, float]:
        """Apply 2D similarity parameters to plane coordinates."""

        if point.x is None or point.y is None:
            raise ValueError("Point lacks plane coordinates for four-parameter transformation.")

        dx = params.get("dx", 0.0)
        dy = params.get("dy", 0.0)
        rotation = params.get("rotation", 0.0)
        scale = 1.0 + params.get("scale", 0.0)

        cos_a = math.cos(rotation)
        sin_a = math.sin(rotation)
        x_new = dx + scale * (point.x * cos_a - point.y * sin_a)
        y_new = dy + scale * (point.x * sin_a + point.y * cos_a)
        return x_new, y_new

    # ------------------------------------------------------------------ #
    # Batch conversions used by file import
    # ------------------------------------------------------------------ #
    def batch_geodetic_to_cartesian(self, rows: List[Dict[str, Any]], ellipsoid_name: Optional[str] = None) -> Dict[str, Any]:
        """Convert BLH to XYZ for a batch of points."""

        system_payload: Dict[str, Any] = {"name": ellipsoid_name or "临时大地坐标系"}
        if ellipsoid_name:
            system_payload["ellipsoid"] = {"name": ellipsoid_name}
        system = self.build_system(system_payload, "source")

        results: List[Dict[str, Any]] = []
        success = 0

        for raw in rows:
            try:
                point = self.build_point(
                    {
                        "name": raw.get("name"),
                        "B": raw.get("lat") or raw.get("B"),
                        "L": raw.get("lon") or raw.get("L"),
                        "H": raw.get("height") or raw.get("H") or raw.get("h"),
                    },
                    raw.get("name", ""),
                )
                point = self.fill_point_components(point, system)
                if None in (point.X, point.Y, point.Z):
                    raise ValueError("无法计算XYZ坐标，检查输入数据是否完整。")
                results.append(
                    {
                        "name": point.name,
                        "lat": point.B,
                        "lon": point.L,
                        "height": point.H,
                        "x": point.X,
                        "y": point.Y,
                        "z": point.Z,
                        "lat_dms": format_dms(point.B),
                        "lon_dms": format_dms(point.L),
                    }
                )
                success += 1
            except Exception as exc:  # noqa: BLE001
                results.append({"name": raw.get("name") or "", "error": str(exc)})

        return {"results": results, "count": success, "ellipsoid": system.ellipsoid.name}

    def batch_cartesian_to_geodetic(
        self,
        rows: List[Dict[str, Any]],
        ellipsoid_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Convert XYZ to BLH for a batch of points."""

        system_payload: Dict[str, Any] = {"name": ellipsoid_name or "临时空间直角坐标系"}
        if ellipsoid_name:
            system_payload["ellipsoid"] = {"name": ellipsoid_name}
        system = self.build_system(system_payload, "source")

        results: List[Dict[str, Any]] = []
        success = 0

        for raw in rows:
            try:
                point = self.build_point(
                    {
                        "name": raw.get("name"),
                        "X": raw.get("x") or raw.get("X"),
                        "Y": raw.get("y") or raw.get("Y"),
                        "Z": raw.get("z") or raw.get("Z"),
                    },
                    raw.get("name", ""),
                )
                point = self.fill_point_components(point, system)
                if point.B is None or point.L is None:
                    raise ValueError("无法计算经纬度，请确认XYZ坐标是否有效。")
                results.append(
                    {
                        "name": point.name,
                        "x": point.X,
                        "y": point.Y,
                        "z": point.Z,
                        "lat": point.B,
                        "lon": point.L,
                        "height": point.H,
                        "lat_dms": format_dms(point.B),
                        "lon_dms": format_dms(point.L),
                    }
                )
                success += 1
            except Exception as exc:  # noqa: BLE001
                results.append({"name": raw.get("name") or "", "error": str(exc)})

        return {"results": results, "count": success, "ellipsoid": system.ellipsoid.name}

    # ------------------------------------------------------------------ #
    # Internal geodetic utilities
    # ------------------------------------------------------------------ #
    def _blh_to_xyz(self, B: float, L: float, H: float, ellipsoid: Ellipsoid) -> Tuple[float, float, float]:
        B_rad = math.radians(B)
        L_rad = math.radians(L)
        sin_B = math.sin(B_rad)
        cos_B = math.cos(B_rad)
        N = ellipsoid.semi_major_axis / math.sqrt(1 - ellipsoid.first_eccentricity_squared * sin_B**2)
        X = (N + H) * cos_B * math.cos(L_rad)
        Y = (N + H) * cos_B * math.sin(L_rad)
        Z = (N * (1 - ellipsoid.first_eccentricity_squared) + H) * sin_B
        return X, Y, Z

    def _xyz_to_blh(self, X: float, Y: float, Z: float, ellipsoid: Ellipsoid) -> Tuple[float, float, float]:
        L = math.atan2(Y, X)
        p = math.sqrt(X**2 + Y**2)
        B = math.atan2(Z, p * (1 - ellipsoid.first_eccentricity_squared))
        H = 0.0
        for _ in range(10):
            sin_B = math.sin(B)
            N = ellipsoid.semi_major_axis / math.sqrt(1 - ellipsoid.first_eccentricity_squared * sin_B**2)
            H_new = p / math.cos(B) - N
            B_new = math.atan2(Z, p * (1 - ellipsoid.first_eccentricity_squared * N / (N + H_new)))
            if abs(B_new - B) < 1e-12 and abs(H_new - H) < 1e-6:
                B, H = B_new, H_new
                break
            B, H = B_new, H_new
        return math.degrees(B), math.degrees(L), H

    def _gauss_forward(
        self,
        lat: float,
        lon: float,
        central_meridian: float,
        projection: ProjectionParams,
        ellipsoid: Ellipsoid,
    ) -> Tuple[float, float]:
        B = math.radians(lat)
        L = math.radians(lon)
        L0 = math.radians(central_meridian)
        l = L - L0

        sin_B = math.sin(B)
        cos_B = math.cos(B)
        tan_B = math.tan(B)

        N = ellipsoid.semi_major_axis / math.sqrt(1 - ellipsoid.first_eccentricity_squared * sin_B**2)
        eta2 = ellipsoid.second_eccentricity_squared * cos_B**2

        X = self._meridian_arc_length(B, ellipsoid)

        l2 = l * l
        cos2 = cos_B * cos_B
        t2 = tan_B * tan_B

        x = (
            X
            + N
            * sin_B
            * cos_B
            * l2
            / 2
            * (
                1
                + l2
                * cos2
                / 12
                * (5 - t2 + 9 * eta2 + 4 * eta2**2)
                + l2 * l2 * cos2 * cos2 / 360 * (61 - 58 * t2 + t2**2)
            )
        )

        y = (
            N
            * cos_B
            * l
            * (
                1
                + l2 * cos2 / 6 * (1 - t2 + eta2)
                + l2 * l2 * cos2 * cos2 / 120 * (5 - 18 * t2 + t2**2 + 14 * eta2 - 58 * eta2 * t2)
            )
        )

        scale_factor = projection.scale_factor or 1.0
        if projection.projection_height:
            scale_factor *= 1 + projection.projection_height / (
                ellipsoid.semi_major_axis + projection.projection_height
            )
        x *= scale_factor
        y *= scale_factor

        false_easting = projection.false_easting if not projection.auto_false_easting else 500000.0
        false_northing = projection.false_northing if not projection.auto_false_northing else 0.0

        return x + false_northing, y + false_easting

    def _gauss_inverse(
        self,
        x: float,
        y: float,
        central_meridian: float,
        projection: ProjectionParams,
        ellipsoid: Ellipsoid,
    ) -> Tuple[float, float]:
        false_easting = projection.false_easting if not projection.auto_false_easting else 500000.0
        false_northing = projection.false_northing if not projection.auto_false_northing else 0.0
        x_adj = x - false_northing
        y_adj = y - false_easting

        scale_factor = projection.scale_factor or 1.0
        if projection.projection_height:
            scale_factor *= 1 + projection.projection_height / (
                ellipsoid.semi_major_axis + projection.projection_height
            )
        if scale_factor != 0:
            x_adj /= scale_factor
            y_adj /= scale_factor

        Bf = self._footpoint_latitude(x_adj, ellipsoid)

        sin_Bf = math.sin(Bf)
        cos_Bf = math.cos(Bf)
        tan_Bf = math.tan(Bf)
        eta2f = ellipsoid.second_eccentricity_squared * cos_Bf**2
        Nf = ellipsoid.semi_major_axis / math.sqrt(1 - ellipsoid.first_eccentricity_squared * sin_Bf**2)
        Mf = ellipsoid.semi_major_axis * (1 - ellipsoid.first_eccentricity_squared) / (
            1 - ellipsoid.first_eccentricity_squared * sin_Bf**2
        ) ** (3 / 2)

        yN = y_adj / Nf
        y2 = yN**2

        B = Bf - (tan_Bf / Mf) * y_adj**2 / (2 * Nf) * (
            1
            - y2 / 12 * (5 + 3 * tan_Bf**2 + eta2f - 9 * eta2f * tan_Bf**2)
            + y2 * y2 / 360 * (61 + 90 * tan_Bf**2 + 45 * tan_Bf**4)
        )

        l = yN * (
            1
            - y2 / 6 * (1 + 2 * tan_Bf**2 + eta2f)
            + y2 * y2 / 120 * (5 + 28 * tan_Bf**2 + 24 * tan_Bf**4 + 6 * eta2f + 8 * eta2f * tan_Bf**2)
        )

        lat = math.degrees(B)
        lon = math.degrees(l) + central_meridian
        return lat, lon

    def _meridian_arc_length(self, B: float, ellipsoid: Ellipsoid) -> float:
        e2 = ellipsoid.first_eccentricity_squared
        a = ellipsoid.semi_major_axis
        A0 = 1 - e2 / 4 - 3 * e2**2 / 64 - 5 * e2**3 / 256
        A2 = 3 / 8 * (e2 + e2**2 / 4 + 15 * e2**3 / 128)
        A4 = 15 / 256 * (e2**2 + 3 * e2**3 / 4)
        A6 = 35 * e2**3 / 3072
        return a * (A0 * B - A2 * math.sin(2 * B) + A4 * math.sin(4 * B) - A6 * math.sin(6 * B))

    def _footpoint_latitude(self, x: float, ellipsoid: Ellipsoid) -> float:
        Bf = x / ellipsoid.semi_major_axis
        for _ in range(10):
            X_calc = self._meridian_arc_length(Bf, ellipsoid)
            if abs(X_calc - x) < 1e-10:
                break
            sin_Bf = math.sin(Bf)
            term = ellipsoid.semi_major_axis * (1 - ellipsoid.first_eccentricity_squared * sin_Bf**2) / math.sqrt(
                1 - ellipsoid.first_eccentricity_squared * sin_Bf**2
            )
            Bf -= (X_calc - x) / term
        return Bf

    def _central_meridian_from_longitude(self, lon: float, zone_width: float) -> float:
        if zone_width not in (3, 6):
            return round(lon / zone_width) * zone_width
        zone = math.floor((lon + zone_width / 2) / zone_width)
        return zone * zone_width

    def _central_meridian_from_zone(self, zone: int, zone_width: float) -> float:
        return zone * zone_width - zone_width / 2
