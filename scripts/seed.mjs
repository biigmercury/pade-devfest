// Seed 30 demo profiles (is_demo = true) into Supabase.
// Usage: npm run seed            (reads .env.local)
// Re-running replaces the previous demo profiles (and their matches).
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Put them in .env.local first.");
  process.exit(1);
}

const demo = JSON.parse(readFileSync(new URL("./demo-profiles.json", import.meta.url), "utf8"));
const sb = createClient(url, key, { auth: { persistSession: false } });

const del = await sb.from("profiles").delete().eq("is_demo", true);
if (del.error) {
  console.error("Could not clear old demo profiles:", del.error.message);
  console.error("Did you run supabase/schema.sql in the Supabase SQL editor?");
  process.exit(1);
}

const rows = demo.map((p) => ({ ...p, is_demo: true }));
const ins = await sb.from("profiles").insert(rows).select("id");
if (ins.error) {
  console.error("Insert failed:", ins.error.message);
  process.exit(1);
}
console.log(`Seeded ${ins.data.length} demo profiles. Pàdé is ready 🎉`);
