"""
Rotas de notificacoes SSE (Server-Sent Events).
"""

from flask import Blueprint, Response, session

from ..services import sse_service
from ..utils.auth import require_login

sse_bp = Blueprint("sse", __name__)


@sse_bp.route("/api/events")
@require_login
def sse_stream():
    sid, q = sse_service.subscribe()

    def generate():
        for event in sse_service.iter_events(sid, q):
            yield event

    username = session.get("user", "unknown")
    sse_service.broadcast("user_connected", {"username": username})
    resp = Response(generate(), mimetype="text/event-stream")
    resp.headers["Cache-Control"] = "no-cache"
    resp.headers["X-Accel-Buffering"] = "no"
    resp.headers["Connection"] = "keep-alive"
    return resp
