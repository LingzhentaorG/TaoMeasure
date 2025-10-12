"""REST endpoints for the universal coordinate conversion module."""

from __future__ import annotations

import logging
import math
from typing import Any, Dict, List, Tuple

from flask import current_app, jsonify, request

from . import api_bp
from taomeasure.domain.universal_coordinate import PointRecord, UniversalCoordinateService, parse_float

logger = logging.getLogger(__name__)


def _get_service() -> UniversalCoordinateService:
    services = current_app.extensions.get("services", {})
    service = services.get("coordinate_universal")
    if service is None:
        raise RuntimeError("综合坐标转换服务未初始化")
    return service


@api_bp.route("/coordinate/universal/metadata", methods=["GET"])
def coordinate_metadata():
    """Expose reference data such as known ellipsoids."""

    service = _get_service()
    return jsonify({"success": True, "data": service.get_reference_data()})


@api_bp.route("/coordinate/universal/process", methods=["POST"])
def coordinate_process():
    """Main entry: fill datasets, estimate parameters, and execute conversions."""

    payload = request.get_json(silent=True) or {}
    service = _get_service()

    try:
        source_system = service.build_system(payload.get("source_system"), "source")
        target_system = service.build_system(payload.get("target_system"), "target")
    except Exception as exc:  # noqa: BLE001
        logger.exception("坐标系统参数解析失败: %s", exc)
        return jsonify({"success": False, "error": f"坐标系统参数解析失败: {exc}"}), 400

    options = payload.get("options") or {}
    auto_fill = options.get("auto_fill", True)
    auto_parameters = options.get("auto_parameters", True)

    raw_common: List[Dict[str, Any]] = payload.get("common_points") or []
    common_pairs: List[Tuple[PointRecord, PointRecord]] = []
    enriched_common: List[Dict[str, Any]] = []

    for entry in raw_common:
        name = entry.get("name", "")
        src_raw = entry.get("source") or {}
        tgt_raw = entry.get("target") or {}
        src_point = service.build_point(src_raw, name)
        tgt_point = service.build_point(tgt_raw, name)
        if auto_fill:
            src_point = service.fill_point_components(src_point, source_system)
            tgt_point = service.fill_point_components(tgt_point, target_system)
        enriched_common.append(
            {"name": name, "source": src_point.to_payload(), "target": tgt_point.to_payload()}
        )
        common_pairs.append((src_point, tgt_point))

    provided_params = payload.get("parameters") or {}

    seven_input = provided_params.get("seven") or {}
    four_input = provided_params.get("four") or {}

    messages: List[str] = []

    seven_solution: Dict[str, Any] = {}
    seven_source = "none"
    if seven_input.get("mode") == "manual":
        seven_solution = _parse_manual_seven_parameters(seven_input)
        seven_source = "manual"
    elif auto_parameters:
        try:
            seven_solution = service.solve_seven_parameters(common_pairs)
            seven_source = "computed"
        except Exception as exc:  # noqa: BLE001
            logger.warning("七参数解算失败: %s", exc)
            messages.append(f"七参数解算失败: {exc}")
            seven_solution = {}
            seven_source = "error"
    elif seven_input:
        seven_solution = _parse_manual_seven_parameters(seven_input)
        seven_source = "manual"

    four_solution: Dict[str, Any] = {}
    four_source = "none"
    if four_input.get("mode") == "manual":
        four_solution = _parse_manual_four_parameters(four_input)
        four_source = "manual"
    elif auto_parameters:
        try:
            four_solution = service.solve_four_parameters(common_pairs)
            four_source = "computed"
        except Exception as exc:  # noqa: BLE001
            logger.warning("四参数解算失败: %s", exc)
            messages.append(f"四参数解算失败: {exc}")
            four_solution = {}
            four_source = "error"
    elif four_input:
        four_solution = _parse_manual_four_parameters(four_input)
        four_source = "manual"

    points_payload: List[Dict[str, Any]] = payload.get("points") or []
    enriched_points: List[Dict[str, Any]] = []
    conversion_results: List[Dict[str, Any]] = []

    for raw_point in points_payload:
        point = service.build_point(raw_point, raw_point.get("name", ""))
        if auto_fill:
            point = service.fill_point_components(point, source_system)
        enriched_points.append(point.to_payload())

        try:
            result_payload = _compute_conversion(
                service,
                point,
                source_system,
                target_system,
                seven_solution if seven_source in {"manual", "computed"} else {},
                four_solution if four_source in {"manual", "computed"} else {},
            )
            conversion_results.append(result_payload)
        except Exception as exc:  # noqa: BLE001
            logger.warning("点 %s 转换失败: %s", point.name or "UNKNOWN", exc)
            messages.append(f"{point.name or '未命名'} 转换失败: {exc}")
            conversion_results.append({"name": point.name, "error": str(exc)})

    response = {
        "success": True,
        "data": {
            "source_system": source_system.to_dict(),
            "target_system": target_system.to_dict(),
            "common_points": enriched_common,
            "seven_parameters": {**seven_solution, "source": seven_source},
            "four_parameters": {**four_solution, "source": four_source},
            "points": enriched_points,
            "results": conversion_results,
        },
        "messages": messages,
    }
    return jsonify(response)


