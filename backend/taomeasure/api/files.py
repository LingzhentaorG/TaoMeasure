"""坐标文件解析接口。"""

from __future__ import annotations

import logging
from flask import current_app, jsonify, request

from . import api_bp

logger = logging.getLogger(__name__)


def _get_file_handler():
    """获取文件处理服务实例。"""

    services = current_app.extensions.get("services", {})
    handler = services.get("file_handler")
    if handler is None:
        raise RuntimeError("文件解析服务未初始化")
    return handler


@api_bp.route("/file/parse", methods=["POST"])
def parse_coordinate_file():
    """解析文本坐标文件内容并返回结构化结果。"""

    payload = request.get_json(silent=True) or {}
    file_content = payload.get("content")
    file_type = payload.get("type")

    if file_content is None or file_type is None:
        return jsonify({"success": False, "error": "缺少必要的 content 与 type 字段"}), 400

    try:
        handler = _get_file_handler()
    except Exception as exc:  # noqa: BLE001
        logger.exception("文件解析服务不可用: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500

    try:
        is_valid, error_msg = handler.validate_file_format(file_content, file_type)
        if not is_valid:
            return jsonify({"success": False, "error": f"文件格式错误: {error_msg}"}), 400

        result = handler.parse_coordinate_file(file_content, file_type)
        return jsonify({"success": True, "data": result})

    except Exception as exc:  # noqa: BLE001
        logger.exception("坐标文件解析失败: %s", exc)
        return jsonify({"success": False, "error": f"文件解析失败: {exc}"}), 500
