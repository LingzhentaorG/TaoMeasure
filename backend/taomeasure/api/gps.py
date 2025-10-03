"""GPS 高程转换相关接口。"""

from __future__ import annotations

import logging
from datetime import datetime
from flask import current_app, jsonify, request

from . import api_bp

logger = logging.getLogger(__name__)


@api_bp.route("/gps-altitude", methods=["POST"])
def convert_gps_altitude():
    """执行 GPS 高程异常转换计算。"""

    payload = request.get_json(silent=True) or {}
    if not payload:
        return jsonify({"success": False, "error": "未提供有效的 JSON 数据"}), 400

    known_points = payload.get("known_points", [])
    unknown_points = payload.get("unknown_points", [])
    model = payload.get("model", "vertical_translation")
    model_params = payload.get("model_params", {})

    if not known_points:
        return jsonify({"success": False, "error": "需至少提供一个已知点"}), 400
    if not unknown_points:
        return jsonify({"success": False, "error": "需至少提供一个待求点"}), 400

    services = current_app.extensions.get("services", {})
    gps_converter = services.get("gps_converter")
    if gps_converter is None:
        return jsonify({"success": False, "error": "GPS 转换服务未初始化"}), 500

    logger.info(
        "GPS 高程转换: 模型=%s, 已知点=%d, 待求点=%d",
        model,
        len(known_points),
        len(unknown_points),
    )

    try:
        if model == "vertical_translation":
            result = gps_converter.vertical_translation_model(known_points, unknown_points)
        elif model == "linear_basis":
            result = gps_converter.linear_basis_fitting(known_points, unknown_points, model_params)
        elif model == "surface_basis":
            result = gps_converter.surface_basis_fitting(known_points, unknown_points, model_params)
        else:
            return jsonify({"success": False, "error": f"未支持的模型类型: {model}"}), 400

        logger.info("GPS 高程转换完成, 单位权中误差=%.3f", result.get("unit_weight_error", 0.0))

        response = {
            "success": True,
            "data": result.get("results", []),
            "model": model,
            "known_points_count": len(known_points),
            "unknown_points_count": len(unknown_points),
            "unit_weight_error": result.get("unit_weight_error", 0.0),
            "max_residual": result.get("max_residual", 0.0),
            "min_residual": result.get("min_residual", 0.0),
            "parameters": result.get("parameters", {}),
            "accuracy_assessment": result.get("accuracy_assessment", {}),
            "timestamp": datetime.now().isoformat(),
        }
        return jsonify(response)

    except Exception as exc:  # noqa: BLE001
        logger.exception("GPS 高程转换失败: %s", exc)
        return (
            jsonify(
                {
                    "success": False,
                    "error": str(exc),
                    "timestamp": datetime.now().isoformat(),
                }
            ),
            500,
        )
