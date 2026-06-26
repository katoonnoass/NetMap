"""
Servico de upload e gestao de fotos dos elementos.
"""

import os
import uuid
from datetime import datetime
from flask import current_app


ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
PHOTOS_DIR = "photos"
IMAGE_MIME_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}
_MAGIC_BYTES = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG": "image/png",
    b"RIFF": "image/webp",
}


def _get_photos_dir():
    return os.path.join(current_app.config.get("DATA_DIR", "data"), PHOTOS_DIR)


def _validate_photo_path(pid: str, eid: int, filename: str) -> str | None:
    if filename != os.path.basename(filename) or ".." in filename:
        return None
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return None
    photos_dir = _get_photos_dir()
    path = os.path.join(photos_dir, pid, str(eid), filename)
    real_dir = os.path.realpath(os.path.join(photos_dir, pid, str(eid)))
    real_path = os.path.realpath(path)
    if not real_path.startswith(real_dir + os.sep) and real_path != real_dir:
        return None
    if not os.path.isfile(path):
        return None
    return path


def _detect_mime(data: bytes) -> str | None:
    for magic, mime in _MAGIC_BYTES.items():
        if data[:len(magic)] == magic:
            if mime == "image/webp" and b"WEBP" not in data[:16]:
                continue
            return mime
    return None


def _safe_filename(original: str) -> str:
    ext = os.path.splitext(original)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".jpg"
    return f"{uuid.uuid4().hex}{ext}"


def validate_file(filename: str, data: bytes) -> str | None:
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return f"Formato nao permitido: {ext}. Use JPG, PNG ou WEBP."
    if len(data) > MAX_FILE_SIZE:
        return f"Arquivo excede {MAX_FILE_SIZE // (1024 * 1024)}MB."
    if not _detect_mime(data):
        return "Conteudo do arquivo nao corresponde a uma imagem valida."
    return None


def save_photo(pid: str, eid: int, filename: str, data: bytes) -> dict | None:
    photos_dir = os.path.join(_get_photos_dir(), pid, str(eid))
    os.makedirs(photos_dir, exist_ok=True)

    safe_name = _safe_filename(filename)
    path = os.path.join(photos_dir, safe_name)
    with open(path, "wb") as f:
        f.write(data)

    return {
        "id": safe_name.replace(".", "_"),
        "filename": safe_name,
        "element_id": eid,
        "project_id": pid,
        "size": len(data),
        "url": f"/api/photos/{pid}/{eid}/{safe_name}",
        "uploaded_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }


def list_photos(pid: str, eid: int) -> list[dict]:
    photos_dir = os.path.join(_get_photos_dir(), pid, str(eid))
    if not os.path.isdir(photos_dir):
        return []
    result = []
    for fname in sorted(os.listdir(photos_dir)):
        fpath = os.path.join(photos_dir, fname)
        if os.path.isfile(fpath):
            result.append(
                {
                    "id": fname.replace(".", "_"),
                    "filename": fname,
                    "element_id": eid,
                    "project_id": pid,
                    "size": os.path.getsize(fpath),
                    "url": f"/api/photos/{pid}/{eid}/{fname}",
                }
            )
    return result


def delete_photo(pid: str, eid: int, filename: str) -> bool:
    path = _validate_photo_path(pid, eid, filename)
    if not path:
        return False
    os.remove(path)
    return True
