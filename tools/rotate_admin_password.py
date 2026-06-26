"""Set a one-time administrator password that must be rotated after login."""

import os

from app import create_app
from app.services.user_service import set_initial_password


def main() -> None:
    password = os.environ.get("NEW_ADMIN_PASSWORD", "")
    if not password:
        raise SystemExit("NEW_ADMIN_PASSWORD is required")
    app = create_app()
    with app.app_context():
        set_initial_password("admin", password)
    print("admin password rotated")


if __name__ == "__main__":
    main()

