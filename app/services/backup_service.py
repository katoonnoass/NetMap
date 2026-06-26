"""
Servico de backup e restauracao de projetos (ZIP com JSON + fotos).
"""

import io
import json
import os
import zipfile
from datetime import datetime

from flask import current_app

from . import project_service


def export_backup(pid: str) -> tuple[str, bytes] | None:
    db = project_service.load_project(pid)
    if not db:
        return None

    project_name = db.get("name", pid)
    payload = json.dumps(db, ensure_ascii=False, indent=2).encode("utf-8")

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("project.json", payload)

        photos_dir = os.path.join(
            current_app.config.get("DATA_DIR", "data"), "photos", pid
        )
        if os.path.isdir(photos_dir):
            for eid_dir in sorted(os.listdir(photos_dir)):
                eid_path = os.path.join(photos_dir, eid_dir)
                if not os.path.isdir(eid_path):
                    continue
                for fname in sorted(os.listdir(eid_path)):
                    fpath = os.path.join(eid_path, fname)
                    if os.path.isfile(fpath):
                        arcname = f"photos/{eid_dir}/{fname}"
                        zf.write(fpath, arcname)

    slug = project_service.slugify(project_name)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"backup_{slug}_{timestamp}.zip"
    return filename, buf.getvalue()


def import_backup(pid: str, zip_bytes: bytes) -> dict | None:
    db = project_service.load_project(pid)
    if not db:
        return None

    try:
        zf = zipfile.ZipFile(io.BytesIO(zip_bytes))
    except zipfile.BadZipFile:
        return {"error": "Arquivo ZIP invalido"}

    names = zf.namelist()
    if "project.json" not in names:
        zf.close()
        return {"error": "ZIP nao contem project.json"}

    try:
        raw = zf.read("project.json")
        project_data = json.loads(raw)
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        zf.close()
        return {"error": f"project.json invalido: {exc}"}

    if not isinstance(project_data, dict):
        zf.close()
        return {"error": "project.json deve ser um objeto"}

    for key in ("elements", "connections", "dios", "cto_ports", "incidents", "positions"):
        if key in project_data:
            db[key] = project_data[key]

    project_service.save_project(pid, db)

    photos_base = os.path.join(
        current_app.config.get("DATA_DIR", "data"), "photos", pid
    )
    photo_count = 0
    for arcname in names:
        if not arcname.startswith("photos/") or arcname.endswith("/"):
            continue
        target_path = os.path.join(photos_base, arcname[len("photos/"):])
        target_dir = os.path.dirname(target_path)
        real_base = os.path.realpath(photos_base)
        real_target = os.path.realpath(target_path)
        if not real_target.startswith(real_base + os.sep):
            continue
        os.makedirs(target_dir, exist_ok=True)
        with open(target_path, "wb") as f:
            f.write(zf.read(arcname))
        photo_count += 1

    zf.close()
    return {
        "ok": True,
        "project_id": pid,
        "photos_restored": photo_count,
        "elements": len(db.get("elements", [])),
        "connections": len(db.get("connections", [])),
    }
