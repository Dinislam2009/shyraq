import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server";

const handler = withSupabase({ auth: "user" }, async (_req, ctx) => {
  const userId = ctx.userClaims?.sub;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const bucket = ctx.supabaseAdmin.storage.from("user-media");
  let offset = 0;

  while (true) {
    const { data: objects, error: listError } = await bucket.list(userId, { limit: 1000, offset });
    if (listError) {
      return Response.json({ error: "Unable to prepare account deletion.", detail: listError.message }, { status: 500 });
    }

    const paths = (objects ?? []).map((object: { name: string }) => userId + "/" + object.name);
    for (let start = 0; start < paths.length; start += 100) {
      const chunk = paths.slice(start, start + 100);
      if (!chunk.length) continue;
      const { error: removeError } = await bucket.remove(chunk);
      if (removeError) {
        return Response.json({ error: "Unable to remove account media.", detail: removeError.message }, { status: 500 });
      }
    }

    if (!objects || objects.length < 1000) break;
    offset += 1000;
  }

  const { error: deleteError } = await ctx.supabaseAdmin.auth.admin.deleteUser(userId);
  if (deleteError) {
    return Response.json({ error: "Unable to delete account.", detail: deleteError.message }, { status: 500 });
  }

  return Response.json({ ok: true });
});

export default handler;
