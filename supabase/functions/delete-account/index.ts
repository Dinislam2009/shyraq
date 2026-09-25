import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server";

type StorageEntry = { name: string; id?: string | null; metadata?: Record<string, unknown> | null };

const handler = withSupabase({ auth: "user" }, async (_req, ctx) => {
  const userId = ctx.userClaims?.sub;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const bucket = ctx.supabaseAdmin.storage.from("user-media");
  const folders = [userId];

  while (folders.length) {
    const prefix = folders.pop()!;
    while (true) {
      const { data: entries, error: listError } = await bucket.list(prefix, { limit: 1000, offset: 0 });
      if (listError) return Response.json({ error: "Unable to prepare account deletion.", detail: listError.message }, { status: 500 });
      if (!entries || entries.length === 0) break;

      const files: string[] = [];
      for (const entry of entries as StorageEntry[]) {
        const path = prefix + "/" + entry.name;
        if (entry.id) files.push(path);
        else folders.push(path);
      }

      for (let start = 0; start < files.length; start += 100) {
        const chunk = files.slice(start, start + 100);
        const { error: removeError } = await bucket.remove(chunk);
        if (removeError) return Response.json({ error: "Unable to remove account media.", detail: removeError.message }, { status: 500 });
      }

      if (entries.length < 1000) break;
    }
  }

  const { error: deleteError } = await ctx.supabaseAdmin.auth.admin.deleteUser(userId);
  if (deleteError) return Response.json({ error: "Unable to delete account.", detail: deleteError.message }, { status: 500 });
  return Response.json({ ok: true });
});

export default handler;
