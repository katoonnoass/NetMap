"""
Importacao e exportacao de dados geograficos em KML/KMZ.
"""
from __future__ import annotations

import io
import math
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from . import project_service

KML_NS = "http://www.opengis.net/kml/2.2"
NS = {"kml": KML_NS}


def _coord_key(lat, lng) -> tuple[float, float]:
    return (round(float(lat), 6), round(float(lng), 6))


def _safe_text(value) -> str:
    return str(value or "").strip()


def _bool_text(value) -> str:
    return "true" if value else "false"


def _parse_bool(value) -> bool:
    return str(value or "").strip().lower() in {"1", "true", "sim", "yes", "y"}


def _parse_float(value):
    try:
        return float(str(value).strip().replace(",", "."))
    except (TypeError, ValueError):
        return None


def _parse_coords(raw: str) -> list[tuple[float, float]]:
    coords = []
    for chunk in (raw or "").replace("\n", " ").split():
        parts = chunk.split(",")
        if len(parts) < 2:
            continue
        lng = _parse_float(parts[0])
        lat = _parse_float(parts[1])
        if lat is None or lng is None:
            continue
        coords.append((lat, lng))
    return coords


def _infer_type(name: str, metadata: dict[str, str]) -> str:
    explicit = _safe_text(metadata.get("tipo")).lower()
    if explicit:
        return explicit
    text = f"{name} {metadata.get('category', '')}".lower()
    rules = [
        ("cliente", "cliente"),
        ("cto", "cto"),
        ("dio", "dio"),
        ("olt", "olt"),
        ("splitter", "splitter"),
        ("core", "core"),
        ("bgp", "bgp"),
        ("switch", "switch"),
        ("roteador", "roteador"),
        ("router", "roteador"),
        ("ceo", "ceo"),
        ("caixa", "caixa"),
        ("poste", "poste"),
    ]
    for token, tipo in rules:
        if token in text:
            return tipo
    return "poste"


def _append_extended_data(parent, values: dict[str, object]) -> None:
    ext = ET.SubElement(parent, f"{{{KML_NS}}}ExtendedData")
    for key, value in values.items():
        data = ET.SubElement(ext, f"{{{KML_NS}}}Data", name=str(key))
        ET.SubElement(data, f"{{{KML_NS}}}value").text = _safe_text(value)


def _extract_metadata(placemark) -> dict[str, str]:
    metadata: dict[str, str] = {}
    for data in placemark.findall(".//kml:ExtendedData/kml:Data", NS):
        name = _safe_text(data.attrib.get("name"))
        value = _safe_text(data.findtext("kml:value", default="", namespaces=NS))
        if name:
            metadata[name] = value
    for data in placemark.findall(".//kml:ExtendedData/kml:SchemaData/kml:SimpleData", NS):
        name = _safe_text(data.attrib.get("name"))
        value = _safe_text(data.text)
        if name:
            metadata[name] = value
    return metadata


def _find_element_by_coordinate(elements_by_coord: dict[tuple[float, float], int], coords: tuple[float, float]):
    return elements_by_coord.get(_coord_key(coords[0], coords[1]))


def _estimate_length_meters(points: list[tuple[float, float]]) -> float | None:
    if len(points) < 2:
        return None
    total = 0.0
    radius = 6371000.0
    for (lat1, lng1), (lat2, lng2) in zip(points, points[1:]):
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lng2 - lng1)
        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
        total += 2 * radius * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(total, 2)


