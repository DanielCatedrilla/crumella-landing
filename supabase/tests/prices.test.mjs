// Backlog 1 — server-side prices. Runs against the LOCAL Docker database.
// Also checks that the website's menu/reward costs match the database.
//
//   sh supabase/tests/run.sh   (runs this after lockdown.test.mjs)

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  execSync("supabase status -o env", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
    .split(/\r?\n/).map((l) => l.match(/^([A-Z_]+)="?(.*?)"?$/)).filter(Boolean).map((m) => [m[1], m[2]])
);
const URL_ = env.API_URL, ANON = env.ANON_KEY;
if (!/127\.0\.0\.1|localhost/.test(URL_ || "")) throw new Error("Refusing to run: not a local database.");

let pass = 0, fail = 0;
const results = [];
const check = (name, ok, detail = "") => { ok ? pass++ : fail++; results.push(`${ok ? "PASS" : "FAIL"}  ${name}${ok || !detail ? "" : "  -> " + detail}`); };

async function rpc(fn, body) {
  const r = await fetch(`${URL_}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const t = await r.text();
  let j = null; try { j = t ? JSON.parse(t) : null; } catch { j = t; }
  return { status: r.status, json: j };
}
async function get(path) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } });
  return { status: r.status, json: await r.json().catch(() => null) };
}
const errMsg = (r) => (r.json && (r.json.message || r.json.error)) || "";
const sql = (q) => {
  const raw = execSync(`supabase db query --local -o json "${q.replace(/"/g, '\\"')}"`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  let out; try { out = JSON.parse(raw); } catch { return []; }   // e.g. "UPDATE 1"
  return Array.isArray(out) ? out : out.rows ?? [];
};

let n = 0;
const tracking = () => `CRML-P${String(++n).padStart(4, "0")}`;
const base = (extra = {}) => ({
  p_customer: { name: "Price Tester", phone: "09171112222", orderType: "delivery", deliveryFee: 50,
                latitude: 10.7819, longitude: 122.5438 },
  p_items: [{ id: 11, name: "Hazelnut Lava Cookie", price: 380, quantity: 1, isRedeemed: false }],
  p_tracking_number: tracking(),
  p_payment_method: "cash",
  ...extra,
});

// ------------------------------------------------ 1. website vs database
{
  const menuSrc = readFileSync("components/Menu.tsx", "utf8");
  const block = menuSrc.slice(menuSrc.indexOf("export const ORDER_ITEMS"));
  const code = new Map();
  for (const m of block.slice(0, block.indexOf("\n];")).matchAll(/id:\s*(\d+),\s*name:\s*"([^"]+)"[\s\S]*?price:\s*([\d.]+)/g)) {
    code.set(Number(m[1]), { name: m[2], price: Number(m[3]) });
  }
  const db = new Map(sql("select id, name, price::text as price from menu_items").map((r) => [Number(r.id), { name: r.name, price: Number(r.price) }]));
  const diffs = [];
  for (const [id, c] of code) {
    const d = db.get(id);
    if (!d) diffs.push(`id ${id} (${c.name}) missing in DB`);
    else if (d.price !== c.price || d.name !== c.name) diffs.push(`id ${id}: code ${c.name} ₱${c.price} vs DB ${d.name} ₱${d.price}`);
  }
  for (const id of db.keys()) if (!code.has(id)) diffs.push(`id ${id} in DB but not in Menu.tsx`);
  check(`Menu.tsx prices match database (${code.size} items)`, code.size > 0 && diffs.length === 0, diffs.join("; "));

  const pts = readFileSync("app/points/page.tsx", "utf8");
  const codeRewards = [...pts.matchAll(/name:\s*"([^"]+)",\s*points:\s*(\d+)/g)].map((m) => [m[1], Number(m[2])]);
  const dbRewards = new Map(sql("select item_name, points_cost from rewards_catalog").map((r) => [r.item_name, Number(r.points_cost)]));
  const rdiffs = codeRewards.filter(([nm, p]) => dbRewards.get(nm) !== p).map(([nm, p]) => `${nm}: code ${p} vs DB ${dbRewards.get(nm)}`);
  check(`Points page fallback costs match database (${codeRewards.length} rewards)`, codeRewards.length > 0 && rdiffs.length === 0, rdiffs.join("; "));
}

// ------------------------------------------------ 2. public reads
{
  const m = await get("menu_items?select=id,price");
  check("Public can read menu prices", m.status === 200 && m.json.length === 14, `${m.status} ${m.json?.length}`);
  const r = await get("rewards_catalog?select=item_name,points_cost");
  check("Public can read reward costs", r.status === 200 && r.json.length === 4, `${r.status}`);
}

