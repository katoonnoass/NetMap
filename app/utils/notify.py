"""
Helper para transmitir notificacoes SSE quando dados mudam.
Chamado a partir das rotas apos operacoes de escrita.
"""

from ..services.sse_service import broadcast


def notify_change(event_type: str, pid: str, **kwargs):
    """Envia notificacao SSE para todos os subscribers."""
    broadcast(event_type, {"project_id": pid, **kwargs})
