"use server";

import { redirect } from "next/navigation";

export async function startReviewSession(formData:FormData):Promise<void>{
  const deck=String(formData.get("deck")||"").trim();
  const limit=Math.min(100,Math.max(1,Number(formData.get("limit")||20)));
  const auto=Math.min(60,Math.max(0,Number(formData.get("auto_reveal")||0)));
  const params=new URLSearchParams();
  if(deck)params.set("deck",deck);
  params.set("limit",String(limit));
  params.set("auto",String(auto));
  if(formData.get("shuffle")==="on")params.set("shuffle","1");
  redirect("/review?"+params.toString());
}
