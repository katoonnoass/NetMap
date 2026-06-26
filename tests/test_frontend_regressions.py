"""Static contracts for map rendering, mobile layout, and local assets."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8-sig")


def test_map_tiles_have_horizontal_pan_protection():
    app_map = read("static/app-map.js")
    app_css = read("static/app.css")
    assert "fadeAnimation:false" in app_map
    assert "updateInterval:50" in app_map
    assert "keepBuffer:8" in app_map
    assert "width:257px" in app_css
    assert '[data-theme="dark"] #geo-map .leaflet-tile { background-color:var(--map-bg); }' in app_css


def test_mobile_map_controls_do_not_share_vertical_bands():
    app_css = read("static/app.css")
    assert "#geo-map #addr-search-bar { top: 52px" in app_css
    assert "#geo-map #map-legend { top: 100px" in app_css
    assert "#right-panel.hidden { width: 100%" in app_css
    assert "#user-nome { display: none; }" in app_css


def test_mobile_sidebar_starts_collapsed():
    app_auth = read("static/app-auth.js")
    workflows = read("static/app-workflows.js")
    assert "matchMedia('(max-width: 768px)')" in app_auth
    assert "matchMedia('(max-width: 768px)')" in workflows


def test_map_dependencies_are_local():
    index = read("templates/index.html")
    assert "cdnjs.cloudflare.com/ajax/libs/leaflet" not in index
    assert "unpkg.com/leaflet" not in index
    assert "/static/vendor/leaflet/leaflet.js" in index
    assert "/static/vendor/leaflet-markercluster/leaflet.markercluster.js" in index

