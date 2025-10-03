"""TaoMeasure Flask 应用启动脚本。"""

from __future__ import annotations

import os

from taomeasure import create_app

app = create_app()


def main() -> None:
    """以开发模式启动内置 WSGI 服务器。"""

    host = os.getenv("TAOMEASURE_HOST", "127.0.0.1")
    port = int(os.getenv("TAOMEASURE_PORT", "5000"))
    debug = bool(int(os.getenv("TAOMEASURE_DEBUG", "0")))

    app.logger.info("启动 TaoMeasure 后端: %s:%s (debug=%s)", host, port, debug)
    app.run(host=host, port=port, debug=debug, threaded=True)


if __name__ == "__main__":
    main()
