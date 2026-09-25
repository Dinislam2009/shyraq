import Link from "next/link";
import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";
import {createBulkCards} from "@/app/decks/[id]/cards/actions";

export default async function BulkCardsPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const supabase=await createClient();
 const {data:deck}=await supabase.from("decks").select("id,name,workspace_id").eq("id",id).maybeSingle();
 if(!deck)return null;
 const {data:templates}=await supabase.from("card_templates").select("id,name").eq("deck_id",id).order("created_at");
 const {data:{user}}=await supabase.auth.getUser();
 let media:any[]=[];
 if(user){
  const {data:items}=await supabase.from("media").select("storage_path,mime_type").eq("owner_id",user.id).eq("workspace_id",deck.workspace_id).order("created_at",{ascending:false}).limit(40);
  media=items??[];
 }
 return <AppShell><div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
  <Link href={"/decks/"+id} className="text-sm text-slate-400 hover:text-slate-700">← Back to deck</Link>
  <h1 className="mt-6 text-3xl font-semibold tracking-tight">Bulk create cards</h1>
  <p className="mt-2 text-sm text-slate-500">Paste one card per line. Use Tab, <span className="font-mono">|</span> or <span className="font-mono">||</span> between front and back.</p>
  <form action={createBulkCards.bind(null,id)} className="mt-8 rounded-2xl border border-black/[0.06] bg-white p-6">
   <textarea name="bulk" required rows={18} placeholder={"What is 2+2?\t4\nCapital of Kazakhstan || Astana\nTerm | Definition"} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm outline-none focus:border-slate-400"/>
   <div className="mt-5 grid gap-4 md:grid-cols-3">
    <label className="block"><span className="text-sm font-medium">Tags for all</span><input name="tags" placeholder="math, exam" className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"/></label>
    <label className="block"><span className="text-sm font-medium">Template</span><select name="template_id" defaultValue="" className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">Default</option>{(templates??[]).map((template:any)=><option key={template.id} value={template.id}>{template.name}</option>)}</select></label>
    <label className="block"><span className="text-sm font-medium">Existing duplicate</span><select name="duplicate_mode" defaultValue="skip" className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="skip">Skip</option><option value="reject">Stop import</option><option value="create">Create anyway</option></select></label>
   </div>
   <label className="mt-4 block"><span className="text-sm font-medium">Attach reusable media to every card</span><select name="media_path" defaultValue="" className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">None</option>{media.map(item=><option key={item.storage_path} value={item.storage_path}>{String(item.storage_path).split("/").pop()} · {item.mime_type}</option>)}</select></label>
   <div className="mt-5 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">Maximum 500 cards per bulk operation. Duplicate matching uses normalized front + back, and duplicates already present in the file are collapsed before creation.</div>
   <div className="mt-5 flex justify-end"><button className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white">Create cards</button></div>
  </form>
 </div></AppShell>;
}
