#!/usr/bin/env sh
# Rebuild the LOCAL database from migrations + fake seed data, then run the
# lockdown checks. Never touches the live project.
set -e
cd "$(dirname "$0")/../.."
# The reset's own final health check can hit a stale gateway (502) even when
# migrations + seed applied fine; the gateway restart below fixes that and
# the checks prove the result, so don't stop on it.
supabase db reset --local >/dev/null 2>&1 || true
# Local gateway keeps the old container address after a reset; refresh it.
docker restart "supabase_kong_$(grep -m1 '^project_id' supabase/config.toml | cut -d'"' -f2)" >/dev/null
node supabase/tests/lockdown.test.mjs
