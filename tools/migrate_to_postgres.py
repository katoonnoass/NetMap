"""Migrate current JSON data into the configured PostgreSQL database."""

import json

from app import create_app
from app.utils.storage import migrate_json_to_postgres


def main() -> None:
    app = create_app()
    with app.app_context():
        result = migrate_json_to_postgres()
    print(json.dumps(result, ensure_ascii=False, sort_keys=True))


if __name__ == "__main__":
    main()

