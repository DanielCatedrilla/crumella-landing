-- =====================================================================
-- ROLLBACK for PHASE B (20261118000200_lockdown_close_access.sql)
-- Re-opens the database exactly as it was before the lockdown, while
-- keeping the phase A functions (so the NEW website keeps working too).
--
-- Use in an emergency if checkout breaks after phase B. Orders placed in
-- the meantime are kept.
--
-- Live:  supabase db query --linked -f supabase/rollback/20261118000200_lockdown_close_access_down.sql
-- Local: Get-Content <this file> -Raw | docker exec -i supabase_db_crumella-landing-lockdown psql -U postgres -v ON_ERROR_STOP=1
-- =====================================================================
begin;

-- 1. New table policies off
drop policy if exists "admin full access"          on public.orders;
drop policy if exists "admin full access"          on public.vouchers;
drop policy if exists "admin full access"          on public.loyalty_cards;
drop policy if exists "admin full access"          on public.feedbacks;
drop policy if exists "anyone can submit feedback" on public.feedbacks;
drop policy if exists "admin full access"          on public.pop_up_locations;

-- 2. Original table privileges (Supabase defaults)
grant all on public.orders, public.vouchers, public.loyalty_cards,
             public.feedbacks, public.pop_up_locations to anon, authenticated;

-- 3. Original policies
create policy "Public can read feedbacks" on public.feedbacks
  for select to anon using (true);
create policy "admin_all_feedbacks" on public.feedbacks
  for all to authenticated using (true) with check (true);
create policy "anon_insert_feedbacks" on public.feedbacks
  for insert to anon with check (true);

create policy "Enable card activation updates" on public.loyalty_cards
  for update to public using (is_activated = false) with check (true);
create policy "Enable public read access" on public.loyalty_cards
  for select to public using (true);
create policy "admin_all_loyalty_cards" on public.loyalty_cards
  for all to authenticated using (true) with check (true);
create policy "anon_read_loyalty_cards" on public.loyalty_cards
  for select to anon using (true);

create policy "Enable insert for everyone" on public.orders
  for insert to public with check (true);
create policy "Enable read for everyone" on public.orders
  for select to public using (true);
create policy "admin_all_orders" on public.orders
  for all to authenticated using (true) with check (true);
create policy "customers_insert_orders" on public.orders
  for insert to anon with check (true);

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

-- 4. Original points functions + grants
create or replace function public.add_points(card_id text, points_to_add integer)
returns void language plpgsql security definer set search_path to 'public'
as $function$
BEGIN
  UPDATE loyalty_cards
  SET points = points + points_to_add
  WHERE unique_id = card_id;
END;
$function$;

grant execute on function public.add_points(text, integer)    to public, anon, authenticated;
grant execute on function public.deduct_points(text, integer) to public, anon, authenticated;
grant execute on function public.expire_inactive_points()     to public, anon, authenticated;

-- 5. Storage back to public bucket + original policies
drop policy if exists "customers upload payment proofs" on storage.objects;
drop policy if exists "admin reads payment proofs"      on storage.objects;
drop policy if exists "admin manages payment proofs"    on storage.objects;

update storage.buckets
   set public = true, file_size_limit = null, allowed_mime_types = null
 where id = 'proofs';

create policy "Enable read access for everyone" on storage.objects
  for select to public using (bucket_id = 'proofs');
create policy "Enable upload for everyone" on storage.objects
  for insert to public with check (bucket_id = 'proofs');

-- 6. Forget the migration so it can be re-applied later
delete from supabase_migrations.schema_migrations where version = '20261118000200';

commit;
