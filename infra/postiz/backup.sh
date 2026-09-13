#!/usr/bin/env bash
set -euo pipefail

umask 077

project_dir="${POSTIZ_PROJECT_DIR:-/opt/aurendor-postiz}"
backup_root="${POSTIZ_BACKUP_DIR:-/var/backups/aurendor-postiz}"
retention_days="${POSTIZ_BACKUP_RETENTION_DAYS:-14}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
destination="$backup_root/$timestamp"

install -d -m 0700 "$destination"
cd "$project_dir"

docker compose \
  --env-file .postiz/.env \
  -f infra/postiz/docker-compose.yml \
  exec -T postiz-postgres \
  pg_dump -U postiz-user -d postiz-db -Fc > "$destination/postiz.pgdump"

docker run --rm \
  -v postiz_postiz-uploads:/source:ro \
  alpine:3.22 \
  tar -C /source -czf - . > "$destination/uploads.tgz"

install -m 0600 .postiz/.env "$destination/postiz.env"
sha256sum "$destination/postiz.pgdump" "$destination/uploads.tgz" "$destination/postiz.env" \
  > "$destination/SHA256SUMS"

find "$backup_root" -mindepth 1 -maxdepth 1 -type d -mtime "+$retention_days" -exec rm -rf -- {} +

