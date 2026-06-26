"""Browser regression tests for horizontal panning and mobile layout."""

import os

import pytest

pytestmark = pytest.mark.e2e


def _settings():
    url = os.environ.get("NETMAP_E2E_URL")
    username = os.environ.get("NETMAP_E2E_USER")
    password = os.environ.get("NETMAP_E2E_PASSWORD")
    if not all((url, username, password)):
        pytest.skip("Set NETMAP_E2E_URL, NETMAP_E2E_USER and NETMAP_E2E_PASSWORD")
    return url.rstrip("/"), username, password


def _login(page, url, username, password):
    page.goto(f"{url}/login", wait_until="domcontentloaded")
    page.locator("#inp-user").fill(username)
    page.locator("#inp-pass").fill(password)
    page.locator("#btn-login").click()
    page.wait_for_url(f"{url}/**")
    page.locator("#geo-map .leaflet-tile").first.wait_for(state="visible")


def _horizontal_gap(page):
    return page.evaluate(
        """
        () => {
          const map = document.getElementById('geo-map').getBoundingClientRect();
          const y = map.top + map.height / 2;
          const intervals = Array.from(document.querySelectorAll('.leaflet-tile'))
            .filter(img => img.complete && img.naturalWidth > 0)
            .map(img => img.getBoundingClientRect())
            .filter(r => y >= r.top && y <= r.bottom && r.right > map.left && r.left < map.right)
            .map(r => ({left: Math.max(map.left, r.left), right: Math.min(map.right, r.right)}))
            .sort((a, b) => a.left - b.left);
          let cursor = map.left;
          let maxGap = 0;
          for (const interval of intervals) {
            if (interval.left > cursor) maxGap = Math.max(maxGap, interval.left - cursor);
            cursor = Math.max(cursor, interval.right);
          }
          return Math.max(maxGap, map.right - cursor);
        }
        """
    )


def _drag_horizontally(page, start_x, end_x, y):
    page.mouse.move(start_x, y)
    page.mouse.down()
    page.mouse.move(end_x, y, steps=12)
    page.mouse.up()


def test_horizontal_pan_has_no_tile_gaps():
    from playwright.sync_api import sync_playwright

    url, username, password = _settings()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        _login(page, url, username, password)
        page.evaluate("localStorage.setItem('netmap-theme', 'dark')")
        page.reload(wait_until="domcontentloaded")
        page.locator("#geo-map .leaflet-tile").first.wait_for(state="visible")
        for index in range(8):
            _drag_horizontally(page, 300 if index % 2 == 0 else 1160, 1160 if index % 2 == 0 else 300, 420)
            assert _horizontal_gap(page) == 0
        browser.close()


def test_mobile_sidebar_and_map_controls():
    from playwright.sync_api import sync_playwright

    url, username, password = _settings()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 412, "height": 915})
        _login(page, url, username, password)
        assert "collapsed" in (page.locator("#sidebar").get_attribute("class") or "")
        floating = page.locator("#map-floating-bar").bounding_box()
        search = page.locator("#addr-search-bar").bounding_box()
        legend = page.locator("#map-legend").bounding_box()
        assert floating and search and legend
        assert floating["y"] + floating["height"] <= search["y"] + 1
        assert search["y"] + search["height"] <= legend["y"] + 1
        _drag_horizontally(page, 40, 390, 500)
        assert _horizontal_gap(page) == 0
        browser.close()

