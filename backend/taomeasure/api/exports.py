"""成果导出相关接口。"""

from __future__ import annotations

import logging
import os
import tempfile
from datetime import datetime
from flask import after_this_request, current_app, jsonify, request, send_file

from . import api_bp
from taomeasure.domain.curve_dxf_builder import CurveDxfBuilder
from taomeasure.domain.dxf_exporter import DxfRoadExporter

logger = logging.getLogger(__name__)


def _get_file_handler():
    """获取文件导出服务实例。"""

    services = current_app.extensions.get("services", {})
    handler = services.get("file_handler")
    if handler is None:
        raise RuntimeError("文件导出服务未初始化")
    return handler


@api_bp.route("/export/results", methods=["POST"])
def export_results():
    """将计算结果导出为文本或 CSV。"""

    payload = request.get_json(silent=True) or {}
    results = payload.get("results")
    export_format = payload.get("format")
    result_type = payload.get("type")

    if results is None or export_format is None or result_type is None:
        return jsonify({"success": False, "error": "缺少 results/format/type 字段"}), 400

    try:
        handler = _get_file_handler()
    except Exception as exc:  # noqa: BLE001
        logger.exception("文件导出服务不可用: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500

    try:
        if export_format == "txt":
            content = handler.export_results_to_text(results, result_type)
            content_type = "text/plain"
        elif export_format == "csv":
            content = handler.export_results_to_csv(results, result_type)
            content_type = "text/csv"
        else:
            return jsonify({"success": False, "error": "不支持的导出格式"}), 400

        filename = f"results_{result_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{export_format}"
        return jsonify(
            {
                "success": True,
                "data": {
                    "content": content,
                    "content_type": content_type,
                    "filename": filename,
                },
            }
        )

    except Exception as exc:  # noqa: BLE001
        logger.exception("成果导出失败: %s", exc)
        return jsonify({"success": False, "error": f"导出失败: {exc}"}), 500


@api_bp.route("/export/dxf", methods=["POST"])
def export_dxf():
    """将道路曲线成果导出为 DXF 文件。"""

    payload = request.get_json(silent=True) or {}
    if not payload:
        return jsonify({"success": False, "error": "缺少请求数据"}), 400

    try:
        builder = CurveDxfBuilder(payload)
        exporter_payload = builder.build()
    except ValueError as exc:
        logger.error("DXF 数据验证失败: %s", exc)
        return jsonify({"success": False, "error": f"DXF 数据无效: {exc}"}), 400
    except Exception as exc:  # noqa: BLE001
        logger.exception("构建 DXF 数据失败: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500

    try:
        layer_overrides = {
            "frame_outer": "图框",
            "frame_inner": "图框线",
            "north_arrow": "指北针",
            "centerline": "中心线",
            "left_lane": "左车道",
            "right_lane": "右车道",
            "left_roadbed_edge": "左路缘",
            "right_roadbed_edge": "右路缘",
            "pi_line": "路线",
            "key_point": "关键点",
            "hm_stake": "桩号",
            "curve_table": "曲线要素表",
        }

        exporter = DxfRoadExporter(layer_overrides=layer_overrides)
        exporter.draw_from_data(exporter_payload)

        tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".dxf")
        tmp_path = tmp_file.name
        tmp_file.close()
        exporter.save(tmp_path)

        @after_this_request
        def _cleanup(response):
            """在响应结束后删除临时文件。"""

            try:
                os.remove(tmp_path)
            except OSError:
                logger.warning("删除临时 DXF 文件失败: %s", tmp_path)
            return response

        project_name = getattr(builder, "project_name", "curve_design") or "curve_design"
        safe_root = "".join(ch if ch.isalnum() or ch in "_- " else "_" for ch in project_name)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{safe_root}_{timestamp}.dxf"

        return send_file(
            tmp_path,
            as_attachment=True,
            download_name=filename,
            mimetype="application/vnd.dxf",
        )

    except Exception as exc:  # noqa: BLE001
        logger.exception("DXF 导出失败: %s", exc)
        return jsonify({"success": False, "error": f"DXF 导出失败: {exc}"}), 500
