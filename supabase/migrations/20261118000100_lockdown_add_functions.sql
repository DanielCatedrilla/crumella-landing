-- =====================================================================
-- SLICE 0.1 LOCKDOWN — PHASE A: ADD the new server functions.
-- Additions only. Nothing is removed, so the CURRENT website keeps
-- working while the new website is deployed.
-- Next: 20261118000200_lockdown_close_access.sql (after the new site is live)
-- Rollback: supabase/rollback/20261118000100_lockdown_add_functions_down.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Admin check
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- ---------------------------------------------------------------------
-- 4. Rewards catalog: the server, not the browser, decides point costs
--    (must match REDEEMABLES in app/points/page.tsx)
-- ---------------------------------------------------------------------
create table public.rewards_catalog (
  item_name   text primary key,
  points_cost integer not null check (points_cost > 0),
  is_active   boolean not null default true
);
alter table public.rewards_catalog enable row level security;
create policy "admin full access" on public.rewards_catalog
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.rewards_catalog from anon;

insert into public.rewards_catalog (item_name, points_cost) values
  ('Free Chocolate Chunk Cookie',   75),
  ('Free Crumella Minis',          150),
  ('Free Classic Assorted Bundle', 250),
  ('Free Exclusive Merch',         400);

-- ---------------------------------------------------------------------
-- 6. Customer-facing server functions
--    Errors are raised as 'CODE|Friendly message' so the site can show
--    the friendly part.
-- ---------------------------------------------------------------------

-- 6a. Voucher check (no table read from the browser)
create or replace function public.check_voucher(p_code text, p_cart_total numeric)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v public.vouchers;
  v_discount numeric;
begin
  select * into v from public.vouchers
   where code = upper(trim(coalesce(p_code, ''))) and is_active = true;
  if not found then
    return jsonb_build_object('valid', false, 'message', 'Invalid or inactive code');
  end if;
  if v.expires_at is not null and v.expires_at < now() then
    return jsonb_build_object('valid', false, 'message',
      'Expired on ' || to_char(v.expires_at at time zone 'Asia/Manila', 'FMMM/FMDD/YYYY'));
  end if;
  if v.max_uses is not null and coalesce(v.used_count, 0) >= v.max_uses then
    return jsonb_build_object('valid', false, 'message', 'Voucher fully redeemed');
  end if;
  if coalesce(p_cart_total, 0) < coalesce(v.min_spend, 0) then
    return jsonb_build_object('valid', false, 'message',
      'Minimum spend of ₱' || trim(to_char(v.min_spend, 'FM999999990.##')) || ' required');
  end if;
  v_discount := case when v.type = 'fixed' then v.value
                     else round(coalesce(p_cart_total, 0) * v.value / 100, 2) end;
  v_discount := least(v_discount, coalesce(p_cart_total, 0));
  return jsonb_build_object('valid', true, 'discount', v_discount, 'code', v.code);
end;
$$;

-- 6b. Track one order by its tracking number (no address/phone/email returned)
create or replace function public.track_order(p_tracking_number text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
           'id', o.id,
           'tracking_number', o.tracking_number,
           'status', o.status,
           'createdAt', o."createdAt",
           'customer', jsonb_build_object(
              'name', o.customer ->> 'name',
              'orderType', o.customer ->> 'orderType'),
           'items', coalesce((
              select jsonb_agg(jsonb_build_object('name', i ->> 'name', 'quantity', i -> 'quantity'))
                from jsonb_array_elements(coalesce(o.items, '[]'::jsonb)) as i), '[]'::jsonb))
    from public.orders o
   where o.tracking_number = upper(trim(coalesce(p_tracking_number, '')))
   limit 1;
$$;

-- 6c. Quick card check used at checkout ("Card linked: <first name>")
create or replace function public.check_rewards_card(p_unique_id text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select jsonb_build_object(
              'found', true,
              'activated', c.is_activated,
              'expired', (c.expires_at is not null and c.expires_at < now()),
              'first_name', case when c.is_activated then c.first_name end)
       from public.loyalty_cards c
      where c.unique_id = trim(coalesce(p_unique_id, ''))),
    jsonb_build_object('found', false));
