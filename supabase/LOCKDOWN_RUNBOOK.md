# Slice 0.1 — Website database lockdown: go-live runbook

Branch: `security/db-lockdown` · Live project: `ihpnwimpfwalkhywhhqu` (Crumella)

## What changes
| Area | Before | After |
|---|---|---|
| Orders, loyalty cards, vouchers, feedback | Anyone with the public key can read/edit | Admin account only |
| Checkout | Browser writes order, voucher count, points separately | One server call `place_order` (atomic, retry-safe) |
| Vouchers | Browser reads the whole table | `check_voucher` returns only "valid / ₱X off" |
| Track order | Browser reads `orders` | `track_order` returns status + items only |
| Rewards page | Browser reads/updates cards; `%` last name matched any card | `rewards_login`, `activate_rewards_card`, `check_rewards_card` |
| Free reward items | Could be added to cart without points | Server prices rewards from `rewards_catalog` and deducts points |
| Payment proofs | Public bucket | Private; customers upload only; admin opens signed links |
| Admin | Any logged-in account | `app_metadata.role = 'admin'` |
| `/test` page | Public "simulate checkout" | Removed |

## Files
- `supabase/migrations/20261118000000_baseline_live_schema.sql` — live structure as found (already on live; mark applied, never run there)
- `supabase/migrations/20261118000100_lockdown_add_functions.sql` — **Phase A**: adds functions only
- `supabase/migrations/20261118000200_lockdown_close_access.sql` — **Phase B**: closes old access
- `supabase/rollback/*_down.sql` — undo per phase (tested: full undo matches live exactly)
- `supabase/snapshot/2026-11-18_pre_lockdown_security.sql` — record of the pre-lockdown rules
- `supabase/tests/run.sh` — local rebuild + 64 checks

## Local testing
```
supabase start            # Docker Desktop must be running
sh supabase/tests/run.sh   # rebuild local DB + run the 64 automated checks (they CHANGE the fake data)
sh supabase/tests/fresh.sh # rebuild clean fake data for clicking through by hand (run AFTER run.sh)
npx next dev -p 3005       # site against LOCAL db (.env.local points to 127.0.0.1)
```
Local admin login (fake, local only): `admin@example.com` / `test-password-123` (created by fresh.sh).

## Go-live (quiet hours, ~30 min, Dan + Claude)
| # | Step | Command / action | Check |
|---|---|---|---|
| 0 | Sign-ups OFF | Dashboard → Authentication → Sign In / Providers | toggle off |
| 1 | Give Dan's account the admin role | `update auth.users set raw_app_meta_data = raw_app_meta_data \|\| '{"role":"admin"}' where email = '<Dan types it>';` | 1 row |
| 2 | Tell CLI the baseline is already there | `supabase migration repair --status applied 20261118000000 --linked` | `supabase migration list --linked` |
| 3 | **Phase A** (safe: additions only) | `supabase db push --linked` **with only 000100 present** (see note) | old site still works: place a test order |
| 4 | Deploy new website | merge `security/db-lockdown` → `main`, push; Vercel builds | Vercel "Ready" |
| 5 | Test on live (new site, old access still open) | test order (cash), tracking, voucher, rewards login, admin page + "View Proof" | all OK |
| 6 | **Phase B** (close access) | `supabase db push --linked` (applies 000200) | — |
| 7 | Re-test on live | Dan logs out/in on admin page; test order with GCash proof; tracking; admin sees order + proof | all OK |
| 8 | Stranger check on live | run read-only anon checks (orders/cards/vouchers return nothing, public proof URL 400) | all blocked |
| 9 | Clean up | cancel/delete test orders in admin | — |

Note for step 3: `db push` applies every pending migration. To push only Phase A, temporarily move the 000200 file out of `supabase/migrations/` (or push after step 2 with the file moved), then move it back before step 6.

## If something breaks
| Situation | Do |
|---|---|
| After Phase A, old site checkout fails | `supabase db query --linked -f supabase/rollback/20261118000100_lockdown_add_functions_down.sql` |
| After step 4, new site broken | Vercel → Deployments → previous → "Promote to Production" (Phase A is harmless to the old site) |
| After Phase B, checkout/admin broken | `supabase db query --linked -f supabase/rollback/20261118000200_lockdown_close_access_down.sql` (re-opens access, new site keeps working) |
| Admin page empty after Phase B | Log out and back in (admin role is read at login); check step 1 |

## Known limitations (backlog, not in this slice)
- Item **prices still come from the browser**. Server checks shape, rewards and does the maths, but a tampered price is not caught. Fix: menu prices in the database (Feature 3/8).
- Reward point costs live in two places: `app/points/page.tsx` (display) and `rewards_catalog` (enforced). Change both together.
- Tracking numbers are 5 random characters; tracking now reveals only name, status, date and items.
- Admin page realtime updates never worked on live (orders table not in the realtime publication). Unchanged.
- Old stray SQL files `supabase_setup.sql` and `app/payment/supabase_setup.sql` grant the public key full points access. Do not run them.
