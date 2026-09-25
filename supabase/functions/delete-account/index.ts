import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server";

export default {
  fetch: withSupabase({ auth: "user" }, async (_req, ctx) => {
    const userId = ctx.userClaims?.sub;
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const bucket = ctx.supabaseAdmin.storage.from("user-media");
    const { data:objects, error:listError } = await bucket.list(userId, { limit: 1000, offset: 0 });
    if (listError) return Response.json({ error: "Unable to prepare account deletion.", detail: listError.message }, { status: 500 });

    const paths = (objects ?? []).map(object => userId + "/" + object.name);
    if (paths.length) {
      const { error:removeError } = await bucket.remove(paths);
      if (removeError) return Response.json({ error: "Unable to remove account media.", detail: removeError.message }, { status: 500 });
    }

    const { error:deleteError } = await ctx.supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) return Response.json({ error: "Unable to delete account.", detail: deleteError.message }, { status: 500 });

    return Response.json({ ok: true });
  }),
};