$$;

-- 6d. Rewards page login: unique ID + exact last name (case-insensitive,
--     no wildcards). Returns only that card.
create or replace function public.rewards_login(p_unique_id text, p_last_name text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
           'unique_id', c.unique_id,
           'first_name', c.first_name,
           'last_name', c.last_name,
           'points', coalesce(c.points, 0),
           'tier', c.tier,
           'is_activated', c.is_activated,
           'expires_at', c.expires_at,
           'email', c.email,
           'phone_number', c.phone_number,
           'created_at', c.created_at)
    from public.loyalty_cards c
   where c.unique_id = trim(coalesce(p_unique_id, ''))
     and c.is_activated = true
     and length(trim(coalesce(p_last_name, ''))) > 0
     and lower(trim(c.last_name)) = lower(trim(p_last_name))
   limit 1;
$$;

-- 6e. Activate a physical card (only if not yet activated)
create or replace function public.activate_rewards_card(
  p_unique_id text, p_first_name text, p_last_name text, p_phone text, p_email text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.loyalty_cards;
begin
  if length(trim(coalesce(p_first_name, ''))) = 0
     or length(trim(coalesce(p_last_name, ''))) = 0
     or length(trim(coalesce(p_phone, ''))) = 0
     or length(trim(coalesce(p_email, ''))) = 0 then
    raise exception 'MISSING_FIELDS|Please fill in all fields.';
  end if;

  select * into c from public.loyalty_cards
   where unique_id = trim(coalesce(p_unique_id, ''))
   for update;
  if not found then
    raise exception 'CARD_NOT_FOUND|Invalid Unique ID. Please check the ID on your physical card.';
  end if;
  if c.is_activated then
    raise exception 'ALREADY_ACTIVE|This card has already been activated. Please try checking your points instead.';
  end if;

  begin
    update public.loyalty_cards
       set first_name   = trim(p_first_name),
           last_name    = trim(p_last_name),
           phone_number = trim(p_phone),
           email        = lower(trim(p_email)),
           is_activated = true,
           expires_at   = '2028-03-31T23:59:59Z'
     where id = c.id
     returning * into c;
  exception when unique_violation then
    raise exception 'DUPLICATE_CONTACT|An account with this email or phone number may already exist. Please try checking your points instead.';
  end;

  return public.rewards_login(c.unique_id, c.last_name);
end;
$$;

-- 6f. Menu star ratings: only the ratings, no names/emails
create or replace function public.public_feedback_ratings()
returns setof jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select f.ratings from public.feedbacks f where f.ratings is not null;
$$;

-- 6g. Place an order — one atomic step:
--     validate items, enforce rewards, apply voucher, deduct/add points,
--     save the order. Safe to retry: the same tracking number + phone
--     returns the existing order instead of creating a duplicate.
create or replace function public.place_order(
  p_customer        jsonb,
  p_items           jsonb,
  p_tracking_number text,
  p_payment_method  text,
  p_proof_path      text default null,
  p_voucher_code    text default null,
  p_rewards_id      text default null,
  p_redemption_card text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing      public.orders;
  v_item          jsonb;
  v_qty           integer;
  v_price         numeric;
  v_cost          integer;
  v_redeemed_qty  integer := 0;
  v_points_needed integer := 0;
  v_subtotal      numeric := 0;
  v_delivery      numeric;
  v_total         numeric;
  v_discount      numeric := 0;
  v_final         numeric;
  v_voucher       public.vouchers;
  v_voucher_code  text := null;
  v_card          public.loyalty_cards;
  v_points_earned integer := 0;
  v_tracking      text := upper(trim(coalesce(p_tracking_number, '')));
  v_method        text := lower(trim(coalesce(p_payment_method, '')));
  v_proof         text := nullif(trim(coalesce(p_proof_path, '')), '');
begin
  -- Basic shape checks
  if v_tracking !~ '^CRML-[A-Z0-9]{5}$' then
    raise exception 'BAD_TRACKING|Something went wrong with your order code. Please go back to checkout and try again.';
  end if;
  if p_customer is null or jsonb_typeof(p_customer) <> 'object'
     or length(trim(coalesce(p_customer ->> 'name', ''))) = 0
     or length(trim(coalesce(p_customer ->> 'phone', ''))) = 0
     or coalesce(p_customer ->> 'orderType', '') not in ('delivery', 'pickup') then
    raise exception 'BAD_CUSTOMER|Please go back to checkout and complete your details.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 60 then
    raise exception 'BAD_ITEMS|Your cart looks empty. Please add items and try again.';
  end if;
  if v_method = '' then
    raise exception 'BAD_PAYMENT|Please choose a payment method.';
  end if;

  -- Retry / double-tap protection
  select * into v_existing from public.orders where tracking_number = v_tracking;
  if found then
    if coalesce(v_existing.customer ->> 'phone', '') = trim(p_customer ->> 'phone') then
      return jsonb_build_object(
        'tracking_number', v_existing.tracking_number,
        'final_total', v_existing."finalTotal",
        'points_earned', 0,
        'duplicate', true);
    end if;
    raise exception 'TRACKING_TAKEN|Please go back to checkout and try again.';
  end if;

  -- Proof of payment: required for GCash / bank, must be a real uploaded file
  if v_method in ('gcash', 'bank') then
    if v_proof is null or v_proof !~ '^orders/[^/]+$' or not exists (
         select 1 from storage.objects o where o.bucket_id = 'proofs' and o.name = v_proof) then
      raise exception 'NO_PROOF|Please upload your proof of payment to continue.';
    end if;
  elsif v_proof is not null and v_proof !~ '^orders/[^/]+$' then
    v_proof := null;
  end if;

  -- Items: prices still come from the menu in the browser (known limitation,
  -- see backlog); the server checks shape, rewards, and does the maths.
  for v_item in select * from jsonb_array_elements(p_items) loop
    begin
      v_qty   := (v_item ->> 'quantity')::integer;
      v_price := coalesce((v_item ->> 'price')::numeric, 0);
    exception when others then
      raise exception 'BAD_ITEMS|Something is wrong with your cart. Please try again.';
    end;
    if v_qty is null or v_qty < 1 or v_qty > 500 or v_price < 0 then
      raise exception 'BAD_ITEMS|Something is wrong with your cart. Please try again.';
    end if;

    select points_cost into v_cost
      from public.rewards_catalog
     where item_name = v_item ->> 'name' and is_active = true;

    if coalesce((v_item ->> 'isRedeemed')::boolean, false) then
      if v_cost is null or v_price <> 0 then
        raise exception 'BAD_REWARD|That reward is not available. Please remove it and try again.';
      end if;
      v_redeemed_qty  := v_redeemed_qty + v_qty;
      v_points_needed := v_points_needed + v_cost * v_qty;
    else
      if v_cost is not null then
        -- A reward item in the cart without redeeming points for it
        raise exception 'BAD_REWARD|Rewards must be redeemed from the Points page.';
      end if;
      v_subtotal := v_subtotal + v_price * v_qty;
    end if;
  end loop;

  if v_redeemed_qty > 1 then
    raise exception 'ONE_REWARD|Only one reward can be redeemed per order.';
  end if;
  if v_redeemed_qty > 0 and v_subtotal <= 0 then
    raise exception 'REWARD_NEEDS_PURCHASE|Rewards need at least one other purchased item in your cart.';
  end if;

  begin
    v_delivery := coalesce((p_customer ->> 'deliveryFee')::numeric, 0);
  exception when others then
    v_delivery := -1;
  end;
  if v_delivery < 0 or v_delivery > 2000
     or (p_customer ->> 'orderType' = 'pickup' and v_delivery <> 0) then
    raise exception 'BAD_DELIVERY|Something is wrong with the delivery fee. Please go back to checkout.';
  end if;

  v_total := v_subtotal + v_delivery;

  -- Voucher: re-checked and counted here, locked so two orders can't
  -- both take the last use
  if length(trim(coalesce(p_voucher_code, ''))) > 0 then
    select * into v_voucher from public.vouchers
     where code = upper(trim(p_voucher_code)) and is_active = true
     for update;
    if not found
       or (v_voucher.expires_at is not null and v_voucher.expires_at < now())
       or (v_voucher.max_uses is not null and coalesce(v_voucher.used_count, 0) >= v_voucher.max_uses)
       or v_total < coalesce(v_voucher.min_spend, 0) then
      raise exception 'VOUCHER_INVALID|Your voucher is no longer valid. Please remove it and try again.';
    end if;
    v_discount := case when v_voucher.type = 'fixed' then v_voucher.value
                       else round(v_total * v_voucher.value / 100, 2) end;
    v_discount := least(v_discount, v_total);
    if v_discount > 0 then
      update public.vouchers set used_count = coalesce(used_count, 0) + 1 where id = v_voucher.id;
      v_voucher_code := v_voucher.code;
    end if;
  end if;

  v_final := v_total - v_discount;

  -- Redeem points (locked, must have enough)
  if v_points_needed > 0 then
    select * into v_card from public.loyalty_cards
     where unique_id = trim(coalesce(p_redemption_card, ''))
     for update;
    if not found or not v_card.is_activated
       or (v_card.expires_at is not null and v_card.expires_at < now()) then
      raise exception 'BAD_CARD|Your rewards card could not be verified. Please log in on the Points page again.';
    end if;
    if coalesce(v_card.points, 0) < v_points_needed then
      raise exception 'NOT_ENOUGH_POINTS|You don''t have enough points for this reward.';
    end if;
    update public.loyalty_cards
       set points = coalesce(points, 0) - v_points_needed
     where id = v_card.id;
  end if;

  -- Earn points (1 point per ₱20 paid). Invalid card = no points, no error.
  if length(trim(coalesce(p_rewards_id, ''))) > 0 and v_final > 0 then
    update public.loyalty_cards
       set points = coalesce(points, 0) + floor(v_final / 20)::integer
     where unique_id = trim(p_rewards_id)
       and is_activated = true
       and (expires_at is null or expires_at >= now())
    returning floor(v_final / 20)::integer into v_points_earned;
    v_points_earned := coalesce(v_points_earned, 0);
  end if;

  insert into public.orders (
    customer, items, total, discount, "finalTotal", "paymentMethod",
    "proofUrl", "voucherCode", status, "createdAt", tracking_number)
  values (
    p_customer, p_items, v_total, v_discount, v_final, v_method,
    coalesce(v_proof, ''), v_voucher_code, 'New', now(), v_tracking);

  return jsonb_build_object(
    'tracking_number', v_tracking,
    'total', v_total,
    'discount', v_discount,
    'final_total', v_final,
    'points_earned', v_points_earned,
    'duplicate', false);
end;
$$;

-- Only these functions are callable by the public website
revoke execute on function public.check_voucher(text, numeric)                        from public;
revoke execute on function public.track_order(text)                                   from public;
revoke execute on function public.check_rewards_card(text)                            from public;
revoke execute on function public.rewards_login(text, text)                           from public;
revoke execute on function public.activate_rewards_card(text, text, text, text, text) from public;
revoke execute on function public.public_feedback_ratings()                           from public;
revoke execute on function public.place_order(jsonb, jsonb, text, text, text, text, text, text) from public;

grant execute on function public.check_voucher(text, numeric)                        to anon, authenticated;
grant execute on function public.track_order(text)                                   to anon, authenticated;
grant execute on function public.check_rewards_card(text)                            to anon, authenticated;
grant execute on function public.rewards_login(text, text)                           to anon, authenticated;
grant execute on function public.activate_rewards_card(text, text, text, text, text) to anon, authenticated;
grant execute on function public.public_feedback_ratings()                           to anon, authenticated;
grant execute on function public.place_order(jsonb, jsonb, text, text, text, text, text, text) to anon, authenticated;

