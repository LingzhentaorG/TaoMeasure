"""坐标系、投影与参数转换接口集合。"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, Iterable, List, Sequence, Tuple

from flask import current_app, jsonify, request

from . import api_bp
from taomeasure.domain import coordinate_transformations as transform_utils

logger = logging.getLogger(__name__)


def _get_transformer():
    """获取坐标转换服务实例。"""

    services = current_app.extensions.get("services", {})
    transformer = services.get("coordinate_transformer")
    if transformer is None:
        raise RuntimeError("坐标转换服务未初始化")
    return transformer


@api_bp.route("/coordinate-transform", methods=["POST"])
def transform_coordinate():
    """执行高斯正算/反算坐标转换。"""

    payload = request.get_json(silent=True) or {}
    if not payload:
        return jsonify({"success": False, "error": "未提供有效的 JSON 数据"}), 400

    points = payload.get("points", [])
    operation = payload.get("operation", payload.get("type", "forward"))

    params = payload.get("params", {})
    central_meridian = params.get("central_meridian", payload.get("central_meridian", 0))
    projection_height = params.get("projection_height", payload.get("projection_height", 0))
    add_500km = params.get("add_500km", payload.get("add_500km", True))
    ellipsoid = params.get("ellipsoid", payload.get("ellipsoid", "WGS84"))

    transform_type = {
        "gauss_forward": "forward",
        "gauss_inverse": "inverse",
    }.get(operation, operation)

    if not points:
        return jsonify({"success": False, "error": "需至少提供一个坐标点"}), 400

    try:
        transformer = _get_transformer()
        transformer.set_ellipsoid(ellipsoid)
    except Exception as exc:  # noqa: BLE001
        logger.exception("坐标转换服务初始化失败: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500

    results: List[Dict[str, Any]] = []

    for point in points:
        try:
            name = point.get("name", "")

            if transform_type == "forward":
                lat = point.get("lat") or point.get("coord1")
                lon = point.get("lon") or point.get("coord2")

                if isinstance(lat, str):
                    lat = transformer.dms_to_decimal(lat)
                if isinstance(lon, str):
                    lon = transformer.dms_to_decimal(lon)

                x, y = transformer.gauss_forward(lat, lon, central_meridian, projection_height, add_500km)

                results.append(
                    {
                        "name": name,
                        "input_lat": lat,
                        "input_lon": lon,
                        "output_x": x,
                        "output_y": y,
                        "lat_dms": transformer.decimal_to_dms(lat),
                        "lon_dms": transformer.decimal_to_dms(lon),
                    }
                )

            elif transform_type == "inverse":
                x = point.get("x") or point.get("coord1")
                y = point.get("y") or point.get("coord2")

                lat, lon = transformer.gauss_inverse(x, y, central_meridian, projection_height, add_500km)

                results.append(
                    {
                        "name": name,
                        "input_x": x,
                        "input_y": y,
                        "output_lat": lat,
                        "output_lon": lon,
                        "lat_dms": transformer.decimal_to_dms(lat),
                        "lon_dms": transformer.decimal_to_dms(lon),
                    }
                )

            else:
                raise ValueError(f"未支持的转换类型: {transform_type}")

        except Exception as point_error:  # noqa: BLE001
            point_name = point.get("name", "")
            logger.exception("处理坐标点 %s 时出错: %s", point_name, point_error)
            results.append({"name": point_name, "error": str(point_error)})

    success_count = len([item for item in results if "error" not in item])
    logger.info(
        "坐标转换完成: 类型=%s, 输入=%d, 成功=%d, 椭球=%s",
        transform_type,
        len(points),
        success_count,
        ellipsoid,
    )

    response = {
        "success": True,
        "data": results,
        "transform_type": transform_type,
        "parameters": {
            "central_meridian": central_meridian,
            "projection_height": projection_height,
            "add_500km": add_500km,
            "ellipsoid": ellipsoid,
        },
        "points_count": len(points),
        "timestamp": datetime.now().isoformat(),
    }
    return jsonify(response)


@api_bp.route("/xyz-to-blh", methods=["POST"])
def convert_xyz_to_blh():
    """空间直角坐标转大地坐标。"""

    payload = request.get_json(silent=True) or {}
    if not payload:
        return jsonify({"success": False, "error": "未提供有效的 JSON 数据"}), 400

    points = payload.get("points", [])
    ellipsoid = payload.get("ellipsoid", "WGS84")

    if not points:
        return jsonify({"success": False, "error": "需至少提供一个坐标点"}), 400

    try:
        transformer = _get_transformer()
        transformer.set_ellipsoid(ellipsoid)
    except Exception as exc:  # noqa: BLE001
        logger.exception("XYZ->BLH 转换配置失败: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500

    results: List[Dict[str, Any]] = []

    for point in points:
        try:
            name = point.get("name", "")
            x = point.get("x") or point.get("coord1")
            y = point.get("y") or point.get("coord2")
            z = point.get("z") or point.get("coord3")

            B, L, H = transformer.xyz_to_blh(x, y, z)
            results.append(
                {
                    "name": name,
                    "input_x": x,
                    "input_y": y,
                    "input_z": z,
                    "output_B": B,
                    "output_L": L,
                    "output_H": H,
                    "B_dms": transformer.decimal_to_dms(B),
                    "L_dms": transformer.decimal_to_dms(L),
                }
            )
        except Exception as point_error:  # noqa: BLE001
            point_name = point.get("name", "")
            logger.exception("XYZ->BLH 处理点 %s 出错: %s", point_name, point_error)
            results.append({"name": point_name, "error": str(point_error)})

    response = {
        "success": True,
        "data": results,
        "ellipsoid": ellipsoid,
        "points_count": len(points),
        "timestamp": datetime.now().isoformat(),
    }
    return jsonify(response)


@api_bp.route("/blh-to-xyz", methods=["POST"])
def convert_blh_to_xyz():
    """大地坐标转空间直角坐标。"""

    payload = request.get_json(silent=True) or {}
    if not payload:
        return jsonify({"success": False, "error": "未提供有效的 JSON 数据"}), 400

    points = payload.get("points", [])
    ellipsoid = payload.get("ellipsoid", "WGS84")

    if not points:
        return jsonify({"success": False, "error": "需至少提供一个坐标点"}), 400

    try:
        transformer = _get_transformer()
        transformer.set_ellipsoid(ellipsoid)
    except Exception as exc:  # noqa: BLE001
        logger.exception("BLH->XYZ 转换配置失败: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500

    results: List[Dict[str, Any]] = []

    for point in points:
        try:
            name = point.get("name", "")
            B = point.get("B") or point.get("coord1")
            L = point.get("L") or point.get("coord2")
            H = point.get("H") or point.get("coord3")

            if isinstance(B, str):
                B = transformer.dms_to_decimal(B)
            if isinstance(L, str):
                L = transformer.dms_to_decimal(L)

            x, y, z = transformer.blh_to_xyz(B, L, H)
            results.append(
                {
                    "name": name,
                    "input_B": B,
                    "input_L": L,
                    "input_H": H,
                    "output_x": x,
                    "output_y": y,
                    "output_z": z,
                    "B_dms": transformer.decimal_to_dms(B),
                    "L_dms": transformer.decimal_to_dms(L),
                }
            )
        except Exception as point_error:  # noqa: BLE001
            point_name = point.get("name", "")
            logger.exception("BLH->XYZ 处理点 %s 出错: %s", point_name, point_error)
            results.append({"name": point_name, "error": str(point_error)})

    response = {
        "success": True,
        "data": results,
        "ellipsoid": ellipsoid,
        "points_count": len(points),
        "timestamp": datetime.now().isoformat(),
    }
    return jsonify(response)


@api_bp.route("/four-parameter-transform", methods=["POST"])
def handle_four_parameter_transform():
    """四参数转换：支持计算参数或执行转换。"""

    payload = request.get_json(silent=True) or {}
    if not payload:
        return jsonify({"success": False, "error": "未提供有效的 JSON 数据"}), 400

    points = payload.get("points", [])
    control_points = payload.get("control_points", []) or payload.get("common_points", [])
    operation_type = payload.get("operation_type", "transform")

    try:
        if operation_type == "calculate_params":
            if len(control_points) < 2:
                return jsonify({"success": False, "error": "计算四参数至少需要 2 组控制点"}), 400

            control_pairs = [
                ((cp["source_x"], cp["source_y"]), (cp["target_x"], cp["target_y"]))
                for cp in control_points
            ]
            dx, dy, alpha, m = transform_utils.calculate_four_parameters(control_pairs)
            return jsonify(
                {
                    "success": True,
                    "parameters": {
                        "dx": dx,
                        "dy": dy,
                        "alpha": alpha,
                        "m": m,
                    },
                    "control_points_count": len(control_points),
                    "timestamp": datetime.now().isoformat(),
                }
            )

        if operation_type == "transform":
            if not points:
                return jsonify({"success": False, "error": "需提供待转换坐标点"}), 400
            if len(control_points) < 2:
                return jsonify({"success": False, "error": "转换至少需要 2 组控制点"}), 400

            control_pairs = [
                ((cp["source_x"], cp["source_y"]), (cp["target_x"], cp["target_y"]))
                for cp in control_points
            ]
            dx, dy, alpha, m = transform_utils.calculate_four_parameters(control_pairs)
            points_to_transform = [(p["x"], p["y"]) for p in points]
            transformed_points = transform_utils.four_parameter_transform(points_to_transform, dx, dy, alpha, m)

            results = []
            for idx, (original, transformed) in enumerate(zip(points, transformed_points)):
                name = original.get("name", "")
                x_new, y_new = transformed
                results.append(
                    {
                        "name": name,
                        "original_x": original["x"],
                        "original_y": original["y"],
                        "transformed_x": x_new,
                        "transformed_y": y_new,
                    }
                )

            return jsonify(
                {
                    "success": True,
                    "data": results,
                    "parameters": {
                        "dx": dx,
                        "dy": dy,
                        "alpha": alpha,
                        "m": m,
                    },
                    "control_points_count": len(control_points),
                    "points_count": len(points),
                    "timestamp": datetime.now().isoformat(),
                }
            )

        return jsonify({"success": False, "error": f"未支持的操作类型: {operation_type}"}), 400

    except Exception as exc:  # noqa: BLE001
        logger.exception("四参数转换失败: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500


@api_bp.route("/four-param-transform", methods=["POST"])
def transform_with_explicit_four_params():
    """使用显式四参数执行平面坐标转换。"""

    payload = request.get_json(silent=True) or {}
    if not payload:
        return jsonify({"success": False, "error": "未提供有效的 JSON 数据"}), 400

    operation = payload.get("operation", "")
    points = payload.get("points", [])
    settings = payload.get("settings", {})

    if not points:
        return jsonify({"success": False, "error": "需提供待转换坐标点"}), 400

    if operation != "four_param_forward":
        return jsonify({"success": False, "error": f"未支持的操作类型: {operation}"}), 400

    dx = settings.get("deltaX", 0.0)
    dy = settings.get("deltaY", 0.0)
    alpha = settings.get("rotation", 0.0)
    m = settings.get("scale", 0.0)
    coord_decimals = settings.get("coordDecimals", 3)

    try:
        points_to_transform = [(p["x"], p["y"]) for p in points]
        transformed_points = transform_utils.four_parameter_transform(points_to_transform, dx, dy, alpha, m)

        results = []
        for original, transformed in zip(points, transformed_points):
            name = original.get("name", "")
            x_new, y_new = transformed
            delta_x = x_new - original["x"]
            delta_y = y_new - original["y"]
            results.append(
                {
                    "name": name,
                    "x": original["x"],
                    "y": original["y"],
                    "newX": round(x_new, coord_decimals),
                    "newY": round(y_new, coord_decimals),
                    "deltaX": round(delta_x, coord_decimals),
                    "deltaY": round(delta_y, coord_decimals),
                }
            )

        return jsonify(
            {
                "success": True,
                "results": results,
                "parameters": {
                    "deltaX": dx,
                    "deltaY": dy,
                    "rotation": alpha,
                    "scale": m,
                },
                "points_count": len(points),
                "timestamp": datetime.now().isoformat(),
            }
        )

    except Exception as exc:  # noqa: BLE001
        logger.exception("按四参数执行转换失败: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500


@api_bp.route("/seven-parameter-transform", methods=["POST"])
def transform_with_seven_params():
    """执行七参数空间坐标转换。"""

    payload = request.get_json(silent=True) or {}
    if not payload:
        return jsonify({"success": False, "error": "未提供有效的 JSON 数据"}), 400

    points = payload.get("points", [])
    control_points = payload.get("control_points", [])

    if not points:
        return jsonify({"success": False, "error": "需提供待转换坐标点"}), 400
    if len(control_points) < 3:
        return jsonify({"success": False, "error": "七参数转换至少需要 3 组控制点"}), 400

    try:
        control_pairs = [
            (
                (cp["source_x"], cp["source_y"], cp["source_z"]),
                (cp["target_x"], cp["target_y"], cp["target_z"]),
            )
            for cp in control_points
        ]
        params = transform_utils.calculate_seven_parameters(control_pairs)
        transformed_points = transform_utils.seven_parameter_transform(
            [(p["x"], p["y"], p["z"]) for p in points],
            *params,
        )

        results = []
        for original, transformed in zip(points, transformed_points):
            name = original.get("name", "")
            x_new, y_new, z_new = transformed
            results.append(
                {
                    "name": name,
                    "original_x": original["x"],
                    "original_y": original["y"],
                    "original_z": original["z"],
                    "transformed_x": x_new,
                    "transformed_y": y_new,
                    "transformed_z": z_new,
                }
            )

        parameter_keys = ["dx", "dy", "dz", "rx", "ry", "rz", "m"]
        response_params = dict(zip(parameter_keys, params, strict=False))

        return jsonify(
            {
                "success": True,
                "data": results,
                "parameters": response_params,
                "control_points_count": len(control_points),
                "points_count": len(points),
                "timestamp": datetime.now().isoformat(),
            }
        )

    except Exception as exc:  # noqa: BLE001
        logger.exception("七参数转换失败: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500


@api_bp.route("/zone-transform", methods=["POST"])
def transform_zone():
    """执行三度带与六度带的互转。"""

    payload = request.get_json(silent=True) or {}
    if not payload:
        return jsonify({"success": False, "error": "未提供有效的 JSON 数据"}), 400

    points = payload.get("points", [])
    transform_type = payload.get("type", "3to6")
    source_elevation = payload.get("sourceElevation", 0)
    target_elevation = payload.get("targetElevation", 0)

    if not points:
        return jsonify({"success": False, "error": "需至少提供一个坐标点"}), 400

    try:
        transformer = _get_transformer()
    except Exception as exc:  # noqa: BLE001
        logger.exception("坐标带转换服务不可用: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500

    results: List[Dict[str, Any]] = []

    for point in points:
        try:
            name = point.get("name", "")
            x = point.get("x")
            y = point.get("y")
            height = point.get("height", 0)
            zone = point.get("zone")

            if transform_type == "3to6":
                x_new, y_new, zone_new = transformer.zone_transform_3_to_6(x, y, zone)
            elif transform_type == "6to3":
                x_new, y_new, zone_new = transformer.zone_transform_6_to_3(x, y, zone)
            else:
                raise ValueError(f"未支持的带号转换类型: {transform_type}")

            new_height = target_elevation if (source_elevation or target_elevation) else height

            results.append(
                {
                    "name": name,
                    "input_x": x,
                    "input_y": y,
                    "input_height": height,
                    "input_zone": zone,
                    "output_x": x_new,
                    "output_y": y_new,
                    "output_height": new_height,
                    "output_zone": zone_new,
                }
            )
        except Exception as point_error:  # noqa: BLE001
            point_name = point.get("name", "")
            logger.exception("带号转换处理点 %s 出错: %s", point_name, point_error)
            results.append({"name": point_name, "error": str(point_error)})

    response = {
        "success": True,
        "data": results,
        "transform_type": transform_type,
        "source_elevation": source_elevation,
        "target_elevation": target_elevation,
        "points_count": len(points),
        "timestamp": datetime.now().isoformat(),
    }
    return jsonify(response)


@api_bp.route("/coordinate/batch/geodetic-to-cartesian", methods=["POST"])
def batch_geodetic_to_cartesian():
    """批量将大地坐标转换为空间直角坐标。"""

    payload = request.get_json(silent=True) or {}
    ellipsoid = payload.get("ellipsoid", "WGS84")
    rows = payload.get("rows", [])

    if not rows:
        return jsonify({"success": False, "error": "需提供坐标数据"}), 400

    try:
        transformer = _get_transformer()
        transformer.set_ellipsoid(ellipsoid)
    except Exception as exc:  # noqa: BLE001
        logger.exception("批量 BLH->XYZ 转换配置失败: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500

    results = []
    for row in rows:
        try:
            lat = row.get("B") or row.get("lat")
            lon = row.get("L") or row.get("lon")
            height = row.get("H") or row.get("height", 0)

            if isinstance(lat, str):
                lat = transformer.dms_to_decimal(lat)
            if isinstance(lon, str):
                lon = transformer.dms_to_decimal(lon)

            x, y, z = transformer.blh_to_xyz(lat, lon, height)
            results.append({"X": x, "Y": y, "Z": z})
        except Exception as row_error:  # noqa: BLE001
            logger.exception("批量 BLH->XYZ 处理行出错: %s", row_error)
            results.append({"error": str(row_error)})

    return jsonify({
        "success": True,
        "ellipsoid": ellipsoid,
        "rows": results,
        "timestamp": datetime.now().isoformat(),
    })


@api_bp.route("/coordinate/batch/cartesian-to-geodetic", methods=["POST"])
def batch_cartesian_to_geodetic():
    """批量将空间直角坐标转换为大地坐标。"""

    payload = request.get_json(silent=True) or {}
    ellipsoid = payload.get("ellipsoid", "WGS84")
    rows = payload.get("rows", [])

    if not rows:
        return jsonify({"success": False, "error": "需提供坐标数据"}), 400

    try:
        transformer = _get_transformer()
        transformer.set_ellipsoid(ellipsoid)
    except Exception as exc:  # noqa: BLE001
        logger.exception("批量 XYZ->BLH 转换配置失败: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500

    results = []
    for row in rows:
        try:
            x = row.get("X") or row.get("x")
            y = row.get("Y") or row.get("y")
            z = row.get("Z") or row.get("z")

            B, L, H = transformer.xyz_to_blh(x, y, z)
            results.append({
                "B": B,
                "L": L,
                "H": H,
                "B_dms": transformer.decimal_to_dms(B),
                "L_dms": transformer.decimal_to_dms(L),
            })
        except Exception as row_error:  # noqa: BLE001
            logger.exception("批量 XYZ->BLH 处理行出错: %s", row_error)
            results.append({"error": str(row_error)})

    return jsonify({
        "success": True,
        "ellipsoid": ellipsoid,
        "rows": results,
        "timestamp": datetime.now().isoformat(),
    })
