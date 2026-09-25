"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/i18n-provider";

export function CollaborationPresence({ deckId, userId }: { deckId: string; userId: string }) {
  const [count, setCount] = useState(1);
  const { t } = useI18n();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("shyraq-presence-" + deckId, {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setCount(Object.keys(state).length);
      })
      .subscribe(async status => {
        if (status === "SUBSCRIBED") {
          await channel.track({ userId, joinedAt: Date.now() });
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [deckId, userId]);

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      {count} {count === 1 ? t("member") : t("members")} {t("here")}
    </div>
  );
}
