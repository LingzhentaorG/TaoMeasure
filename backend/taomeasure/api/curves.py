"""道路曲线设计相关接口。"""

from __future__ import annotations

import logging
from datetime import datetime
from flask import current_app, jsonify, request

from . import api_bp

logger = logging.getLogger(__name__)


def _get_curve_designer():
    """获取曲线设计服务实例。"""

    services = current_app.extensions.get("services", {})
    designer = services.get("curve_designer")
    if designer is None:
        raise RuntimeError("曲线设计服务未初始化")
    return designer


@api_bp.route("/curve-design", methods=["POST"])
def design_curve():
    """根据参数类型执行道路曲线设计计算。"""

    payload = request.get_json(silent=True) or {}
    if not payload:
        return jsonify({"success": False, "error": "未提供有效的 JSON 数据"}), 400

    curve_type = payload.get("curve_type", "transition")
    parameters = payload.get("parameters", {})

    try:
        designer = _get_curve_designer()
    except Exception as exc:  # noqa: BLE001
        logger.exception("曲线设计服务不可用: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500

    logger.info("曲线设计请求: 类型=%s", curve_type)

    try:
        if curve_type == "transition":
            result = designer.transition_curve_design(parameters)
        elif curve_type == "circular":
            result = designer.circular_curve_design(parameters)
        elif curve_type == "compound":
            result = designer.compound_curve_design(parameters)
        else:
            return jsonify({"success": False, "error": f"未支持的曲线类型: {curve_type}"}), 400

        response = {
            "success": True,
            "data": result,
            "curve_type": curve_type,
            "timestamp": datetime.now().isoformat(),
        }
        return jsonify(response)

    except Exception as exc:  # noqa: BLE001
        logger.exception("曲线设计计算失败: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500
