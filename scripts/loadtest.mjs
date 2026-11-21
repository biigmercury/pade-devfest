// Quick load test for Pàdé: ~200 concurrent signups, matches and stats reads.
// Usage:
//   BASE=http://localhost:3000 npm run loadtest
//   BASE=https://your-app.vercel.app N=200 npm run loadtest
// Locally, each fake attendee sends its own X-Forwarded-For so the per-IP signup limit
// behaves like many phones. Set SAME_IP=1 to simulate everyone behind one venue NAT.

const BASE = (process.env.BASE || "http://localhost:3000").replace(/\/$/, "");
const N = Number(process.env.N || 200);
const SAME_IP = process.env.SAME_IP === "1";

const EMOJIS = ["😎", "🚀", "🦄", "🔥", "🎧", "🧠", "🦁", "⚡"];
const INTERESTS = ["ai", "web", "mobile", "cloud", "design", "fintech", "web3", "data", "security", "gaming", "devops", "product", "startups", "community", "afrobeats", "football"];
const GOALS = ["cofounder", "hire", "get_hired", "mentor", "mentee", "collab", "vibes"];
const NAMES = ["Tobi", "Chioma", "Musa", "Ife", "Kelechi", "Sade", "Yusuf", "Bola", "Obi", "Zara"];

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const sample3 = () => [...INTERESTS].sort(() => Math.random() - 0.5).slice(0, 3);

async function call(method, path, body, i) {
  const t = performance.now();
  try {
    const res = await fetch(BASE + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": SAME_IP ? "10.0.0.1" : `10.${(i >> 16) & 255}.${(i >> 8) & 255}.${i & 255}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30000),
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, ms: performance.now() - t, data };
  } catch (e) {
    return { status: 0, ms: performance.now() - t, data: { error: String(e?.message || e) } };
  }
}

function report(label, results) {
  const by = {};
  for (const r of results) by[r.status] = (by[r.status] || 0) + 1;
  const ms = results.map((r) => r.ms).sort((a, b) => a - b);
  const q = (p) => Math.round(ms[Math.min(ms.length - 1, Math.floor(p * ms.length))]);
  const bad = results.filter((r) => r.status === 0 || r.status >= 500);
  console.log(
    `${label.padEnd(34)} n=${results.length}  statuses=${JSON.stringify(by)}  p50=${q(0.5)}ms  p95=${q(0.95)}ms  max=${q(0.999)}ms` +
      (bad.length ? `  ❌ ${bad.length} failures, e.g. ${JSON.stringify(bad[0].data)}` : "  ✅"),
  );
  return bad.length;
}

const all = (n, fn) => Promise.all(Array.from({ length: n }, (_, i) => fn(i)));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

console.log(`Pàdé load test → ${BASE}  (N=${N}${SAME_IP ? ", same IP" : ""})\n`);
let failures = 0;

const signups = await all(N, (i) =>
  call("POST", "/api/profile", { name: `${pick(NAMES)} ${i}`, emoji: pick(EMOJIS), interests: sample3(), goal: pick(GOALS), fun_pick: pick(["party", "smoky"]) }, i),
);
failures += report("1. signup (concurrent)", signups);
const ids = signups.filter((r) => r.status === 201).map((r) => r.data.profile.id);

const m1 = await all(ids.length, (i) => call("POST", "/api/match", { profileId: ids[i] }, i));
failures += report("2. match (concurrent)", m1);

const m2 = await all(ids.length, (i) => call("POST", "/api/match", { profileId: ids[i] }, i));
failures += report("3. match again at once (expect 429)", m2);

await sleep(3200);
const m3 = await all(ids.length, (i) => call("POST", "/api/match", { profileId: ids[i] }, i));
failures += report("4. match again after 3s", m3);

const lists = await all(ids.length, (i) => call("GET", `/api/matches?profileId=${ids[i]}`, null, i));
failures += report("5. met list (concurrent)", lists);

const found = await all(ids.length, (i) => {
  const mid = m1[i]?.data?.match?.id;
  return mid ? call("POST", "/api/found", { profileId: ids[i], matchId: mid }, i) : Promise.resolve({ status: 204, ms: 0 });
});
failures += report("6. found (concurrent)", found);

const stats = await all(N, (i) => call("GET", "/api/stats", null, i));
failures += report("7. stats (concurrent)", stats);
console.log("\nstats:", JSON.stringify(stats[0].data));

const garbage = await all(20, (i) => call("POST", "/api/match", { profileId: "not-a-uuid" }, i));
failures += report("8. junk input (expect 400)", garbage);

console.log(failures ? `\n${failures} failures` : "\nNo 5xx or network failures 🎉");
process.exit(failures ? 1 : 0);
