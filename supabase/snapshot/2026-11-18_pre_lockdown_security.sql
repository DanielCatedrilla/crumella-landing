-- =====================================================================
-- SNAPSHOT: live security state of the Crumella Supabase project
-- Taken: 2026-11-18, before the Slice 0.1 lockdown.
-- Source: read-only catalog queries (pg_policies, pg_proc, storage.buckets).
--
-- Purpose: this file recreates EXACTLY the access rules and functions that
-- existed before the lockdown. It is the core of the rollback script.
-- It contains no customer data.
-- =====================================================================

-- ---------- Tables (all had RLS enabled, not forced) ----------
-- feedbacks, loyalty_cards, orders, pop_up_locations, vouchers
alter table public.feedbacks        enable row level security;
alter table public.loyalty_cards    enable row level security;
alter table public.orders           enable row level security;
alter table public.pop_up_locations enable row level security;
alter table public.vouchers         enable row level security;

-- ---------- feedbacks ----------
create policy "Public can read feedbacks" on public.feedbacks
  for select to anon using (true);
create policy "admin_all_feedbacks" on public.feedbacks
  for all to authenticated using (true) with check (true);
create policy "anon_insert_feedbacks" on public.feedbacks
  for insert to anon with check (true);

-- ---------- loyalty_cards ----------
create policy "Enable card activation updates" on public.loyalty_cards
  for update to public using (is_activated = false) with check (true);
create policy "Enable public read access" on public.loyalty_cards
  for select to public using (true);
create policy "admin_all_loyalty_cards" on public.loyalty_cards
  for all to authenticated using (true) with check (true);
create policy "anon_read_loyalty_cards" on public.loyalty_cards
  for select to anon using (true);

-- ---------- orders ----------
create policy "Enable insert for everyone" on public.orders
  for insert to public with check (true);
create policy "Enable read for everyone" on public.orders
  for select to public using (true);
create policy "admin_all_orders" on public.orders
  for all to authenticated using (true) with check (true);
create policy "customers_insert_orders" on public.orders
  for insert to anon with check (true);

-- ---------- pop_up_locations ----------
create policy "Enable public read access" on public.pop_up_locations
  for select to public using (true);

-- ---------- vouchers ----------
create policy "Enable read access for all users" on public.vouchers
  for select to public using (true);
create policy "Enable update for usage count" on public.vouchers
  for update to public using (true);
create policy "admin_all_vouchers" on public.vouchers
  for all to authenticated using (true) with check (true);
create policy "anon_read_vouchers" on public.vouchers
  for select to anon using (true);
create policy "anon_update_vouchers" on public.vouchers
  for update to anon using (true) with check (true);

-- ---------- storage: proofs bucket (was public = true) ----------
update storage.buckets set public = true where id = 'proofs';
create policy "Enable read access for everyone" on storage.objects
  for select to public using (bucket_id = 'proofs');
create policy "Enable upload for everyone" on storage.objects
  for insert to public with check (bucket_id = 'proofs');

-- ---------- functions ----------
create or replace function public.add_points(card_id text, points_to_add integer)
returns void language plpgsql security definer set search_path to 'public'
as $function$
BEGIN
  UPDATE loyalty_cards
  SET points = points + points_to_add
  WHERE unique_id = card_id;
END;
$function$;

create or replace function public.deduct_points(card_id text, points_to_deduct integer)
returns void language plpgsql security definer set search_path to 'public'
as $function$
BEGIN
  UPDATE loyalty_cards
  SET points = points - points_to_deduct
  WHERE unique_id = card_id AND points >= points_to_deduct;
END;
$function$;

-- NOTE: expire_inactive_points() also exists. It references a column
-- (last_activity_at) that does not exist, so it fails if ever called.
-- Left untouched by the lockdown.

grant execute on function public.add_points(text, integer)    to anon, authenticated;
grant execute on function public.deduct_points(text, integer) to anon, authenticated;

-- ---------- facts recorded at snapshot time ----------
-- auth.users: 1 account (the admin login)
-- approx rows: orders 142, loyalty_cards 56, vouchers 100
-- extensions: pg_cron installed, no scheduled jobs returned
-- anon role had default table grants on all public tables (RLS was the only gate)
