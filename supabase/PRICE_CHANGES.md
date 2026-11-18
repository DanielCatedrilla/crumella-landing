# Changing a price or reward cost (until Hub sync exists)

The server charges the price in the **database**. The website **shows** the price in the code.
They must match, or customers get "Prices were updated. Please review your cart at checkout"
and can't order that item.

## Change a menu price
Do both, then deploy:

1. **Database** (Supabase dashboard → SQL Editor):
   ```sql
   update public.menu_items set price = 400, updated_at = now() where id = 11;  -- Hazelnut Lava
   ```
2. **Code:** `components/Menu.tsx` → `ORDER_ITEMS` → same item → `price: 400.00`
3. Commit and push. Vercel deploys in ~1 minute.

Order doesn't matter much. Do both within a few minutes, ideally in quiet hours.
`sh supabase/tests/run.sh` fails if the two don't match.

| id | Item |
|---|---|
| 11 | Hazelnut Lava Cookie |
| 2 | Biscoff® Cookie |
| 3 | Matcha Cookie |
| 4 | Chocolate Chunk Cookie |
| 5 | Double Chocolate Cookie |
| 6 | S'mores Cookie |
| 7 | Red Velvet Cookie |
| 10 | Chocolate Chunk Minis w/ Nutella® Dip |
| 9 | Premium Assorted Bundle |
| 8 | Classic Assorted Bundle |
| 99–102 | Rewards (always ₱0) |

## Add a new menu item
Add it to `ORDER_ITEMS` **and** insert a row:
```sql
insert into public.menu_items (id, name, category, price) values (12, 'New Cookie', 'Box of 4 - Single Flavor Bundles', 350);
```
Same `id` and same `name` in both places.

## Stop selling an item for now
```sql
update public.menu_items set is_active = false where id = 3;
```
Checkout refuses it with "no longer available". It still shows on the website until it is removed from
`ORDER_ITEMS` (the proper sold-out toggle is Feature 4).

## Change a reward's point cost
**Database only:**
```sql
update public.rewards_catalog set points_cost = 90 where item_name = 'Free Chocolate Chunk Cookie';
```
The Points page reads costs from the database. Optionally also update the fallback number in
`app/points/page.tsx` (`REDEEMABLES`) so the automated check stays green.