# --------------------------------------------------------------------------- #
# Helper routines
# --------------------------------------------------------------------------- #


@api_bp.route("/coordinate/batch/geodetic-to-cartesian", methods=["POST"])
def coordinate_batch_geodetic_to_cartesian():
    """Batch convert BLH to XYZ, typically used by file imports."""

    payload = request.get_json(silent=True) or {}
    rows = payload.get("points") or []
    ellipsoid = payload.get("ellipsoid")

    if not rows:
        return jsonify({"success": False, "error": "No points were provided for conversion"}), 400

    service = _get_service()
    try:
        data = service.batch_geodetic_to_cartesian(rows, ellipsoid)
        return jsonify({"success": True, "data": data})
    except ValueError as exc:
        logger.warning("Batch BLH to XYZ failed: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 400
    except Exception as exc:  # noqa: BLE001
        logger.exception("Batch BLH to XYZ raised unexpected error: %s", exc)
        return jsonify({"success": False, "error": f"Batch conversion failed: {exc}"}), 500


@api_bp.route("/coordinate/batch/cartesian-to-geodetic", methods=["POST"])
def coordinate_batch_cartesian_to_geodetic():
    """Batch convert XYZ to BLH, typically used by file imports."""

    payload = request.get_json(silent=True) or {}
    rows = payload.get("points") or []
    ellipsoid = payload.get("ellipsoid")

    if not rows:
        return jsonify({"success": False, "error": "No points were provided for conversion"}), 400

    service = _get_service()
    try:
        data = service.batch_cartesian_to_geodetic(rows, ellipsoid)
        return jsonify({"success": True, "data": data})
    except ValueError as exc:
        logger.warning("Batch XYZ to BLH failed: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 400
    except Exception as exc:  # noqa: BLE001
        logger.exception("Batch XYZ to BLH raised unexpected error: %s", exc)
        return jsonify({"success": False, "error": f"Batch conversion failed: {exc}"}), 500


# --------------------------------------------------------------------------- #
# Helper routines
# --------------------------------------------------------------------------- #


def _parse_manual_seven_parameters(raw: Dict[str, Any]) -> Dict[str, Any]:
    dx = parse_float(raw.get("dx")) or 0.0
    dy = parse_float(raw.get("dy")) or 0.0
    dz = parse_float(raw.get("dz")) or 0.0

    unit = str(raw.get("rotation_unit", raw.get("rotationUnits", "arcsec"))).lower()

    def to_radians(value: Any) -> float:
        angle = parse_float(value) or 0.0
        if unit in {"arcsec", "arc-second", "arcseconds"}:
            return math.radians(angle / 3600.0)
        if unit in {"arcmin", "arc-minute", "arcminutes"}:
            return math.radians(angle / 60.0)
        if unit in {"deg", "degree", "degrees"}:
            return math.radians(angle)
        return angle  # assume already radians

    rx = to_radians(raw.get("rx") or raw.get("rotationX"))
    ry = to_radians(raw.get("ry") or raw.get("rotationY"))
    rz = to_radians(raw.get("rz") or raw.get("rotationZ"))

    scale = parse_float(raw.get("scale"))
    if scale is not None:
        scale_delta = scale
    else:
        scale_ppm = parse_float(raw.get("scale_ppm") or raw.get("ppm"))
        scale_factor = parse_float(raw.get("scale_factor"))
        if scale_ppm is not None:
            scale_delta = scale_ppm * 1e-6
        elif scale_factor is not None:
            scale_delta = scale_factor - 1.0
        else:
            scale_delta = 0.0

    return {
        "dx": dx,
        "dy": dy,
        "dz": dz,
        "rx": rx,
        "ry": ry,
        "rz": rz,
        "scale": scale_delta,
        "scale_ppm": scale_delta * 1_000_000,
        "rotation_arcsec": {axis: value * (180 / math.pi) * 3600 for axis, value in {"rx": rx, "ry": ry, "rz": rz}.items()},
    }


def _parse_manual_four_parameters(raw: Dict[str, Any]) -> Dict[str, Any]:
    dx = parse_float(raw.get("dx")) or 0.0
    dy = parse_float(raw.get("dy")) or 0.0

    rotation_unit = str(raw.get("rotation_unit", raw.get("rotationUnits", "deg"))).lower()
    rotation_val = parse_float(raw.get("rotation") or raw.get("theta") or raw.get("angle")) or 0.0
    if rotation_unit in {"deg", "degree", "degrees"}:
        rotation = math.radians(rotation_val)
    elif rotation_unit in {"arcsec", "arc-second", "arcseconds"}:
        rotation = math.radians(rotation_val / 3600.0)
    elif rotation_unit in {"arcmin", "arc-minute", "arcminutes"}:
        rotation = math.radians(rotation_val / 60.0)
    else:
        rotation = rotation_val

    scale = parse_float(raw.get("scale"))
    if scale is not None:
        scale_delta = scale
    else:
        scale_ppm = parse_float(raw.get("scale_ppm") or raw.get("ppm"))
        scale_factor = parse_float(raw.get("scale_factor"))
        if scale_ppm is not None:
            scale_delta = scale_ppm * 1e-6
        elif scale_factor is not None:
            scale_delta = scale_factor - 1.0
        else:
            scale_delta = 0.0

    return {
        "dx": dx,
        "dy": dy,
        "rotation": rotation,
        "scale": scale_delta,
        "scale_ppm": scale_delta * 1_000_000,
        "scale_factor": 1.0 + scale_delta,
        "rotation_arcsec": rotation * (180 / math.pi) * 3600,
    }


def _compute_conversion(
    service: UniversalCoordinateService,
    source_point: PointRecord,
    source_system,
    target_system,
    seven_parameters: Dict[str, Any],
    four_parameters: Dict[str, Any],
) -> Dict[str, Any]:
    """Run the cascade of transformations for a single point."""

    working_point = source_point.clone()
    if any(
        value is None
        for value in (working_point.B, working_point.L, working_point.X, working_point.Y, working_point.Z, working_point.x, working_point.y)
    ):
        working_point = service.fill_point_components(working_point, source_system)

    target_point = PointRecord(name=working_point.name)

    if seven_parameters and all(key in seven_parameters for key in ("dx", "dy", "dz")):
        X, Y, Z = service.apply_seven_parameters(working_point, seven_parameters)
        target_point.X, target_point.Y, target_point.Z = X, Y, Z
        target_point.diagnostics.append("XYZ 通过七参数转换获得。")
    else:
        if None in (working_point.X, working_point.Y, working_point.Z):
            raise ValueError("缺少七参数或源点 XYZ，无法完成空间坐标转换。")
        target_point.X, target_point.Y, target_point.Z = working_point.X, working_point.Y, working_point.Z
        target_point.diagnostics.append("未提供七参数，直接沿用源空间坐标。")

    target_point = service.fill_point_components(target_point, target_system)

    plane_four = None
    if four_parameters and working_point.x is not None and working_point.y is not None:
        plane_x, plane_y = service.apply_four_parameters(working_point, four_parameters)
        plane_four = {
            "x": plane_x,
            "y": plane_y,
            "rotation_arcsec": four_parameters.get("rotation_arcsec"),
            "scale_factor": four_parameters.get("scale_factor", 1.0),
        }

    payload = {
        "name": working_point.name,
        "source": working_point.to_payload(),
        "target": target_point.to_payload(),
    }
    if plane_four is not None:
        payload["plane_from_four_parameters"] = plane_four
    return payload
