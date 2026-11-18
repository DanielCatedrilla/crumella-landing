// Backlog 3 — admin live order updates. LOCAL Docker database only.
// Who receives order changes, how fast, and how big each message is.

import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  execSync("supabase status -o env", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
    .split(/\r?\n/).map((l) => l.match(/^([A-Z_]+)="?(.*?)"?$/)).filter(Boolean).map((m) => [m[1], m[2]])
);
const URL_ = env.API_URL, ANON = env.ANON_KEY, SERVICE = env.SERVICE_ROLE_KEY;
if (!/127\.0\.0\.1|localhost/.test(URL_ || "")) throw new Error("Refusing to run: not a local database.");

let pass = 0, fail = 0;
const results = [];
const check = (name, ok, detail = "") => { ok ? pass++ : fail++; results.push(`${ok ? "PASS" : "FAIL"}  ${name}${ok || !detail ? "" : "  -> " + detail}`); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const opts = { auth: { persistSession: false, autoRefreshToken: false } };

const admin = createClient(URL_, SERVICE, opts);
async function userClient(email, appMeta) {
  await admin.auth.admin.createUser({ email, password: "test-password-123", email_confirm: true, app_metadata: appMeta });
  const c = createClient(URL_, ANON, opts);
  const { error } = await c.auth.signInWithPassword({ email, password: "test-password-123" });
  if (error) throw error;
  c.realtime.setAuth((await c.auth.getSession()).data.session.access_token);
  return c;
}

const listeners = {
  stranger: createClient(URL_, ANON, opts),
  nonAdmin: await userClient("rt-someone@example.com", {}),
  admin: await userClient("rt-admin@example.com", { role: "admin" }),
};
const got = { stranger: [], nonAdmin: [], admin: [] };
const channels = [];
await Promise.all(Object.entries(listeners).map(([who, c]) => new Promise((resolve) => {
  const ch = c.channel(`rt-${who}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (p) =>
      got[who].push({ type: p.eventType, at: Date.now(), bytes: Buffer.byteLength(JSON.stringify(p)), p }))
    .subscribe((status) => { if (status === "SUBSCRIBED") resolve(); });
  channels.push([c, ch]);
  setTimeout(resolve, 10000);
})));
await wait(4000); // let subscriptions settle (realtime may have just restarted)

// 1. New order from the website (stranger's public key)
const tracking = "CRML-RT" + String(Date.now()).slice(-3);
const t0 = Date.now();
const { error: placeErr } = await listeners.stranger.rpc("place_order", {
  p_customer: { name: "Realtime Buyer", phone: "09170009999", orderType: "pickup", deliveryFee: 0 },
  p_items: [{ id: 11, name: "Hazelnut Lava Cookie", price: 380, quantity: 1 }],
  p_tracking_number: tracking,
  p_payment_method: "cash",
});
if (placeErr) throw placeErr;
await wait(4000);

// 2. Admin changes the status (e.g. from another device)
const { data: row } = await listeners.admin.from("orders").update({ status: "Preparing" }).eq("tracking_number", tracking).select().single();
await wait(3000);

// 3. Admin deletes it
await listeners.admin.from("orders").delete().eq("id", row.id);
await wait(3000);

const types = (who) => got[who].map((e) => e.type).join(",") || "nothing";
const ins = got.admin.find((e) => e.type === "INSERT");
check("Admin receives the new order", !!ins && ins.p.new?.tracking_number === tracking, types("admin"));
check("New order arrives within 5 seconds", !!ins && ins.at - t0 < 5000, ins ? `${ins.at - t0} ms` : "never");
check("Admin receives the status change", got.admin.some((e) => e.type === "UPDATE" && e.p.new?.status === "Preparing"), types("admin"));
check("Admin receives the delete", got.admin.some((e) => e.type === "DELETE"), types("admin"));
const maxBytes = Math.max(0, ...got.admin.map((e) => e.bytes));
check(`Each live message is small (largest ${maxBytes} bytes, limit 5000)`, maxBytes > 0 && maxBytes < 5000);
// Non-admins may get empty "Error 401: Unauthorized" notices or a delete
// notice carrying only the internal id. Any other field = a leak.
const leaked = (who) => got[who].filter((e) =>
  Object.keys(e.p.new || {}).length > 0 || Object.keys(e.p.old || {}).some((k) => k !== "id"));
check("Stranger receives no order data", leaked("stranger").length === 0, types("stranger"));
check("Logged-in non-admin receives no order data", leaked("nonAdmin").length === 0, types("nonAdmin"));
const strangerDeletes = got.stranger.filter((e) => e.type === "DELETE").length + got.nonAdmin.filter((e) => e.type === "DELETE").length;
results.push(`INFO  Delete notices to non-admins: ${strangerDeletes} (contain at most the order's internal id)`);

if (process.env.RT_DUMP) for (const who of Object.keys(got)) for (const e of got[who]) console.log("DUMP", who, e.type, JSON.stringify({ new: e.p.new, old: e.p.old, errors: e.p.errors }).slice(0, 300));
for (const [c, ch] of channels) await c.removeChannel(ch);
console.log(results.join("\n"));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
