"""TaoMeasure 后端应用工厂。"""

from __future__ import annotations

import logging
from dataclasses import asdict
from datetime import datetime
from typing import Any, Dict

from flask import Flask, jsonify
from flask_cors import CORS

from .api import register_api_routes
from .config import Config, load_config
from .domain import CurveDesign, FileHandler, GPSAltitudeConverter, UniversalCoordinateService


def create_app(config: Config | None = None) -> Flask:
    """创建并配置 Flask 应用实例。"""

    cfg = config or load_config()
    app = Flask(__name__)
    app.config.from_mapping(asdict(cfg))

    _configure_logging(app)
    _register_cors(app)
    _register_services(app)
    register_api_routes(app)
    _register_error_handlers(app)

    return app

def _configure_logging(app: Flask) -> None:
    """配置统一的日志输出格式。"""

    log_level = app.config.get("LOG_LEVEL", logging.INFO)
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
    app.logger.setLevel(log_level)

def _register_cors(app: Flask) -> None:
    """按配置启用跨域支持。"""

    origins = app.config.get("CORS_ORIGINS", "*")
    supports_credentials = app.config.get("CORS_SUPPORTS_CREDENTIALS", True)
    CORS(app, resources={r"/api/*": {"origins": origins}}, supports_credentials=supports_credentials)

def _register_services(app: Flask) -> None:
    """初始化业务服务并存入扩展字典。"""

    services: Dict[str, Any] = {
        "gps_converter": GPSAltitudeConverter(),
        "coordinate_universal": UniversalCoordinateService(),
        "curve_designer": CurveDesign(),
        "file_handler": FileHandler(),
    }
    app.extensions["services"] = services

def _register_error_handlers(app: Flask) -> None:
    """注册统一的 JSON 错误响应。"""

    @app.errorhandler(404)
    def _not_found(_: Exception):  # noqa: ANN001
        """返回 404 统一 JSON 格式。"""

        return (
            jsonify(
                {
                    "success": False,
                    "error": "接口不存在",
                    "timestamp": datetime.now().isoformat(),
                }
            ),
            404,
        )

    @app.errorhandler(500)
    def _internal_error(_: Exception):  # noqa: ANN001
        """返回 500 统一 JSON 格式。"""

        return (
            jsonify(
                {
                    "success": False,
                    "error": "服务器内部错误",
                    "timestamp": datetime.now().isoformat(),
                }
            ),
            500,
        )
