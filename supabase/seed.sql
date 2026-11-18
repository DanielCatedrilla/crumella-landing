-- LOCAL TEST DATA ONLY (fake people, fake codes). Never runs on live:
-- `supabase db reset` uses it for the local Docker database only.

insert into public.vouchers (code, type, value, min_spend, max_uses, used_count, expires_at, is_active) values
  ('TEST10',   'percentage', 10,   0, 100, 0, null,                         true),
  ('FIXED50',  'fixed',      50, 200, null, 0, null,                        true),
  ('EXPIRED',  'percentage', 20,   0, null, 0, now() - interval '1 day',    true),
  ('MAXED',    'fixed',      30,   0, 1,    1, null,                        true),
  ('INACTIVE', 'fixed',      30,   0, null, 0, null,                        false);

insert into public.loyalty_cards (unique_id, first_name, last_name, phone_number, email, points, tier, is_activated, expires_at) values
  ('900001', 'Test',  'Customer', '09000000001', 'test1@example.com', 500, 'Gold',   true,  '2028-03-31T23:59:59Z'),
  ('900002', null,    null,       null,          null,                0,   'Member', false, null),
  ('900003', 'Old',   'Card',     '09000000003', 'test3@example.com', 300, 'Member', true,  now() - interval '1 day'),
  ('900004', 'Low',   'Points',   '09000000004', 'test4@example.com', 10,  'Member', true,  '2028-03-31T23:59:59Z');

insert into public.orders (customer, items, total, discount, "finalTotal", "paymentMethod", "proofUrl", "voucherCode", status, "createdAt", tracking_number) values
  ('{"name":"Seed Buyer","phone":"09000000009","email":"seed@example.com","address":"123 Fake St","orderType":"delivery","deliveryFee":50}',
   '[{"id":1,"name":"Chocolate Chunk Cookie","price":100,"quantity":2,"isRedeemed":false}]',
   250, 0, 250, 'gcash', 'http://127.0.0.1:54321/storage/v1/object/public/proofs/legacy_proof.png', null, 'Preparing', now() - interval '1 day', 'CRML-SEED1');

insert into public.feedbacks (full_name, facebook_name, email, favorite_cookie, final_thoughts, ratings) values
  ('Fake Reviewer', 'fake.fb', 'reviewer@example.com', 'Chocolate Chunk Cookie', 'Yum',
   '{"Chocolate Chunk Cookie":{"taste":5,"texture":4,"smell":5,"aftertaste":4}}');

insert into public.pop_up_locations (venue_name, latitude, longitude, address, date_start)
values ('Test Venue', 10.7, 122.56, 'Somewhere, Iloilo', current_date);
