-- =====================================================================
-- BACKLOG 1 — SERVER-SIDE PRICES
--
-- Before: place_order trusted the item prices and delivery fee sent by
-- the customer's browser.
-- After:  prices come from public.menu_items, the delivery fee is
--         recalculated from the pinned location, and a browser showing a
--         different price gets "prices were updated, please refresh"
--         instead of being charged a different amount.
--
-- Safe to apply BEFORE the website deploy: the current website sends the
-- same item ids/prices, so its orders keep working.
--
-- Rollback: supabase/rollback/20261119000100_server_prices_down.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Menu prices (the Hub's Pricing Book will own this later)
--    Must match ORDER_ITEMS in components/Menu.tsx
--    (checked by supabase/tests/prices.test.mjs).
-- ---------------------------------------------------------------------
create table public.menu_items (
  id          integer primary key,
  name        text    not null,
  category    text    not null,
  price       numeric(10,2) not null check (price >= 0),
  is_reward   boolean not null default false,
  is_active   boolean not null default true,
  updated_at  timestamptz not null default now(),
  check (not is_reward or price = 0)
);

insert into public.menu_items (id, name, category, price, is_reward) values
  ( 11, 'Hazelnut Lava Cookie',                   'Box of 4 - Single Flavor Bundles', 380.00, false),
  (  2, 'Biscoff® Cookie',                        'Box of 4 - Single Flavor Bundles', 350.00, false),
  (  3, 'Matcha Cookie',                          'Box of 4 - Single Flavor Bundles', 350.00, false),
  (  4, 'Chocolate Chunk Cookie',                 'Box of 4 - Single Flavor Bundles', 300.00, false),
  (  5, 'Double Chocolate Cookie',                'Box of 4 - Single Flavor Bundles', 320.00, false),
  (  6, 'S''mores Cookie',                        'Box of 4 - Single Flavor Bundles', 320.00, false),
  (  7, 'Red Velvet Cookie',                      'Box of 4 - Single Flavor Bundles', 380.00, false),
  ( 10, 'Chocolate Chunk Minis w/ Nutella® Dip',  'Box of 12 - Crumella Minis',       199.00, false),
  (  9, 'Premium Assorted Bundle',                'Box of 4 - Assorted Bundles',      380.00, false),
  (  8, 'Classic Assorted Bundle',                'Box of 4 - Assorted Bundles',      350.00, false),
  ( 99, 'Free Exclusive Merch',                   'Rewards',                            0.00, true),
  (100, 'Free Chocolate Chunk Cookie',            'Rewards',                            0.00, true),
  (101, 'Free Crumella Minis',                    'Rewards',                            0.00, true),
  (102, 'Free Classic Assorted Bundle',           'Rewards',                            0.00, true);

alter table public.menu_items enable row level security;
create policy "anyone can read active menu" on public.menu_items
  for select to anon, authenticated using (is_active);
create policy "admin full access" on public.menu_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.menu_items from anon;
grant select on public.menu_items to anon;

-- Reward point costs: readable by the Points page (single source of truth)
create policy "anyone can read active rewards" on public.rewards_catalog
  for select to anon, authenticated using (is_active);
grant select on public.rewards_catalog to anon;

-- ---------------------------------------------------------------------
-- 2. Delivery fee, same formula as app/checkout/page.tsx:
--    ₱50 up to 5 km from GT Town Center Pavia, +₱6 per started km after.
-- ---------------------------------------------------------------------
create or replace function public.delivery_fee_for_km(p_km double precision)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select case when p_km <= 5 then 50::numeric
              else 50 + ceil(p_km - 5)::numeric * 6 end;
$$;

create or replace function public.distance_from_store_km(p_lat double precision, p_lng double precision)
returns double precision
language sql
immutable
set search_path = ''
as $$
  select 6371 * 2 * atan2(sqrt(a), sqrt(1 - a))
    from (select sin(radians(p_lat - 10.7819) / 2) ^ 2
               + cos(radians(10.7819)) * cos(radians(p_lat))
               * sin(radians(p_lng - 122.5438) / 2) ^ 2 as a) s;
$$;

revoke execute on function public.delivery_fee_for_km(double precision)                      from public, anon, authenticated;
revoke execute on function public.distance_from_store_km(double precision, double precision) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. place_order v2: same inputs/outputs as before, prices from the DB
-- ---------------------------------------------------------------------
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
  v_items_out     jsonb := '[]'::jsonb;
  v_menu          public.menu_items;
  v_id            integer;
  v_qty           integer;
  v_client_price  numeric;
  v_cost          integer;
  v_redeemed      boolean;
  v_redeemed_qty  integer := 0;
  v_points_needed integer := 0;
  v_subtotal      numeric := 0;
  v_customer      jsonb;
  v_lat           double precision;
  v_lng           double precision;
  v_km            double precision;
  v_delivery      numeric := 0;
  v_client_fee    numeric;
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

  -- Proof of payment
  if v_method in ('gcash', 'bank') then
    if v_proof is null or v_proof !~ '^orders/[^/]+$' or not exists (
         select 1 from storage.objects o where o.bucket_id = 'proofs' and o.name = v_proof) then
      raise exception 'NO_PROOF|Please upload your proof of payment to continue.';
    end if;
  elsif v_proof is not null and v_proof !~ '^orders/[^/]+$' then
    v_proof := null;
  end if;

  -- Items: price and name come from menu_items; the browser's price is
  -- only compared, never used.
  for v_item in select * from jsonb_array_elements(p_items) loop
    begin
      v_id           := (v_item ->> 'id')::integer;
      v_qty          := (v_item ->> 'quantity')::integer;
      v_client_price := (v_item ->> 'price')::numeric;
      v_redeemed     := coalesce((v_item ->> 'isRedeemed')::boolean, false);
    exception when others then
      raise exception 'BAD_ITEMS|Something is wrong with your cart. Please try again.';
    end;
    if v_id is null or v_qty is null or v_qty < 1 or v_qty > 500 then
      raise exception 'BAD_ITEMS|Something is wrong with your cart. Please try again.';
    end if;

    select * into v_menu from public.menu_items where id = v_id and is_active;
    if not found then
      raise exception 'ITEM_UNAVAILABLE|An item in your cart is no longer available. Please review your cart at checkout.';
    end if;

    if v_menu.is_reward then
      select points_cost into v_cost
        from public.rewards_catalog
       where item_name = v_menu.name and is_active;
      if not v_redeemed or v_cost is null then
        raise exception 'BAD_REWARD|Rewards must be redeemed from the Points page.';
      end if;
      v_redeemed_qty  := v_redeemed_qty + v_qty;
      v_points_needed := v_points_needed + v_cost * v_qty;
    elsif v_redeemed then
      raise exception 'BAD_REWARD|That reward is not available. Please remove it and try again.';
    else
      if v_client_price is distinct from v_menu.price then
        raise exception 'PRICE_CHANGED|Prices were updated. Please review your cart at checkout before ordering.';
      end if;
      v_subtotal := v_subtotal + v_menu.price * v_qty;
    end if;

    -- Store the server's name/price; keep extra details (e.g. bundleConfigs)
    v_items_out := v_items_out || jsonb_build_array(
      v_item || jsonb_build_object('id', v_menu.id, 'name', v_menu.name,
                                   'price', v_menu.price, 'quantity', v_qty,
                                   'isRedeemed', v_menu.is_reward));
  end loop;

  if v_redeemed_qty > 1 then
    raise exception 'ONE_REWARD|Only one reward can be redeemed per order.';
  end if;
  if v_redeemed_qty > 0 and v_subtotal <= 0 then
    raise exception 'REWARD_NEEDS_PURCHASE|Rewards need at least one other purchased item in your cart.';
  end if;

  -- Delivery fee: recalculated from the pinned location
  begin
    v_client_fee := coalesce((p_customer ->> 'deliveryFee')::numeric, 0);
  exception when others then
    v_client_fee := -1;
  end;
  if p_customer ->> 'orderType' = 'delivery' then
    begin
      v_lat := (p_customer ->> 'latitude')::double precision;
      v_lng := (p_customer ->> 'longitude')::double precision;
    exception when others then
      v_lat := null;
    end;
    if v_lat is null or v_lng is null or v_lat not between -90 and 90 or v_lng not between -180 and 180 then
      raise exception 'NO_PIN|Please go back to checkout and pin your delivery location on the map.';
    end if;
    v_km := public.distance_from_store_km(v_lat, v_lng);
    v_delivery := public.delivery_fee_for_km(v_km);
    -- Tolerate tiny rounding differences at a km boundary (browser vs server maths)
    if v_client_fee <> v_delivery
       and v_client_fee <> public.delivery_fee_for_km(greatest(v_km - 0.01, 0))
       and v_client_fee <> public.delivery_fee_for_km(v_km + 0.01) then
      raise exception 'DELIVERY_CHANGED|Your delivery fee needs to be recalculated. Please go back to checkout and re-pin your location.';
    end if;
    v_delivery := v_client_fee;   -- equal to the server fee (or its boundary neighbour)
  else
    if v_client_fee <> 0 then
      raise exception 'BAD_DELIVERY|Something is wrong with the delivery fee. Please go back to checkout.';
    end if;
    v_delivery := 0;
  end if;
  v_customer := p_customer || jsonb_build_object('deliveryFee', v_delivery);

  v_total := v_subtotal + v_delivery;

  -- Voucher (locked)
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

  -- Redeem points (locked)
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

  -- Earn points (1 per ₱20 paid)
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
    v_customer, v_items_out, v_total, v_discount, v_final, v_method,
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

revoke execute on function public.place_order(jsonb, jsonb, text, text, text, text, text, text) from public;
grant  execute on function public.place_order(jsonb, jsonb, text, text, text, text, text, text) to anon, authenticated;
