import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
dotenv.config({ path: path.join(repoRoot, ".env") });
const apiBaseUrl = process.env.SHYRAQ_TEST_API_URL ?? "http://localhost:4000";
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const email = process.env.SHYRAQ_TEST_EMAIL;
const password = process.env.SHYRAQ_TEST_PASSWORD;
const enabled = Boolean(supabaseUrl && supabaseAnonKey && email && password);

test("authenticated analytics contract", { skip: !enabled }, async () => {
  const supabase = createClient(supabaseUrl!, supabaseAnonKey!, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  const { data, error } = await supabase.auth.signInWithPassword({ email: email!, password: password! });
  assert.ifError(error);
  assert.ok(data.session?.access_token);
  const headers = { authorization: `Bearer ${data.session.access_token}` };

  const response = await fetch(`${apiBaseUrl}/api/v1/analytics?days=7`, { headers });
  const text = await response.text();
  assert.equal(response.status, 200, `analytics failed: HTTP ${response.status}: ${text}`);
  const analytics = JSON.parse(text) as {
    days: number;
    range: { from: string; to: string };
    totals: Record<string, number>;
    series: Array<{ date: string; tasksCompleted: number; habitsCompleted: number; focusMinutes: number; reviews: number; correctReviews: number }>;
  };
  assert.equal(analytics.days, 7);
  assert.equal(analytics.series.length, 7);
  assert.ok(analytics.range.from <= analytics.range.to);
  assert.ok(Number.isInteger(analytics.totals.tasksCompleted));
  assert.ok(Number.isInteger(analytics.totals.habitsCompleted));
  assert.ok(Number.isInteger(analytics.totals.focusMinutes));
  assert.ok(Number.isInteger(analytics.totals.reviews));
  assert.ok(analytics.totals.reviewAccuracy >= 0 && analytics.totals.reviewAccuracy <= 100);

  const longer = await fetch(`${apiBaseUrl}/api/v1/analytics?days=30`, { headers });
  const longerText = await longer.text();
  assert.equal(longer.status, 200, `30-day analytics failed: HTTP ${longer.status}: ${longerText}`);
  const longerData = JSON.parse(longerText) as { days: number; series: unknown[] };
  assert.equal(longerData.days, 30);
  assert.equal(longerData.series.length, 30);
});
