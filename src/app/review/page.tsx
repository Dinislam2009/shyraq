import { AppShell } from "@/components/app-shell";
import { getCurrentUser, getReviewCard } from "@/lib/supabase/queries";
import { ReviewRunner } from "@/components/review-runner";

export default async function ReviewPage(){
 const item:any=await getReviewCard();
 const user=await getCurrentUser();
 if(!item||!user)return <AppShell><div className="mx-auto max-w-2xl px-5 py-20 text-center"><h1 className="text-2xl font-semibold">Review queue is empty</h1><p className="mt-3 text-sm leading-6 text-slate-500">Create some cards first. New cards enter the FSRS schedule after their first answer.</p></div></AppShell>;
 return <AppShell><ReviewRunner userId={user.id} card={item.card} stateData={item.stateData}/></AppShell>;
}