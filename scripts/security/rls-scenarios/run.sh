#!/usr/bin/env bash
# Checks who can write what in the database, against a throwaway local
# Postgres that copies the live row-level security policies.
#
# Usage: scripts/security/rls-scenarios/run.sh [extra.sql ...]
#   e.g. run.sh supabase/migrations/20261109130000_lock_down_row_level_security.sql
# Needs: local Postgres (brew install postgresql@14), Supabase CLI logged in
# and linked (read-only query of pg_policies).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
WORK="$(mktemp -d)"; PORT=54331
trap 'pg_ctl -D "$WORK/data" stop >/dev/null 2>&1 || true; rm -rf "$WORK"' EXIT

supabase db query --linked -o json "select string_agg(format('CREATE POLICY %I ON public.%I AS %s FOR %s TO %s%s%s;', policyname, tablename, permissive, cmd, array_to_string(roles, ', '), case when qual is not null then ' USING ('||qual||')' else '' end, case when with_check is not null then ' WITH CHECK ('||with_check||')' else '' end), E'\n') as ddl from pg_policies where schemaname='public' and tablename in ('profiles','brands','products','catalogues','tailors','catalogue_images','notifications','reviews','brand_images')" 2>/dev/null \
  | python3 -c "import json,sys; raw=sys.stdin.read(); print(json.loads(raw[raw.index('{'):])['rows'][0]['ddl'])" > "$WORK/live_policies.sql"

initdb -D "$WORK/data" -U postgres -A trust >/dev/null
pg_ctl -D "$WORK/data" -o "-p $PORT -k $WORK" -l "$WORK/log" start >/dev/null; sleep 2
psql -h "$WORK" -p $PORT -U postgres -q -c "create database rls"
psql -h "$WORK" -p $PORT -U postgres -d rls -q -v ON_ERROR_STOP=1 -f "$HERE/base.sql" -f "$WORK/live_policies.sql" -f "$HERE/seed.sql"
for f in "$@"; do psql -h "$WORK" -p $PORT -U postgres -d rls -q -v ON_ERROR_STOP=1 -f "$f" 2>&1 | grep -v NOTICE || true; done
PGPORT_RLS=$PORT python3 -I "$HERE/scenarios.py" "$WORK" rls
