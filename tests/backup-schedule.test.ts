import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("automatic backup scheduling has server-only cron plumbing",()=>{
 const schema=readFileSync(new URL("../supabase/schema.sql",import.meta.url),"utf8");
 const action=readFileSync(new URL("../src/app/export/actions.ts",import.meta.url),"utf8");
 const cron=readFileSync(new URL("../src/app/api/cron/backups/route.ts",import.meta.url),"utf8");
 const page=readFileSync(new URL("../src/app/export/page.tsx",import.meta.url),"utf8");
 const vercel=readFileSync(new URL("../vercel.json",import.meta.url),"utf8");
 assert.match(schema,/create table if not exists public\.backup_schedules/);
 assert.match(schema,/create policy backup_schedules_self/);
 assert.match(action,/updateBackupSchedule/);
 assert.match(cron,/SUPABASE_SERVICE_ROLE_KEY/);
 assert.match(cron,/CRON_SECRET/);
 assert.match(cron,/backup_versions/);
 assert.match(page,/Automatic backups/);
 assert.match(vercel,/\/api\/cron\/backups/);
});
