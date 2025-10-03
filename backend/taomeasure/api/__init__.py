"""REST API 蓝图入口。"""

from __future__ import annotations

from flask import Blueprint, Flask

api_bp = Blueprint("api", __name__)


def register_api_routes(app: Flask) -> None:
    """注册全部 API 路由。"""

    # 导入各子模块以便路由装饰器执行
    from . import coordinates, curves, exports, files, gps, health  # noqa: F401

    app.register_blueprint(api_bp, url_prefix="/api")
