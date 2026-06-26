"""
Servico de geocercas (fences) — areas poligonais no mapa.
Geofences sao armazenadas dentro do documento do projeto.
"""

from datetime import datetime


def list_fences(project: dict) -> list[dict]:
    return project.get("geofences", [])


def create_fence(project: dict, pid: str, data: dict) -> dict:
    fences = project.get("geofences", [])
    fence_id = max((f.get("id", 0) for f in fences), default=0) + 1
    fence = {
        "id": fence_id,
        "nome": data.get("nome", f"Geocerca {fence_id}"),
        "color": data.get("color", "#1A73E8"),
        "type": data.get("type", "warning"),
        "coordinates": data.get("coordinates", []),
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    fences.append(fence)
    project["geofences"] = fences
    return fence


def update_fence(project: dict, fence_id: int, data: dict) -> dict | None:
    fences = project.get("geofences", [])
    for fence in fences:
        if fence.get("id") == fence_id:
            if "nome" in data:
                fence["nome"] = data["nome"]
            if "color" in data:
                fence["color"] = data["color"]
            if "type" in data:
                fence["type"] = data["type"]
            if "coordinates" in data:
                fence["coordinates"] = data["coordinates"]
            return fence
    return None


def delete_fence(project: dict, fence_id: int) -> bool:
    fences = project.get("geofences", [])
    before = len(fences)
    project["geofences"] = [f for f in fences if f.get("id") != fence_id]
    return len(project["geofences"]) < before


def elements_in_fence(project: dict, fence_id: int) -> list[dict]:
    fences = project.get("geofences", [])
    fence = next((f for f in fences if f.get("id") == fence_id), None)
    if not fence or not fence.get("coordinates"):
        return []
    polygon = [(c.get("lat", 0), c.get("lng", 0)) for c in fence["coordinates"]]
    if len(polygon) < 3:
        return []
    result = []
    for el in project.get("elements", []):
        if el.get("lat") and el.get("lng"):
            if _point_in_polygon(float(el["lat"]), float(el["lng"]), polygon):
                result.append(
                    {
                        "id": el["id"],
                        "nome": el.get("nome", ""),
                        "tipo": el.get("tipo", ""),
                        "status": el.get("status", "ativo"),
                    }
                )
    return result


def _point_in_polygon(lat: float, lng: float, polygon: list[tuple]) -> bool:
    n = len(polygon)
    inside = False
    j = n - 1
    for i in range(n):
        lat_i, lng_i = polygon[i]
        lat_j, lng_j = polygon[j]
        if ((lng_i > lng) != (lng_j > lng)) and (
            lat < (lat_j - lat_i) * (lng - lng_i) / (lng_j - lng_i + 1e-12) + lat_i
        ):
            inside = not inside
        j = i
    return inside