def export_project_kml(pid: str) -> tuple[str, str] | None:
    db = project_service.load_project(pid)
    if not db:
        return None

    elements_by_id = {element["id"]: element for element in db.get("elements", [])}
    root = ET.Element(f"{{{KML_NS}}}kml")
    document = ET.SubElement(root, f"{{{KML_NS}}}Document")
    ET.SubElement(document, f"{{{KML_NS}}}name").text = db.get("name", pid)
    ET.SubElement(document, f"{{{KML_NS}}}description").text = db.get("description", "")

    elements_folder = ET.SubElement(document, f"{{{KML_NS}}}Folder")
    ET.SubElement(elements_folder, f"{{{KML_NS}}}name").text = "Elementos"

    for element in db.get("elements", []):
        lat = _parse_float(element.get("lat"))
        lng = _parse_float(element.get("lng"))
        if lat is None or lng is None:
            continue
        placemark = ET.SubElement(elements_folder, f"{{{KML_NS}}}Placemark")
        ET.SubElement(placemark, f"{{{KML_NS}}}name").text = element.get("nome", f"Elemento {element['id']}")
        ET.SubElement(placemark, f"{{{KML_NS}}}description").text = _safe_text(element.get("detalhes"))
        _append_extended_data(placemark, {
            "feature_type": "element",
            "source_id": element["id"],
            "tipo": element.get("tipo", ""),
            "status": element.get("status", ""),
            "modelo": element.get("modelo", ""),
            "endereco": element.get("endereco", ""),
            "detalhes": element.get("detalhes", ""),
        })
        point = ET.SubElement(placemark, f"{{{KML_NS}}}Point")
        ET.SubElement(point, f"{{{KML_NS}}}coordinates").text = f"{lng},{lat},0"

    cables_folder = ET.SubElement(document, f"{{{KML_NS}}}Folder")
    ET.SubElement(cables_folder, f"{{{KML_NS}}}name").text = "Cabos"

    for connection in db.get("connections", []):
        source = elements_by_id.get(connection.get("from"))
        target = elements_by_id.get(connection.get("to"))
        if not source or not target:
            continue
        source_lat = _parse_float(source.get("lat"))
        source_lng = _parse_float(source.get("lng"))
        target_lat = _parse_float(target.get("lat"))
        target_lng = _parse_float(target.get("lng"))
        if None in {source_lat, source_lng, target_lat, target_lng}:
            continue
        points = [(source_lat, source_lng)]
        for waypoint in connection.get("waypoints", []) or []:
            wp_lat = _parse_float(waypoint.get("lat"))
            wp_lng = _parse_float(waypoint.get("lng"))
            if wp_lat is not None and wp_lng is not None:
                points.append((wp_lat, wp_lng))
        points.append((target_lat, target_lng))
        if len(points) < 2:
            continue
        placemark = ET.SubElement(cables_folder, f"{{{KML_NS}}}Placemark")
        ET.SubElement(placemark, f"{{{KML_NS}}}name").text = connection.get("fibra") or f"Cabo {connection['id']}"
        ET.SubElement(placemark, f"{{{KML_NS}}}description").text = _safe_text(connection.get("porta"))
        _append_extended_data(placemark, {
            "feature_type": "connection",
            "source_id": connection["id"],
            "from_source_id": source["id"],
            "to_source_id": target["id"],
            "from_name": source.get("nome", ""),
            "to_name": target.get("nome", ""),
            "porta": connection.get("porta", ""),
            "fibra": connection.get("fibra", ""),
            "cor": connection.get("cor", ""),
            "broken": _bool_text(connection.get("broken")),
            "length": connection.get("length", ""),
            "obs": connection.get("obs", ""),
        })
        line = ET.SubElement(placemark, f"{{{KML_NS}}}LineString")
        ET.SubElement(line, f"{{{KML_NS}}}tessellate").text = "1"
        ET.SubElement(line, f"{{{KML_NS}}}coordinates").text = " ".join(
            f"{lng},{lat},0" for lat, lng in points
        )

    ET.indent(root, space="  ")
    xml = ET.tostring(root, encoding="utf-8", xml_declaration=True).decode("utf-8")
    return db.get("name", pid), xml


def export_project_kmz(pid: str) -> tuple[str, bytes] | None:
    exported = export_project_kml(pid)
    if not exported:
        return None
    project_name, kml = exported
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("doc.kml", kml.encode("utf-8"))
    return project_name, buffer.getvalue()


