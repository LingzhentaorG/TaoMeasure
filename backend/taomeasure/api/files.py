"""File upload helpers for coordinate batch processing."""

from __future__ import annotations

import logging
from flask import current_app, jsonify, request

from . import api_bp

logger = logging.getLogger(__name__)


def _get_file_handler():
    """Fetch the shared file handler service."""

    services = current_app.extensions.get("services", {})
    handler = services.get("file_handler")
    if handler is None:
        raise RuntimeError("File handler service is not initialised")
    return handler


@api_bp.route("/file/parse", methods=["POST"])
def parse_coordinate_file():
    """Parse uploaded coordinate text into structured payload."""

    payload = request.get_json(silent=True) or {}
    file_content = payload.get("content")
    file_type = payload.get("type")
    filename = payload.get("filename")
    encoding = (payload.get("encoding") or "text").lower()

    if file_content is None or file_type is None:
        return jsonify({"success": False, "error": "Missing required content or type field"}), 400
    if encoding == "base64" and not filename:
        return jsonify({"success": False, "error": "Base64 payloads require the filename field"}), 400

    try:
        handler = _get_file_handler()
        lines = handler.prepare_lines(file_content, filename=filename, encoding=encoding)
        is_valid, error_msg = handler.validate_file_format(lines, file_type)
        if not is_valid:
            return jsonify({"success": False, "error": f"File validation failed: {error_msg}"}), 400

        result = handler.parse_coordinate_file(lines, file_type)
        return jsonify({"success": True, "data": result})
    except ValueError as exc:
        logger.warning("File parsing failed: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 400
    except Exception as exc:  # noqa: BLE001
        logger.exception("Unexpected error while parsing file: %s", exc)
        return jsonify({"success": False, "error": f"File parsing failed: {exc}"}), 500


@api_bp.route("/file/info", methods=["POST"])
def describe_file_content():
    """Return simple statistics about the uploaded payload."""

    payload = request.get_json(silent=True) or {}
    file_content = payload.get("content")
    filename = payload.get("filename")
    encoding = (payload.get("encoding") or "text").lower()

    if file_content is None:
        return jsonify({"success": False, "error": "Missing content field"}), 400
    if encoding == "base64" and not filename:
        return jsonify({"success": False, "error": "Base64 payloads require the filename field"}), 400

    try:
        handler = _get_file_handler()
        lines = handler.prepare_lines(file_content, filename=filename, encoding=encoding)
        info = handler.get_file_info(lines)
        return jsonify({"success": True, "data": info})
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to analyse file info: %s", exc)
        return jsonify({"success": False, "error": f"Unable to analyse file: {exc}"}), 500
