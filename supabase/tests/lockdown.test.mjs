// Slice 0.1 lockdown checks. Runs against the LOCAL Docker database only.
//
//   supabase db reset --local
//   node supabase/tests/lockdown.test.mjs
//
// Reads URL + keys from `supabase status -o env`. No dependencies.

import { execSync } from "node:child_process";

const env = Object.fromEntries(
  execSync("supabase status -o env", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
    .split(/\r?\n/)
    .map((l) => l.match(/^([A-Z_]+)="?(.*?)"?$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]])
);
const URL_ = env.API_URL;
const ANON = env.ANON_KEY;
const SERVICE = env.SERVICE_ROLE_KEY;
if (!URL_ || !ANON || !SERVICE) throw new Error("Local Supabase not running (supabase start).");
if (!/127\.0\.0\.1|localhost/.test(URL_)) throw new Error("Refusing to run: not a local database.");

// `supabase db reset` restarts the API/storage containers; wait until they answer.
for (let i = 0; i < 60; i++) {
  try {
    const [s, r] = await Promise.all([
      fetch(`${URL_}/storage/v1/bucket/proofs`, { headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` } }),
      fetch(`${URL_}/rest/v1/`, { headers: { apikey: ANON } }),
    ]);
    if (s.status === 200 && r.status < 500) break;
  } catch {}
  await new Promise((res) => setTimeout(res, 1000));
}

let pass = 0, fail = 0;
const results = [];
function check(name, ok, detail = "") {
  ok ? pass++ : fail++;
  results.push(`${ok ? "PASS" : "FAIL"}  ${name}${ok || !detail ? "" : "  -> " + detail}`);
}

async function call(method, path, { token = ANON, body, headers = {} } = {}) {
  const res = await fetch(URL_ + path, {
    method,
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, json };
}
const rest = (m, p, o) => call(m, "/rest/v1" + p, o);
const rpc = (fn, body, o = {}) => call("POST", "/rest/v1/rpc/" + fn, { ...o, body });
const asService = (m, p, o = {}) =>
  fetch(URL_ + p, {
    method: m,
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json", ...(o.headers || {}) },
    body: o.body === undefined ? undefined : JSON.stringify(o.body),
  }).then(async (r) => ({ status: r.status, json: await r.json().catch(() => null) }));

async function makeUser(email, appMeta) {
  await asService("POST", "/auth/v1/admin/users", {
    body: { email, password: "test-password-123", email_confirm: true, app_metadata: appMeta },
  });
  const r = await call("POST", "/auth/v1/token?grant_type=password", {
    body: { email, password: "test-password-123" },
  });
  return r.json.access_token;
}
async function upload(path, token = ANON, contentType = "image/png") {
  const res = await fetch(`${URL_}/storage/v1/object/proofs/${path}`, {
    method: "POST",
    headers: { apikey: ANON, Authorization: `Bearer ${token}`, "Content-Type": contentType },
    body: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
  });
  return res.status;
}
const db = (sql) =>
  JSON.parse(execSync(`supabase db query --local -o json "${sql.replace(/"/g, '\\"')}"`, {
    encoding: "utf8", stdio: ["ignore", "pipe", "ignore"],
  }));
const scalar = (sql) => {
  const out = db(sql);
  const rows = Array.isArray(out) ? out : out.rows ?? out.data ?? [];
  const row = rows[0] ?? {};
  return Object.values(row)[0];
};
const errMsg = (r) => (r.json && (r.json.message || r.json.error)) || "";

const order = (tracking, extra = {}) => ({
  p_customer: { name: "Test Buyer", phone: "09170000000", email: "buyer@example.com",
    address: "1 Test St", orderType: "delivery", deliveryFee: 50 },
  p_items: [{ id: 1, name: "Chocolate Chunk Cookie", price: 100, quantity: 2, isRedeemed: false }],
  p_tracking_number: tracking,
  p_payment_method: "cash",
  ...extra,
});

// ---------------------------------------------------------------- stranger
{
  const o = await rest("GET", "/orders?select=*");
  check("Stranger cannot list orders", o.status >= 400 || (Array.isArray(o.json) && o.json.length === 0), JSON.stringify(o.json).slice(0, 120));
  const c = await rest("GET", "/loyalty_cards?select=*");
  check("Stranger cannot list loyalty cards", c.status >= 400 || (Array.isArray(c.json) && c.json.length === 0));
  const v = await rest("GET", "/vouchers?select=*");
  check("Stranger cannot list vouchers", v.status >= 400 || (Array.isArray(v.json) && v.json.length === 0));
  const f = await rest("GET", "/feedbacks?select=*");
  check("Stranger cannot list feedback", f.status >= 400 || (Array.isArray(f.json) && f.json.length === 0));

  await rest("PATCH", "/vouchers?code=eq.TEST10", { body: { value: 100 } });
  check("Stranger cannot edit a voucher", Number(scalar("select value::text from vouchers where code='TEST10'")) === 10);

  await rest("PATCH", "/loyalty_cards?unique_id=eq.900002", { body: { points: 9999 } });
  check("Stranger cannot edit an unactivated card", Number(scalar("select points from loyalty_cards where unique_id='900002'")) === 0);

  const ap = await rpc("add_points", { card_id: "900001", points_to_add: 1000 });
  check("Stranger cannot add points", ap.status >= 400 && Number(scalar("select points from loyalty_cards where unique_id='900001'")) === 500, `${ap.status}`);
  const dp = await rpc("deduct_points", { card_id: "900001", points_to_deduct: 100 });
  check("Stranger cannot deduct points", dp.status >= 400, `${dp.status}`);
  const ex = await rpc("expire_inactive_points", {});
  check("Stranger cannot run expire_inactive_points", ex.status >= 400, `${ex.status}`);

  const ins = await rest("POST", "/orders", { body: { status: "New", tracking_number: "CRML-HACK1" } });
  check("Stranger cannot insert orders directly", ins.status >= 400 && Number(scalar("select count(*) from orders where tracking_number='CRML-HACK1'")) === 0, `${ins.status}`);

  const pub = await fetch(`${URL_}/storage/v1/object/public/proofs/legacy_proof.jpg`);
  check("Payment proofs are no longer public links", pub.status >= 400, `${pub.status}`);
  const list = await call("POST", "/storage/v1/object/list/proofs", { body: { prefix: "orders", limit: 100 } });
  check("Stranger cannot list payment proofs", list.status >= 400 || (Array.isArray(list.json) && list.json.length === 0), JSON.stringify(list.json).slice(0, 120));
}

// --------------------------------------------------- stranger: still allowed
{
  const fb = await rest("POST", "/feedbacks", { body: { full_name: "New Person", ratings: { X: { taste: 5 } } } });
  check("Customer can still submit feedback", fb.status === 201, `${fb.status} ${errMsg(fb)}`);
  const pop = await rest("GET", "/pop_up_locations?select=venue_name");
  check("Pop-up locations still public", pop.status === 200 && pop.json.length >= 1);
  const rt = await rpc("public_feedback_ratings", {});
  check("Menu ratings still load (ratings only)", rt.status === 200 && rt.json.length >= 1 && !JSON.stringify(rt.json).includes("@"));

  const v1 = await rpc("check_voucher", { p_code: "test10", p_cart_total: 300 });
  check("Voucher check: valid code gives discount", v1.json?.valid === true && Number(v1.json.discount) === 30, JSON.stringify(v1.json));
  const v2 = await rpc("check_voucher", { p_code: "EXPIRED", p_cart_total: 300 });
  check("Voucher check: expired rejected", v2.json?.valid === false && /Expired/.test(v2.json.message));
  const v3 = await rpc("check_voucher", { p_code: "MAXED", p_cart_total: 300 });
  check("Voucher check: fully redeemed rejected", v3.json?.valid === false && /fully redeemed/.test(v3.json.message));
  const v4 = await rpc("check_voucher", { p_code: "FIXED50", p_cart_total: 100 });
  check("Voucher check: min spend enforced", v4.json?.valid === false && /Minimum spend/.test(v4.json.message));
  const v5 = await rpc("check_voucher", { p_code: "INACTIVE", p_cart_total: 300 });
  check("Voucher check: inactive rejected", v5.json?.valid === false);

  const t1 = await rpc("track_order", { p_tracking_number: "crml-seed1" });
  const t1s = JSON.stringify(t1.json);
  check("Track order: finds own order", t1.json?.status === "Preparing" && t1.json?.items?.length === 1, t1s);
  check("Track order: no phone/address/email/proof leaked", !/0900000000|Fake St|seed@|proof|finalTotal/.test(t1s), t1s);
  const t2 = await rpc("track_order", { p_tracking_number: "CRML-NOPE1" });
  check("Track order: unknown number returns nothing", t2.json === null, JSON.stringify(t2.json));

  const rc = await rpc("check_rewards_card", { p_unique_id: "900001" });
  check("Rewards card check works", rc.json?.activated === true && rc.json?.first_name === "Test");
  const rcs = JSON.stringify(rc.json);
  check("Rewards card check leaks no contact info", !/example\.com|0900/.test(rcs), rcs);

  const l1 = await rpc("rewards_login", { p_unique_id: "900001", p_last_name: "customer" });
  check("Rewards login: ID + last name works", l1.json?.points === 500, JSON.stringify(l1.json));
  const l2 = await rpc("rewards_login", { p_unique_id: "900001", p_last_name: "%" });
  check("Rewards login: wildcard '%' no longer works", l2.json === null, JSON.stringify(l2.json));
  const l3 = await rpc("rewards_login", { p_unique_id: "900001", p_last_name: "Wrong" });
  check("Rewards login: wrong last name fails", l3.json === null);

  const a1 = await rpc("activate_rewards_card", { p_unique_id: "900002", p_first_name: "New", p_last_name: "Member", p_phone: "09170001111", p_email: "New@Example.com" });
  check("Card activation works", a1.status === 200 && a1.json?.first_name === "New", `${a1.status} ${errMsg(a1)}`);
  const a2 = await rpc("activate_rewards_card", { p_unique_id: "900002", p_first_name: "Evil", p_last_name: "Takeover", p_phone: "1", p_email: "x@x.com" });
  check("Card activation: cannot re-activate / overwrite", a2.status >= 400 && /ALREADY_ACTIVE/.test(errMsg(a2)), errMsg(a2));
  const a3 = await rpc("activate_rewards_card", { p_unique_id: "999999", p_first_name: "a", p_last_name: "b", p_phone: "c", p_email: "d" });
  check("Card activation: unknown ID rejected", /CARD_NOT_FOUND/.test(errMsg(a3)));

  check("Customer can upload proof to orders/ folder", (await upload("orders/test_proof_1.png")) === 200);
  check("Customer cannot upload outside orders/ folder", (await upload("evil.png")) >= 400);
  check("Customer cannot overwrite an existing proof", (await upload("orders/test_proof_1.png")) >= 400);
  check("Non-image upload rejected", (await upload("orders/x.html", ANON, "text/html")) >= 400);
}

// ------------------------------------------------------------- place_order
{
  const usedBefore = Number(scalar("select used_count from vouchers where code='TEST10'"));
  const r1 = await rpc("place_order", order("CRML-TST01", {
    p_payment_method: "gcash", p_proof_path: "orders/test_proof_1.png",
    p_voucher_code: "TEST10", p_rewards_id: "900001" }));
  check("Checkout: GCash order with proof + voucher + points succeeds", r1.status === 200 && r1.json?.tracking_number === "CRML-TST01", `${r1.status} ${errMsg(r1)}`);
  // 2 x 100 + 50 delivery = 250; 10% = 25; final 225; points floor(225/20) = 11
  check("Checkout: server computed totals (250 - 25 = 225)", Number(r1.json?.final_total) === 225 && Number(r1.json?.discount) === 25, JSON.stringify(r1.json));
  check("Checkout: points earned = 11", r1.json?.points_earned === 11 && Number(scalar("select points from loyalty_cards where unique_id='900001'")) === 511);
  check("Checkout: voucher use counted once", Number(scalar("select used_count from vouchers where code='TEST10'")) === usedBefore + 1);
  check("Checkout: proof stored as private path", scalar("select \"proofUrl\" from orders where tracking_number='CRML-TST01'") === "orders/test_proof_1.png");

  const r2 = await rpc("place_order", order("CRML-TST01", {
    p_payment_method: "gcash", p_proof_path: "orders/test_proof_1.png",
    p_voucher_code: "TEST10", p_rewards_id: "900001" }));
  check("Double-tap / retry: no duplicate order", r2.json?.duplicate === true && Number(scalar("select count(*) from orders where tracking_number='CRML-TST01'")) === 1);
  check("Double-tap / retry: voucher + points not counted twice",
    Number(scalar("select used_count from vouchers where code='TEST10'")) === usedBefore + 1 &&
    Number(scalar("select points from loyalty_cards where unique_id='900001'")) === 511);

  const r3 = await rpc("place_order", order("CRML-TST01", { p_customer: { name: "Other", phone: "0999", orderType: "pickup", deliveryFee: 0 } }));
  check("Same tracking number, different customer: rejected", /TRACKING_TAKEN/.test(errMsg(r3)), errMsg(r3));

  const r4 = await rpc("place_order", order("CRML-TST02", { p_payment_method: "gcash" }));
  check("GCash without proof: rejected", /NO_PROOF/.test(errMsg(r4)), errMsg(r4));
  const r4b = await rpc("place_order", order("CRML-TST02", { p_payment_method: "bank", p_proof_path: "orders/does_not_exist.png" }));
  check("Proof path that was never uploaded: rejected", /NO_PROOF/.test(errMsg(r4b)), errMsg(r4b));

  const freebie = order("CRML-TST03");
  freebie.p_items.push({ id: 100, name: "Free Chocolate Chunk Cookie", price: 0, quantity: 1, isRedeemed: false });
  const r5 = await rpc("place_order", freebie);
  check("Free reward item without points: rejected", /BAD_REWARD/.test(errMsg(r5)), errMsg(r5));

  const redeem = order("CRML-TST04", { p_redemption_card: "900001", p_rewards_id: "900001" });
  redeem.p_items.push({ id: 100, name: "Free Chocolate Chunk Cookie", price: 0, quantity: 1, isRedeemed: true });
  const r6 = await rpc("place_order", redeem);
  // 511 - 75 = 436, then earns floor(250/20)=12 -> 448
  check("Reward redemption: 75 points deducted by server", r6.status === 200 && Number(scalar("select points from loyalty_cards where unique_id='900001'")) === 448, `${r6.status} ${errMsg(r6)} pts=${scalar("select points from loyalty_cards where unique_id='900001'")}`);

  const usedBefore2 = Number(scalar("select used_count from vouchers where code='TEST10'"));
  const poor = order("CRML-TST05", { p_redemption_card: "900004", p_voucher_code: "TEST10" });
  poor.p_items.push({ id: 101, name: "Free Crumella Minis", price: 0, quantity: 1, isRedeemed: true });
  const r7 = await rpc("place_order", poor);
  check("Not enough points: rejected", /NOT_ENOUGH_POINTS/.test(errMsg(r7)), errMsg(r7));
  check("Rejected order changes nothing (voucher not counted, no order)",
    Number(scalar("select used_count from vouchers where code='TEST10'")) === usedBefore2 &&
    Number(scalar("select count(*) from orders where tracking_number='CRML-TST05'")) === 0);

  const r8 = await rpc("place_order", order("CRML-TST06", { p_voucher_code: "MAXED" }));
  check("Fully used voucher at checkout: rejected", /VOUCHER_INVALID/.test(errMsg(r8)), errMsg(r8));

  const two = order("CRML-TST07", { p_redemption_card: "900001" });
  two.p_items.push({ id: 100, name: "Free Chocolate Chunk Cookie", price: 0, quantity: 2, isRedeemed: true });
  const r9 = await rpc("place_order", two);
  check("Two rewards in one order: rejected", /ONE_REWARD/.test(errMsg(r9)), errMsg(r9));

  const neg = order("CRML-TST08");
  neg.p_items[0].price = -500;
  const r10 = await rpc("place_order", neg);
  check("Negative price: rejected", /BAD_ITEMS/.test(errMsg(r10)), errMsg(r10));

  const exp = order("CRML-TST09", { p_rewards_id: "900003" });
  const r11 = await rpc("place_order", exp);
  check("Expired card earns no points (order still goes through)", r11.status === 200 && r11.json?.points_earned === 0 && Number(scalar("select points from loyalty_cards where unique_id='900003'")) === 300);
}

// ------------------------------------------------- logged in, but NOT admin
{
  const tok = await makeUser("someone@example.com", {});
  const o = await rest("GET", "/orders?select=*", { token: tok });
  check("Logged-in non-admin cannot read orders", Array.isArray(o.json) && o.json.length === 0, JSON.stringify(o.json).slice(0, 100));
  const ap = await rpc("add_points", { card_id: "900001", points_to_add: 1000 }, { token: tok });
  check("Logged-in non-admin cannot add points", ap.status >= 400 && /NOT_ALLOWED/.test(errMsg(ap)), errMsg(ap));
  const sg = await call("POST", "/storage/v1/object/sign/proofs/orders/test_proof_1.png", { token: tok, body: { expiresIn: 60 } });
  check("Logged-in non-admin cannot open proofs", sg.status >= 400, `${sg.status}`);
}

// ------------------------------------------------------------------- admin
{
  const tok = await makeUser("admin@example.com", { role: "admin" });
  const o = await rest("GET", "/orders?select=*", { token: tok });
  check("Admin sees all orders", Array.isArray(o.json) && o.json.length >= 4, `${o.json?.length}`);
  const up = await rest("PATCH", "/orders?tracking_number=eq.CRML-TST01", { token: tok, body: { status: "Delivered" }, headers: { Prefer: "return=representation" } });
  check("Admin can update order status", up.status === 200 && up.json?.[0]?.status === "Delivered");
  const vr = await rest("PATCH", "/vouchers?code=eq.MAXED", { token: tok, body: { used_count: 0 }, headers: { Prefer: "return=representation" } });
  check("Admin can reset voucher usage", vr.json?.[0]?.used_count === 0);
  const fb = await rest("GET", "/feedbacks?select=*", { token: tok });
  check("Admin can read feedback", Array.isArray(fb.json) && fb.json.length >= 2);
  const card = await rest("GET", "/loyalty_cards?unique_id=eq.900001&select=*", { token: tok });
  check("Admin can open a loyalty card", card.json?.[0]?.unique_id === "900001");
  const ap = await rpc("add_points", { card_id: "900001", points_to_add: 10 }, { token: tok });
  check("Admin can add points (card page)", ap.status === 204 || ap.status === 200, `${ap.status} ${errMsg(ap)}`);
  const neg = await rpc("add_points", { card_id: "900004", points_to_add: -50 }, { token: tok });
  check("Admin cannot push a card below 0 points", neg.status >= 400);
  const sg = await call("POST", "/storage/v1/object/sign/proofs/orders/test_proof_1.png", { token: tok, body: { expiresIn: 60 } });
  check("Admin can open proofs via signed link", sg.status === 200 && !!(sg.json?.signedURL || sg.json?.signedUrl), `${sg.status} ${JSON.stringify(sg.json)}`);

  // Old orders (all 24 on live) store a public URL to a file at the bucket root.
  await fetch(`${URL_}/storage/v1/object/proofs/legacy_root_proof.png`, {
    method: "POST",
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "image/png", "x-upsert": "true" },
    body: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
  });
  const legacy = await call("POST", "/storage/v1/object/sign/proofs/legacy_root_proof.png", { token: tok, body: { expiresIn: 60 } });
  check("Admin can open OLD-style proofs (bucket root, like live)", legacy.status === 200, `${legacy.status} ${JSON.stringify(legacy.json)}`);
  const legacyAnon = await fetch(`${URL_}/storage/v1/object/public/proofs/legacy_root_proof.png`);
  check("Old-style proof public link no longer works", legacyAnon.status >= 400, `${legacyAnon.status}`);
}

console.log(results.join("\n"));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
