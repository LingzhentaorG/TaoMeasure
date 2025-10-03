"""应用基础配置模块。"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass


@dataclass(slots=True)
class Config:
    """Flask 应用的默认配置。"""

    DEBUG: bool = bool(int(os.getenv("TAOMEASURE_DEBUG", "0")))
    TESTING: bool = False
    JSON_AS_ASCII: bool = False
    JSON_SORT_KEYS: bool = False
    MAX_CONTENT_LENGTH: int | None = 16 * 1024 * 1024  # 16MB 上限，防止大文件导致内存问题
    CORS_ORIGINS: str | list[str] = os.getenv("TAOMEASURE_CORS", "*")
    CORS_SUPPORTS_CREDENTIALS: bool = True
    LOG_LEVEL: int = getattr(logging, os.getenv("TAOMEASURE_LOG_LEVEL", "INFO").upper(), logging.INFO)
    APP_VERSION: str = os.getenv("TAOMEASURE_VERSION", "2.0.0")


def load_config() -> Config:
    """生成默认配置实例，方便外部扩展时覆写字段。"""

    return Config()
