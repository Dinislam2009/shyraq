import Link from "next/link";
import {notFound} from "next/navigation";
import {AppShell} from "@/components/app-shell";
import {CardManager} from "@/components/card-manager";
import {CollaborationPresence} from "@/components/collaboration-presence";
import {CollaborationRealtime} from "@/components/collaboration-realtime";
import {getDeck} from "@/lib/supabase/queries";
import {acceptDeckUpdate,setDeckUpdatePolicy} from "@/app/explore/[id]/actions";
import {createClient} from "@/lib/supabase/server";
import {getEffectiveDeckRole} from "@/lib/workspace/deck-permissions";
import {getServerI18n} from "@/lib/i18n-server";

export default async function DeckPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{error?:string}>}){
 const {id}=await params;
 const {t}=await getServerI18n();
 const {error}=await searchParams;
 const deck:any=await getDeck(id);
 if(!deck)notFound();
 const cards=deck.cards??[];

 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 const {data:currentProfile}=user?await supabase.from("profiles").select("display_name,username").eq("id",user.id).maybeSingle():{data:null};

 const permission=await getEffectiveDeckRole(id);
 const canEdit=permission.deckRole==="editor";

 let sourceUpdate:any=null;
 if(user){
  const {data:copy}=await supabase
   .from("deck_copies")
   .select("source_deck_id,last_synced_source_updated_at,update_policy")
   .eq("user_id",user.id)
   .eq("copied_deck_id",id)
   .maybeSingle();

  if(copy){
   const {data:source}=await supabase
    .from("decks")
    .select("id,name,updated_at")
    .eq("id",copy.source_deck_id)
    .maybeSingle();

   if(source&&copy.last_synced_source_updated_at&&new Date(source.updated_at)>new Date(copy.last_synced_source_updated_at)){
    sourceUpdate={...copy,source};
   }
  }
 }

 let favoriteIds:string[]=[];
 if(user){
  const {data:workspace}=await supabase
   .from("workspaces")
   .select("id")
   .eq("owner_id",user.id)
   .eq("kind","personal")
   .limit(1)
   .maybeSingle();

  if(workspace){
   const {data:collection}=await supabase
    .from("collections")
    .select("id")
    .eq("workspace_id",workspace.id)
    .eq("kind","favorites")
    .limit(1)
    .maybeSingle();

   if(collection){
    const {data:links}=await supabase
     .from("collection_cards")
     .select("card_id")
     .eq("collection_id",collection.id);

    favoriteIds=(links??[]).map((x:any)=>x.card_id);
   }
  }
 }

 return (
  <AppShell>
   <CollaborationRealtime deckId={id} workspaceId={String(deck.workspace_id)}/>
   <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
    <Link href="/decks" className="text-sm text-slate-400 hover:text-slate-700">← {t("Back to decks")}</Link>

    {error&&(
     <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
      {error}
     </div>
    )}

    <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
     <div>
      <div className="mb-4 flex items-center gap-3">{deck.settings?.coverUrl?<img src={String(deck.settings.coverUrl)} alt="" className="h-16 w-28 rounded-xl object-cover"/>:<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold">S</div>}
       {user&&<CollaborationPresence deckId={id} userId={user.id} displayName={String(currentProfile?.display_name||currentProfile?.username||"Member")} role={String(permission.deckRole||"viewer")}/>}
      </div>
      <h1 className="text-3xl font-semibold tracking-tight">{deck.name}</h1>
      <p className="mt-2 text-sm text-slate-500">{deck.description||t("No description")}</p>
     </div>

     <div className="flex flex-wrap gap-2">
      {canEdit&&(
       <>
        <Link href={"/decks/"+id+"/cards/new"} className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold">{t("Add card")}</Link>
        <Link href={"/decks/"+id+"/cards/bulk"} className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold">{t("Bulk create")}</Link>
        <Link href={"/decks/"+id+"/templates"} className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold">{t("Templates")}</Link><Link href={"/decks/"+id+"/settings"} className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold">{t("Settings")}</Link><Link href={"/decks/"+id+"/collaboration"} className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold">{t("Collaboration")}</Link>
       </>
      )}
      <Link href={"/decks/"+id+"/updates"} className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold">{t("Updates")}</Link><Link href={"/review?deck="+id} className="inline-flex h-11 items-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white">{t("Study")}</Link>
     </div>
    </div>

    {sourceUpdate&&(
     <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
       <div>
        <p className="text-sm font-semibold text-amber-900">{t("Author update available")}</p>
        <p className="mt-1 text-sm text-amber-800">“{sourceUpdate.source.name}” has changed since this copy was last synced.</p>
        {sourceUpdate.update_policy==="accept_all"&&<p className="mt-1 text-xs text-amber-700">Your setting allows author updates, but local changes are still protected.</p>}
       </div>
       <div className="flex gap-2">
        <form action={acceptDeckUpdate.bind(null,id)}>
         <button className="rounded-xl bg-amber-900 px-4 py-2.5 text-sm font-semibold text-white">{t("Review & accept update")}</button>
        </form>
        <form action={setDeckUpdatePolicy.bind(null,id,sourceUpdate.update_policy==="accept_all"?"ask":"accept_all")}>
         <button className="rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-900">
          {sourceUpdate.update_policy==="accept_all"?"Ask before updates":"Accept future updates"}
         </button>
        </form>
       </div>
      </div>
     </div>
    )}

    <div className="mt-8 grid gap-4 sm:grid-cols-3">
     <Metric label={t("Cards")} value={String(cards.length)}/>
     <Metric label={t("Visibility")} value={deck.visibility}/>
     <Metric label={t("Status")} value={t("Active")}/>
    </div>

    <div className="mt-8">
     {cards.length===0 ? (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
       <p className="font-semibold">{t("No cards yet")}</p>
       {canEdit&&<Link href={"/decks/"+id+"/cards/new"} className="mt-4 inline-flex rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">{t("Add your first card")}</Link>}
      </div>
     ) : (
      <CardManager deckId={id} cards={cards} favoriteIds={favoriteIds} canEdit={canEdit}/>
     )}
    </div>
   </div>
  </AppShell>
 );
}

function Metric({label,value}:{label:string;value:string}){
 return (
  <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
   <p className="text-sm text-slate-400">{label}</p>
   <p className="mt-2 text-2xl font-semibold">{value}</p>
  </div>
 );
}
