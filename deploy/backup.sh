#!/usr/bin/env bash
set -euo pipefail

backup_dir="/opt/NetMap/backups"
timestamp="$(date +%Y%m%d_%H%M%S)"
mkdir -p "$backup_dir"

pg_dump --format=custom --file="$backup_dir/netmap_${timestamp}.dump" "$DATABASE_URL"
tar -czf "$backup_dir/netmap_files_${timestamp}.tar.gz" -C /opt/NetMap data
find "$backup_dir" -type f -mtime +30 -delete

