"""
Rotas de elementos de rede.
"""

from flask import Blueprint, jsonify, request, session

from .. import limiter
from ..services import audit_service, element_service, project_service
from ..utils.auth import require_login, require_perm
from ..utils.query import (
    parse_pagination,
    parse_sorting,
    parse_filters,
    parse_search,
    apply_filters,
    apply_search,
    apply_sorting,
    paginate,
)

elements_bp = Blueprint("elements", __name__)


@elements_bp.route("/api/projects/<pid>/elements")
@require_login
def get_elements(pid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404
    items = db.get("elements", [])

    # Apply filters, search, sorting
    filters = parse_filters()
    search = parse_search()
    sort, order = parse_sorting(["nome", "tipo", "status", "id", "created_at"])

    if filters:
        items = apply_filters(items, filters)
    if search:
        items = apply_search(items, search, ["nome", "detalhes", "endereco", "modelo"])
    items = apply_sorting(items, sort, order)

    # Paginate
    p = parse_pagination()
    items, meta = paginate(items, p)

    return jsonify({"items": items, **meta})


@elements_bp.route("/api/projects/<pid>/elements", methods=["POST"])
@limiter.limit("30 per minute")
@require_perm("edit_elements")
def add_element(pid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404

    data = request.get_json(silent=True) or {}
    if not data.get("tipo"):
        return jsonify({"error": "Tipo do elemento e obrigatorio"}), 400
    if not data.get("nome"):
        return jsonify({"error": "Nome do elemento e obrigatorio"}), 400

    try:
        element = element_service.add_element(db, data)
    except (TypeError, ValueError) as exc:
        return jsonify({"error": str(exc)}), 400

    project_service.save_project(pid, db)
    audit_service.log_event(
        pid,
        action="element_created",
        username=session.get("user", "system"),
        entity_type="element",
        entity_id=element["id"],
        message=f'Elemento "{element.get("nome", element["id"])}" criado',
        extra={"tipo": element.get("tipo")},
    )
    return jsonify(element), 201


@elements_bp.route("/api/projects/<pid>/elements/<int:eid>", methods=["PUT"])
@limiter.limit("30 per minute")
@require_perm("edit_elements")
def update_element(pid, eid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404

    data = request.get_json(silent=True) or {}
    try:
        element = element_service.update_element(db, eid, data)
    except (TypeError, ValueError) as exc:
        return jsonify({"error": str(exc)}), 400

    if not element:
        return jsonify({"error": "Not found"}), 404

    project_service.save_project(pid, db)
    audit_service.log_event(
        pid,
        action="element_updated",
        username=session.get("user", "system"),
        entity_type="element",
        entity_id=eid,
        message=f'Elemento "{element.get("nome", eid)}" atualizado',
        extra={"tipo": element.get("tipo")},
    )
    return jsonify(element)


@elements_bp.route("/api/projects/<pid>/elements/<int:eid>", methods=["DELETE"])
@limiter.limit("15 per minute")
@require_perm("edit_elements")
def delete_element(pid, eid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404

    element = next((item for item in db.get("elements", []) if item["id"] == eid), None)
    deleted = element_service.delete_element(db, eid)
    if not deleted:
        return jsonify({"error": "Not found"}), 404

    project_service.save_project(pid, db)
    audit_service.log_event(
        pid,
        action="element_deleted",
        username=session.get("user", "system"),
        entity_type="element",
        entity_id=eid,
        message=f'Elemento "{element.get("nome", eid) if element else eid}" removido',
        extra={"tipo": element.get("tipo") if element else ""},
    )
    return jsonify({"ok": True})


@elements_bp.route("/api/projects/<pid>/elements/<int:eid>/duplicate", methods=["POST"])
@limiter.limit("15 per minute")
@require_perm("edit_elements")
def duplicate_element(pid, eid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404

    src = next((item for item in db.get("elements", []) if item["id"] == eid), None)
    if not src:
        return jsonify({"error": "Not found"}), 404

    import copy
    new = copy.deepcopy(src)
    new["id"] = project_service.next_id(db)
    new["nome"] = new.get("nome", "") + " (copia)"
    if new.get("lat") is not None:
        new["lat"] = round(new["lat"] + 0.00005, 6)
    if new.get("lng") is not None:
        new["lng"] = round(new["lng"] + 0.00005, 6)
    db["elements"].append(new)
    project_service.save_project(pid, db)
    audit_service.log_event(
        pid,
        action="element_duplicated",
        username=session.get("user", "system"),
        entity_type="element",
        entity_id=new["id"],
        message=f'Elemento "{new.get("nome", new["id"])}" duplicado de #{eid}',
        extra={"source_id": eid},
    )
    return jsonify(new), 201


@elements_bp.route("/api/projects/<pid>/elements/bulk-update", methods=["POST"])
@limiter.limit("10 per minute")
@require_perm("edit_elements")
def bulk_update_elements(pid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404

    payload = request.get_json(silent=True) or {}
    ids = payload.get("ids", [])
    changes = payload.get("changes", {})

    if not isinstance(ids, list) or not ids:
        return jsonify({"error": "Lista de IDs obrigatoria"}), 400
    if not isinstance(changes, dict) or not changes:
        return jsonify({"error": "Alteracoes obrigatorias"}), 400

    allowed = {"status", "tipo", "endereco", "observacao", "detalhes", "modelo"}
    if not set(changes.keys()).issubset(allowed):
        return jsonify({"error": "Campo(s) nao permitido(s)"}), 400

    updated = []
    failed = []
    for eid in ids:
        try:
            elem = element_service.update_element(db, int(eid), changes)
            if elem:
                updated.append(elem["id"])
            else:
                failed.append(int(eid))
        except (TypeError, ValueError):
            failed.append(int(eid))

    project_service.save_project(pid, db)
    audit_service.log_event(
        pid,
        action="elements_bulk_updated",
        username=session.get("user", "system"),
        entity_type="element",
        entity_id=ids[0] if ids else 0,
        message=f"{len(updated)} elementos atualizados em lote",
        extra={"updated": len(updated), "failed": len(failed), "ids": ids},
    )
    return jsonify({"updated": len(updated), "failed": failed}), 200


@elements_bp.route("/api/projects/<pid>/elements/bulk-delete", methods=["POST"])
@limiter.limit("10 per minute")
@require_perm("edit_elements")
def bulk_delete_elements(pid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404

    payload = request.get_json(silent=True) or {}
    ids = payload.get("ids", [])
    if not isinstance(ids, list) or not ids:
        return jsonify({"error": "Lista de IDs obrigatoria"}), 400

    deleted = []
    failed = []
    for eid in ids:
        result = element_service.delete_element(db, int(eid))
        if result:
            deleted.append(int(eid))
        else:
            failed.append(int(eid))

    if deleted:
        project_service.save_project(pid, db)
        audit_service.log_event(
            pid,
            action="elements_bulk_deleted",
            username=session.get("user", "system"),
            entity_type="element",
            entity_id=ids[0] if ids else 0,
            message=f"{len(deleted)} elementos removidos em lote",
            extra={"deleted": len(deleted), "failed": len(failed), "ids": ids},
        )
    return jsonify({"deleted": len(deleted), "failed": failed}), 200


@elements_bp.route("/api/projects/<pid>/elements/export.csv")
@require_login
def export_elements_csv(pid):
    import csv, io

    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404

    elements = db.get("elements", [])

    # Apply same filters/search as the list endpoint
    from ..utils.query import (
        parse_filters,
        parse_search,
        apply_filters,
        apply_search,
        parse_sorting,
        apply_sorting,
    )

    items = list(elements)
    filters = parse_filters()
    search = parse_search()
    sort, order = parse_sorting(["nome", "tipo", "status", "id"])

    if filters:
        items = apply_filters(items, filters)
    if search:
        items = apply_search(items, search, ["nome", "detalhes", "endereco", "modelo"])
    items = apply_sorting(items, sort, order)

    output = io.StringIO()
    output.write("\ufeff")  # BOM para Excel Windows
    writer = csv.writer(output)
    writer.writerow(
        [
            "ID",
            "Nome",
            "Tipo",
            "Status",
            "Latitude",
            "Longitude",
            "Endereco",
            "CEP",
            "Observacao",
            "Criado em",
        ]
    )
    for el in items:
        writer.writerow(
            [
                el.get("id", ""),
                el.get("nome", ""),
                el.get("tipo", ""),
                el.get("status", ""),
                el.get("lat", ""),
                el.get("lng", ""),
                el.get("endereco", ""),
                el.get("cep", ""),
                el.get("observacao", el.get("detalhes", "")),
                el.get("created_at", ""),
            ]
        )

    from flask import make_response

    response = make_response(output.getvalue())
    response.headers["Content-Type"] = "text/csv; charset=utf-8"
    response.headers["Content-Disposition"] = (
        f"attachment; filename=netmap-inventario-{pid}.csv"
    )
    return response


@elements_bp.route("/api/projects/<pid>/positions")
@require_login
def get_positions(pid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({}), 200
    return jsonify(db.get("positions", {}))


@elements_bp.route("/api/projects/<pid>/positions", methods=["POST"])
@limiter.limit("15 per minute")
@require_perm("edit_elements")
def save_positions(pid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "Payload invalido"}), 400

    saved = element_service.save_positions(db, payload)
    if not saved:
        return jsonify({"error": "Not found"}), 404

    project_service.save_project(pid, db)
    audit_service.log_event(
        pid,
        action="positions_saved",
        username=session.get("user", "system"),
        entity_type="project",
        entity_id=pid,
        message="Posicoes da topologia atualizadas",
        extra={"count": len(payload)},
    )
    return jsonify({"ok": True})
