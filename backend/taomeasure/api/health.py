"""健康检查相关接口。"""

from __future__ import annotations

from datetime import datetime
from flask import Blueprint, current_app, jsonify

from . import api_bp


@api_bp.route("/health", methods=["GET"])
def health_check():
    """返回应用运行状态和关键服务可用性。"""

    services = current_app.extensions.get("services", {})
    module_states = {
        "gps_altitude": "available" if services.get("gps_converter") else "missing",
        "coordinate_universal": "available" if services.get("coordinate_universal") else "missing",
        "curve_design": "available" if services.get("curve_designer") else "missing",
        "file_parser": "available" if services.get("file_handler") else "missing",
    }

    return jsonify(
        {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "version": current_app.config.get("APP_VERSION", "2.0.0"),
            "modules": module_states,
        }
    )