def import_project_geodata(pid: str, filename: str, file_bytes: bytes) -> dict | None:
    db = project_service.load_project(pid)
    if not db:
        return None
    if not file_bytes:
        raise ValueError("Arquivo vazio")

    suffix = Path(filename or "").suffix.lower()
    if suffix == ".kmz":
        try:
            with zipfile.ZipFile(io.BytesIO(file_bytes)) as zf:
                kml_name = next((name for name in zf.namelist() if name.lower().endswith(".kml")), None)
                if not kml_name:
                    raise ValueError("KMZ sem arquivo KML interno")
                kml_bytes = zf.read(kml_name)
        except zipfile.BadZipFile as exc:
            raise ValueError("Arquivo KMZ invalido") from exc
    elif suffix == ".kml":
        kml_bytes = file_bytes
    else:
        raise ValueError("Formato suportado: .kml ou .kmz")

    try:
        root = ET.fromstring(kml_bytes)
    except ET.ParseError as exc:
        raise ValueError("Arquivo KML invalido") from exc

    elements_by_coord = {}
    for element in db.get("elements", []):
        lat = _parse_float(element.get("lat"))
        lng = _parse_float(element.get("lng"))
        if lat is not None and lng is not None:
            elements_by_coord[_coord_key(lat, lng)] = element["id"]

    source_id_map: dict[str, int] = {}
    created_elements = 0
    created_connections = 0
    skipped_connections = 0
    pending_lines = []

    for placemark in root.findall(".//kml:Placemark", NS):
        metadata = _extract_metadata(placemark)
        name = _safe_text(placemark.findtext("kml:name", default="", namespaces=NS)) or "Elemento importado"
        description = _safe_text(placemark.findtext("kml:description", default="", namespaces=NS))

        point_text = placemark.findtext(".//kml:Point/kml:coordinates", default="", namespaces=NS)
        if point_text:
            coords = _parse_coords(point_text)
            if not coords:
                continue
            lat, lng = coords[0]
            existing_id = _find_element_by_coordinate(elements_by_coord, (lat, lng))
            if existing_id:
                if metadata.get("source_id"):
                    source_id_map[str(metadata["source_id"])] = existing_id
                continue
            new_element = {
                "id": project_service.next_id(db),
                "nome": name,
                "tipo": _infer_type(name, metadata),
                "status": _safe_text(metadata.get("status")) or "ativo",
                "detalhes": _safe_text(metadata.get("detalhes")) or description,
                "endereco": _safe_text(metadata.get("endereco")),
                "modelo": _safe_text(metadata.get("modelo")),
                "lat": lat,
                "lng": lng,
            }
            db.setdefault("elements", []).append(new_element)
            elements_by_coord[_coord_key(lat, lng)] = new_element["id"]
            if metadata.get("source_id"):
                source_id_map[str(metadata["source_id"])] = new_element["id"]
            created_elements += 1
            continue

        line_text = placemark.findtext(".//kml:LineString/kml:coordinates", default="", namespaces=NS)
        if line_text:
            pending_lines.append({
                "name": name,
                "metadata": metadata,
                "description": description,
                "coords": _parse_coords(line_text),
            })

    for item in pending_lines:
        coords = item["coords"]
        if len(coords) < 2:
            skipped_connections += 1
            continue
        metadata = item["metadata"]
        from_id = source_id_map.get(str(metadata.get("from_source_id", "")))
        to_id = source_id_map.get(str(metadata.get("to_source_id", "")))
        if not from_id:
            from_id = _find_element_by_coordinate(elements_by_coord, coords[0])
        if not to_id:
            to_id = _find_element_by_coordinate(elements_by_coord, coords[-1])
        if not from_id or not to_id or from_id == to_id:
            skipped_connections += 1
            continue
        length = _parse_float(metadata.get("length"))
        if length is None:
            length = _estimate_length_meters(coords)
        db.setdefault("connections", []).append({
            "id": project_service.next_id(db),
            "from": int(from_id),
            "to": int(to_id),
            "porta": _safe_text(metadata.get("porta")) or item["description"],
            "fibra": _safe_text(metadata.get("fibra")) or item["name"],
            "cor": _safe_text(metadata.get("cor")),
            "broken": _parse_bool(metadata.get("broken")),
            "length": length,
            "obs": _safe_text(metadata.get("obs")),
            "waypoints": [
                {"lat": lat, "lng": lng}
                for lat, lng in coords[1:-1]
            ],
        })
        created_connections += 1

    project_service.save_project(pid, db)
    return {
        "ok": True,
        "file_name": Path(filename or "").name,
        "project_id": pid,
        "imported_elements": created_elements,
        "imported_connections": created_connections,
        "skipped_connections": skipped_connections,
        "total_elements": len(db.get("elements", [])),
        "total_connections": len(db.get("connections", [])),
    }
