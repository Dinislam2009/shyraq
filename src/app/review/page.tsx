import { AppShell } from "@/components/app-shell";
import { getReviewCard } from "@/lib/supabase/queries";
import { submitReview } from "@/app/review/actions";

export default async function ReviewPage(){
 const item:any=await getReviewCard();
 if(!item)return <AppShell><div className="mx-auto max-w-2xl px-5 py-20 text-center"><h1 className="text-2xl font-semibold">Review queue is empty</h1><p className="mt-3 text-sm leading-6 text-slate-500">Create some cards first. New cards enter the FSRS schedule after their first answer.</p></div></AppShell>;
 const card=item.card;
 return <AppShell><div className="mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-4xl flex-col px-5 py-8 sm:px-8">
  <div className="mb-6"><p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{card.kind}</p><p className="mt-1 text-sm text-slate-500">Review</p></div>
  <div className="flex flex-1 items-center"><div className="w-full rounded-3xl border border-black/[0.06] bg-white p-8 text-center shadow-sm sm:p-12"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Front</p><h1 className="mx-auto mt-6 max-w-2xl whitespace-pre-wrap text-3xl font-semibold">{card.content?.front||""}</h1>
   <details className="mt-10"><summary className="mx-auto w-fit cursor-pointer rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold">Show answer</summary><div className="mt-8 border-t border-slate-100 pt-8"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Back</p><p className="mx-auto mt-5 max-w-2xl whitespace-pre-wrap text-lg leading-8 text-slate-600">{card.content?.back||""}</p></div></details>
  </div></div>
  <div className="mt-5 grid grid-cols-4 gap-2">{(["again","hard","good","easy"] as const).map(r=><form key={r} action={submitReview.bind(null,card.id,r,0)}><button className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold capitalize hover:bg-slate-50">{r}</button></form>)}</div>
 </div></AppShell>;
}