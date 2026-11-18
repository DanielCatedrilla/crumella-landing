-- =====================================================================
-- ROLLBACK for 20261119000100_server_prices.sql
-- Restores the previous place_order (browser prices trusted) and removes
-- the menu_items table. Use only with redeploying the previous website.
--
-- Live:  supabase db query --linked -f supabase/rollback/20261119000100_server_prices_down.sql
-- =====================================================================
begin;

-- Previous place_order, copied verbatim from 20261118000100_lockdown_add_functions.sql
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

revoke execute on function public.place_order(jsonb, jsonb, text, text, text, text, text, text) from public;
grant  execute on function public.place_order(jsonb, jsonb, text, text, text, text, text, text) to anon, authenticated;

drop function if exists public.delivery_fee_for_km(double precision);
drop function if exists public.distance_from_store_km(double precision, double precision);

drop policy if exists "anyone can read active rewards" on public.rewards_catalog;
revoke select on public.rewards_catalog from anon;

drop table if exists public.menu_items;

delete from supabase_migrations.schema_migrations where version = '20261119000100';

commit;
