#!/usr/bin/env sh
# Rebuild the LOCAL database with clean fake seed data for manual
# click-testing (does NOT run the automated checks, which change data).
# Creates a local-only admin login: admin@example.com / test-password-123
set -e
cd "$(dirname "$0")/../.."
supabase db reset --local >/dev/null 2>&1 || true
docker restart "supabase_kong_$(grep -m1 '^project_id' supabase/config.toml | cut -d'"' -f2)" >/dev/null
node --input-type=module -e '
import { execSync } from "node:child_process";
const env = Object.fromEntries(execSync("supabase status -o env", { encoding: "utf8", stdio: ["ignore","pipe","ignore"] })
  .split(/\r?\n/).map(l => l.match(/^([A-Z_]+)="?(.*?)"?$/)).filter(Boolean).map(m => [m[1], m[2]]));
if (!/127\.0\.0\.1|localhost/.test(env.API_URL)) throw new Error("not local");
for (let i = 0; i < 60; i++) {
  try { const r = await fetch(env.API_URL + "/auth/v1/health", { headers: { apikey: env.ANON_KEY } }); if (r.ok) break; } catch {}
  await new Promise(r => setTimeout(r, 1000));
}
const r = await fetch(env.API_URL + "/auth/v1/admin/users", {
  method: "POST",
  headers: { apikey: env.SERVICE_ROLE_KEY, Authorization: "Bearer " + env.SERVICE_ROLE_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@example.com", password: "test-password-123", email_confirm: true, app_metadata: { role: "admin" } }),
});
// An old-style proof at the bucket root, like the 24 real ones on live
// (seed order CRML-SEED1 links to it). 1x1 PNG.
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const up = await fetch(env.API_URL + "/storage/v1/object/proofs/legacy_proof.png", {
  method: "POST",
  headers: { apikey: env.SERVICE_ROLE_KEY, Authorization: "Bearer " + env.SERVICE_ROLE_KEY, "Content-Type": "image/png", "x-upsert": "true" },
  body: png,
});
console.log(r.ok ? "Fresh local data ready. Admin: admin@example.com / test-password-123" : "Admin user: " + r.status);
console.log(up.ok ? "Legacy proof uploaded for CRML-SEED1." : "Legacy proof upload failed: " + up.status);
'