// ------------------------------------------------ 3. checkout enforcement
{
  const ok = await rpc("place_order", base());
  check("Normal order works (₱380 + ₱50 delivery = ₱430)", ok.status === 200 && Number(ok.json?.final_total) === 430, `${ok.status} ${errMsg(ok)} ${JSON.stringify(ok.json)}`);

  const cheap = base(); cheap.p_items[0].price = 1;
  const r1 = await rpc("place_order", cheap);
  check("Tampered item price rejected", /PRICE_CHANGED/.test(errMsg(r1)), errMsg(r1));

  const noPrice = base(); delete noPrice.p_items[0].price;
  const r1b = await rpc("place_order", noPrice);
  check("Missing item price rejected", /PRICE_CHANGED/.test(errMsg(r1b)), errMsg(r1b));

  const unknown = base(); unknown.p_items[0].id = 777;
  const r2 = await rpc("place_order", unknown);
  check("Unknown item rejected", /ITEM_UNAVAILABLE/.test(errMsg(r2)), errMsg(r2));

  const renamed = base(); renamed.p_items[0].name = "Anything";
  const r3 = await rpc("place_order", renamed);
  check("Order saves the database item name, not the browser's", r3.status === 200 &&
    sql(`select items->0->>'name' as n from orders where tracking_number='${renamed.p_tracking_number}'`)[0]?.n === "Hazelnut Lava Cookie", errMsg(r3));

  const freeDel = base(); freeDel.p_customer.deliveryFee = 0;
  const r4 = await rpc("place_order", freeDel);
  check("Tampered delivery fee (₱0) rejected", /DELIVERY_CHANGED/.test(errMsg(r4)), errMsg(r4));

  // ~10 km away: 50 + ceil(10.x-5)*6
  const far = base(); far.p_customer.latitude = 10.7819 + 0.09; // ≈10.0 km north
  const km = Number(sql(`select public.distance_from_store_km(${far.p_customer.latitude}, 122.5438)::text as km`)[0].km);
  const fee = km <= 5 ? 50 : 50 + Math.ceil(km - 5) * 6;
  far.p_customer.deliveryFee = fee;
  const r5 = await rpc("place_order", far);
  check(`Correct far delivery fee accepted (${km.toFixed(2)} km -> ₱${fee})`, r5.status === 200 && Number(r5.json?.final_total) === 380 + fee, `${errMsg(r5)} ${JSON.stringify(r5.json)}`);
  const farLow = base(); farLow.p_customer.latitude = far.p_customer.latitude; farLow.p_customer.deliveryFee = 50;
  const r6 = await rpc("place_order", farLow);
  check("Far location with ₱50 fee rejected", /DELIVERY_CHANGED/.test(errMsg(r6)), errMsg(r6));

  const noPin = base(); delete noPin.p_customer.latitude; delete noPin.p_customer.longitude;
  const r7 = await rpc("place_order", noPin);
  check("Delivery without a pinned location rejected", /NO_PIN/.test(errMsg(r7)), errMsg(r7));

  const pickup = base(); pickup.p_customer = { name: "Pick Up", phone: "0917", orderType: "pickup", deliveryFee: 0 };
  const r8 = await rpc("place_order", pickup);
  check("Pickup order: no delivery fee", r8.status === 200 && Number(r8.json?.final_total) === 380, errMsg(r8));
  const pickupFee = base(); pickupFee.p_customer = { name: "Pick Up", phone: "0917", orderType: "pickup", deliveryFee: 30 };
  check("Pickup with a delivery fee rejected", /BAD_DELIVERY/.test(errMsg(await rpc("place_order", pickupFee))));

  sql("update menu_items set is_active = false where id = 3");
  const off = base(); off.p_items[0] = { id: 3, name: "Matcha Cookie", price: 350, quantity: 1 };
  const r9 = await rpc("place_order", off);
  check("Inactive (sold-out) item rejected", /ITEM_UNAVAILABLE/.test(errMsg(r9)), errMsg(r9));
  sql("update menu_items set is_active = true where id = 3");

  sql("update menu_items set price = 400 where id = 11");
  const r10 = await rpc("place_order", base());
  check("Price changed in DB but not on website -> 'review at checkout' message, no order", /PRICE_CHANGED/.test(errMsg(r10)) && /checkout/i.test(errMsg(r10)), errMsg(r10));
  sql("update menu_items set price = 380 where id = 11");

  const bundle = base(); bundle.p_items[0] = { id: 9, name: "Premium Assorted Bundle", price: 380, quantity: 1, bundleConfigs: [["A", "B", "C", "D"]] };
  const r11 = await rpc("place_order", bundle);
  check("Bundle flavour lineup kept on the order", r11.status === 200 &&
    sql(`select jsonb_array_length(items->0->'bundleConfigs') as n from orders where tracking_number='${bundle.p_tracking_number}'`)[0]?.n === 1, errMsg(r11));
}

console.log(results.join("\n"));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
