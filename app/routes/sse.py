"""
Rotas de notificacoes SSE (Server-Sent Events).
"""

from flask import Blueprint, Response, session

from ..services.sse_service import subscribe, iter_events
from ..utils.auth import require_login

sse_bp = Blueprint("sse", __name__)


@sse_bp.route("/api/events")
@require_login
def sse_stream():
    sid, q = subscribe()

    def generate():
        for event in iter_events(sid, q):
            yield event

    username = session.get("user", "unknown")
    from ..services.sse_service import broadcast
    broadcast("user_connected", {"username": username})
    resp = Response(generate(), mimetype="text/event-stream")
    resp.headers["Cache-Control"] = "no-cache"
    resp.headers["X-Accel-Buffering"] = "no"
    resp.headers["Connection"] = "keep-alive"
    return resp
