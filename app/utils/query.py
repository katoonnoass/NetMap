"""
Paginacao, filtros, ordenacao e busca reutilizaveis para endpoints de lista.
"""

from flask import request


DEFAULT_PAGE = 1
DEFAULT_PAGE_SIZE = 50
MAX_PAGE_SIZE = 200


def parse_pagination() -> dict:
    page = request.args.get("page", DEFAULT_PAGE, type=int)
    page_size = request.args.get("page_size", DEFAULT_PAGE_SIZE, type=int)
    page = max(1, page)
    page_size = min(max(1, page_size), MAX_PAGE_SIZE)
    offset = (page - 1) * page_size
    return {"page": page, "page_size": page_size, "offset": offset}


def parse_sorting(allowed: list[str]) -> tuple[str | None, str]:
    sort = request.args.get("sort", "").strip().lower()
    order = request.args.get("order", "asc").strip().lower()
    if sort not in allowed:
        sort = None
    if order not in ("asc", "desc"):
        order = "asc"
    return sort, order


def parse_filters() -> dict:
    filters: dict[str, str | list[str]] = {}
    for key in ("status", "tipo", "severity", "assigned_to", "category"):
        val = request.args.get(key, "").strip().lower()
        if val:
            filters[key] = [v.strip() for v in val.split(",")]
    return filters


def parse_search() -> str | None:
    q = request.args.get("search", "").strip()
    return q if q else None


def apply_filters(items: list[dict], filters: dict) -> list[dict]:
    for field, values in filters.items():
        items = [item for item in items if str(item.get(field, "")).lower() in values]
    return items


def apply_search(items: list[dict], query: str, fields: list[str]) -> list[dict]:
    q = query.lower()
    return [
        item for item in items if any(q in str(item.get(f, "")).lower() for f in fields)
    ]


def apply_sorting(items: list[dict], sort: str | None, order: str) -> list[dict]:
    if not sort:
        return items
    reverse = order == "desc"
    return sorted(
        items,
        key=lambda item: str(item.get(sort, "")).lower(),
        reverse=reverse,
    )


def paginate(items: list[dict], pagination: dict) -> tuple[list[dict], dict]:
    page = pagination["page"]
    page_size = pagination["page_size"]
    total = len(items)
    total_pages = max(1, (total + page_size - 1) // page_size) if total > 0 else 0
    sliced = items[pagination["offset"] : pagination["offset"] + page_size]
    meta = {
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1,
    }
    return sliced, meta
