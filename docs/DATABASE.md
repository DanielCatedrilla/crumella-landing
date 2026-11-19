# Database (Supabase)

The database schema, migrations, rollbacks, tests and server functions for
this website now live in the **crumella-ops** repo:

https://github.com/DanielCatedrilla/crumella-ops/tree/main/supabase

The website, the Crumella Ops phone app and (later) the Business Hub share
one Supabase project. Make every database change there, not here.

- Changing a menu price: `supabase/PRICE_CHANGES.md` in crumella-ops
  (also update `components/Menu.tsx` in this repo).
- Lockdown history and go-live notes: `supabase/LOCKDOWN_RUNBOOK.md`.
