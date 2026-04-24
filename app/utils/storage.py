"""
Helpers de persistencia JSON com escrita atomica no mesmo processo.
"""
import json
import os
import tempfile
import threading
import time
from pathlib import Path

_LOCKS: dict[str, threading.RLock] = {}
_LOCKS_GUARD = threading.Lock()


def _lock_for(path: Path | str) -> threading.RLock:
    key = str(Path(path).resolve())
    with _LOCKS_GUARD:
        if key not in _LOCKS:
            _LOCKS[key] = threading.RLock()
        return _LOCKS[key]


def load_json(path: Path | str, default):
    target = Path(path)
    if not target.exists():
        return default
    with _lock_for(target):
        with target.open(encoding="utf-8-sig") as handle:
            return json.load(handle)


def save_json(path: Path | str, payload) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    lock = _lock_for(target)

    with lock:
        fd, tmp_name = tempfile.mkstemp(
            dir=str(target.parent),
            prefix=f".{target.stem}_",
            suffix=target.suffix or ".tmp",
        )
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as handle:
                json.dump(payload, handle, ensure_ascii=False, indent=2)
                handle.flush()
                os.fsync(handle.fileno())
            last_error = None
            for _ in range(5):
                try:
                    os.replace(tmp_name, target)
                    last_error = None
                    break
                except PermissionError as exc:
                    last_error = exc
                    time.sleep(0.05)
            if last_error:
                raise last_error
        finally:
            if os.path.exists(tmp_name):
                os.remove(tmp_name)
