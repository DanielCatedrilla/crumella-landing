-- =====================================================================
-- SLICE 0.1 LOCKDOWN — PHASE B: CLOSE the old open access.
-- Run ONLY after the new website (using the phase A functions) is live.
--
-- Before: anyone holding the public (anon) key could read every order,
-- loyalty card and feedback, edit vouchers, add/remove points and open
-- every payment proof. Any logged-in account was treated as admin.
-- After: customers only reach the database through the phase A functions;
-- full table access requires app_metadata.role = admin; payment proofs
-- are private (upload-only for customers, signed links for admin).
--
-- Rollback: supabase/rollback/20261118000200_lockdown_close_access_down.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- 2. Remove every old policy
-- ---------------------------------------------------------------------
drop policy if exists "Public can read feedbacks"        on public.feedbacks;
drop policy if exists "admin_all_feedbacks"              on public.feedbacks;
drop policy if exists "anon_insert_feedbacks"            on public.feedbacks;

drop policy if exists "Enable card activation updates"   on public.loyalty_cards;
drop policy if exists "Enable public read access"        on public.loyalty_cards;
drop policy if exists "admin_all_loyalty_cards"          on public.loyalty_cards;
drop policy if exists "anon_read_loyalty_cards"          on public.loyalty_cards;

drop policy if exists "Enable insert for everyone"       on public.orders;
drop policy if exists "Enable read for everyone"         on public.orders;
drop policy if exists "admin_all_orders"                 on public.orders;
drop policy if exists "customers_insert_orders"          on public.orders;

drop policy if exists "Enable read access for all users" on public.vouchers;
drop policy if exists "Enable update for usage count"    on public.vouchers;
drop policy if exists "admin_all_vouchers"               on public.vouchers;
drop policy if exists "anon_read_vouchers"               on public.vouchers;
drop policy if exists "anon_update_vouchers"             on public.vouchers;

-- pop_up_locations keeps its existing public read policy (public info).

-- ---------------------------------------------------------------------
-- 3. New policies: admin-only tables, feedback stays submittable
-- ---------------------------------------------------------------------
create policy "admin full access" on public.orders
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin full access" on public.vouchers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin full access" on public.loyalty_cards
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin full access" on public.feedbacks
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "anyone can submit feedback" on public.feedbacks
  for insert to anon, authenticated with check (true);
create policy "admin full access" on public.pop_up_locations
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Belt and braces: remove direct table privileges the public key never needs.
revoke all on public.orders, public.vouchers, public.loyalty_cards from anon;
revoke all on public.feedbacks from anon;
grant insert on public.feedbacks to anon;
revoke insert, update, delete, truncate, references, trigger on public.pop_up_locations from anon;
revoke truncate, references, trigger on
  public.orders, public.vouchers, public.loyalty_cards, public.feedbacks, public.pop_up_locations
  from authenticated;

-- ---------------------------------------------------------------------
-- 5. Points functions: admin-only now
-- ---------------------------------------------------------------------
create or replace function public.add_points(card_id text, points_to_add integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'NOT_ALLOWED|Admin only.' using errcode = '42501';
  end if;
  update public.loyalty_cards
     set points = coalesce(points, 0) + points_to_add
   where unique_id = card_id
     and is_activated = true
     and coalesce(points, 0) + points_to_add >= 0;
  if not found then
    raise exception 'POINTS_FAILED|Card not found, not activated, or not enough points.';
  end if;
end;
$$;

revoke execute on function public.add_points(text, integer)    from public, anon;
grant  execute on function public.add_points(text, integer)    to authenticated;
revoke execute on function public.deduct_points(text, integer) from public, anon, authenticated;
revoke execute on function public.expire_inactive_points()     from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 7. Payment proofs: private bucket, upload-only for customers
-- ---------------------------------------------------------------------
update storage.buckets
   set public = false,
       file_size_limit = 10485760,               -- 10 MB
       allowed_mime_types = array['image/*']
 where id = 'proofs';

drop policy if exists "Enable read access for everyone" on storage.objects;
drop policy if exists "Enable upload for everyone"      on storage.objects;

create policy "customers upload payment proofs" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'proofs' and (storage.foldername(name))[1] = 'orders');

create policy "admin reads payment proofs" on storage.objects
  for select to authenticated
  using (bucket_id = 'proofs' and public.is_admin());

create policy "admin manages payment proofs" on storage.objects
  for delete to authenticated
  using (bucket_id = 'proofs' and public.is_admin());
