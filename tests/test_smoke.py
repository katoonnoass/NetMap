"""Smoke tests — verify the app boots and basic endpoints respond."""

from .conftest import TEST_ADMIN_PASSWORD


class TestAppBoots:
    """The app can be created and serves pages."""

    def test_app_exists(self, app):
        """App factory creates a Flask instance."""
        assert app is not None
        assert app.testing is True

    def test_index_redirects_to_login(self, client):
        """Unauthenticated GET / redirects to /login."""
        resp = client.get("/")
        assert resp.status_code == 302
        assert "/login" in resp.headers.get("Location", "")

    def test_login_page_served(self, client):
        """GET /login renders the login form."""
        resp = client.get("/login")
        assert resp.status_code == 200
        assert b"login" in resp.data.lower() or b"entrar" in resp.data.lower()


class TestAuthAPI:
    """Authentication endpoints work."""

    def test_login_wrong_credentials(self, client):
        """POST /api/auth/login with wrong password returns 401."""
        resp = client.post(
            "/api/auth/login",
            json={
                "username": "admin",
                "password": "wrong_password",
            },
        )
        assert resp.status_code == 401

    def test_login_success(self, client):
        """POST /api/auth/login with correct credentials returns user data."""
        resp = client.post(
            "/api/auth/login",
            json={
                "username": "admin",
                "password": TEST_ADMIN_PASSWORD,
            },
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data is not None
        assert data.get("username") == "admin"
        assert data.get("role") == "admin"

    def test_auth_me_requires_login(self, client):
        """GET /api/auth/me without session returns 401."""
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401

    def test_auth_me_authenticated(self, auth_client):
        """GET /api/auth/me with valid session returns user info."""
        resp = auth_client.get("/api/auth/me")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data is not None
        assert "username" in data
        assert "permissions" in data

    def test_change_password_requires_current_password(self, auth_client):
        resp = auth_client.post(
            "/api/auth/change-password",
            json={
                "current_password": "wrong_password",
                "new_password": "AnotherSecure@123",
            },
        )
        assert resp.status_code == 400

    def test_change_password_rotates_session(self, client):
        client.post(
            "/api/auth/login",
            json={"username": "admin", "password": TEST_ADMIN_PASSWORD},
        )
        new_password = "ChangedAdmin@123"
        resp = client.post(
            "/api/auth/change-password",
            json={
                "current_password": TEST_ADMIN_PASSWORD,
                "new_password": new_password,
            },
        )
        assert resp.status_code == 200
        assert client.get("/api/auth/me").status_code == 401
        assert client.post(
            "/api/auth/login",
            json={"username": "admin", "password": new_password},
        ).status_code == 200


class TestProjectsAPI:
    """Project listing works."""

    def test_projects_requires_auth(self, client):
        """GET /api/projects requires authentication."""
        resp = client.get("/api/projects")
        assert resp.status_code == 401

    def test_projects_list_authenticated(self, auth_client):
        """Authenticated user can list projects with pagination metadata."""
        resp = auth_client.get("/api/projects")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data is not None
        assert isinstance(data, dict)
        assert "items" in data
        assert isinstance(data["items"], list)
        assert "page" in data
        assert "total" in data


class TestProductionPolicies:
    def test_health_reports_storage_backend(self, client):
        resp = client.get("/api/health")
        assert resp.status_code == 200
        assert resp.get_json()["database"] == "json"

    def test_security_headers_are_present(self, client):
        resp = client.get("/login")
        assert resp.headers["X-Content-Type-Options"] == "nosniff"
        assert resp.headers["X-Frame-Options"] == "DENY"
        assert resp.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"



class TestFixMojibake:
    """The mojibake fix utility works correctly."""

    def test_fix_mojibake_importable(self):
        """fix_mojibake module can be imported."""
        from tools.fix_mojibake import fix_mojibake

        assert fix_mojibake is not None

    def test_fix_accented_portuguese(self):
        """Common Portuguese mojibake patterns are fixed."""
        from tools.fix_mojibake import fix_mojibake

        cases = [
            ("CÃ\x81LCULO AUTOMÃ\x81TICO", "CÁLCULO AUTOMÁTICO"),
            ("FUNÃ‡Ã•ES", "FUNÇÕES"),
            ("conexÃ£o", "conexão"),
            ("permissÃ£o", "permissão"),
            ("InformaÃ§Ãµes", "Informações"),
        ]
        for corrupted, expected in cases:
            assert fix_mojibake(corrupted) == expected

    def test_fix_idempotent(self):
        """Running fix twice produces same result."""
        from tools.fix_mojibake import fix_mojibake

        fixed_once = fix_mojibake("CÃ\x81LCULO")
        fixed_twice = fix_mojibake(fixed_once)
        assert fixed_once == fixed_twice == "CÁLCULO"

    def test_ascii_preserved(self):
        """Plain ASCII text is unchanged."""
        from tools.fix_mojibake import fix_mojibake

        original = "var x = function() { return 42; };"
        assert fix_mojibake(original) == original
