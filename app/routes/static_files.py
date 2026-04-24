"""
Rota customizada para servir o vis-network.min.js com compressão gzip.
"""
import os
import gzip
from flask import Blueprint, request, send_file, current_app

static_bp = Blueprint("static_files", __name__)


@static_bp.after_request
def add_cache(response):
    if request.path.startswith("/static/"):
        response.headers["Cache-Control"] = "public, max-age=604800"
    return response


@static_bp.route("/static/vis-network.min.js")
def serve_vis():
    path = os.path.join(current_app.static_folder, "vis-network.min.js")
    if not os.path.exists(path):
        return "Not found", 404

    if "gzip" in request.headers.get("Accept-Encoding", ""):
        with open(path, "rb") as f:
            data = gzip.compress(f.read(), compresslevel=6)
        resp = current_app.response_class(data, mimetype="application/javascript")
        resp.headers["Content-Encoding"] = "gzip"
        resp.headers["Cache-Control"] = "public, max-age=604800"
        resp.headers["Vary"] = "Accept-Encoding"
        return resp

    resp = send_file(path, mimetype="application/javascript")
    resp.headers["Cache-Control"] = "public, max-age=604800"
    return resp
