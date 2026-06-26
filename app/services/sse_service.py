"""
Notificacoes SSE em tempo real.
Usa uma fila simples em memoria para transmitir eventos aos clientes conectados.
"""

import json
import threading
import time
from queue import Queue, Empty
from typing import Optional


_subscribers: dict[int, Queue] = {}
_sub_lock = threading.Lock()
_sub_counter = 0


def subscribe() -> tuple[int, Queue]:
    global _sub_counter
    with _sub_lock:
        _sub_counter += 1
        sid = _sub_counter
        q = Queue(maxsize=100)
        _subscribers[sid] = q
    return sid, q


def unsubscribe(sid: int):
    with _sub_lock:
        _subscribers.pop(sid, None)


def broadcast(event_type: str, data: dict):
    msg = json.dumps({"event": event_type, **data, "_ts": int(time.time())})
    with _sub_lock:
        dead = []
        for sid, q in _subscribers.items():
            try:
                q.put_nowait(msg)
            except Exception:
                dead.append(sid)
        for sid in dead:
            _subscribers.pop(sid, None)


def iter_events(sid: int, q: Queue, timeout: int = 30):
    """Yield SSE formatted messages. Sends keep-alive every 15s."""
    last_keepalive = time.time()
    try:
        while True:
            try:
                msg = q.get(timeout=1)
                yield f"data: {msg}\n\n"
                last_keepalive = time.time()
            except Empty:
                if time.time() - last_keepalive > 15:
                    yield ": keepalive\n\n"
                    last_keepalive = time.time()
    except GeneratorExit:
        unsubscribe(sid)
