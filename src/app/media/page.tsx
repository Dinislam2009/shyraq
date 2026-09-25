import Link from "next/link";
import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";
import {cleanupOrphanMedia,deleteMedia} from "@/app/media/actions";
import {MediaMetadata} from "@/components/media-metadata";

export default async function MediaPage({searchParams}:{searchParams?:Promise<{q?:string;error?:string}>}){
 const params=searchParams?await searchParams:{};
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return <AppShell><div className="mx-auto max-w-5xl px-5 py-10">Sign in to manage media.</div></AppShell>;
 const {data:rows}=await supabase.from("media").select("storage_path,mime_type,byte_size,checksum,created_at").eq("owner_id",user.id).order("created_at",{ascending:false}).limit(500);
 const q=String(params.q||"").trim().toLowerCase();
 const filtered=(rows??[]).filter((item:any)=>!q||String(item.storage_path).toLowerCase().includes(q)||String(item.mime_type).toLowerCase().includes(q));
 const withUrls=await Promise.all(filtered.map(async(item:any)=>{const {data}=await supabase.storage.from("user-media").createSignedUrl(item.storage_path,1800);return {...item,url:data?.signedUrl||""};}));
 const totalBytes=(rows??[]).reduce((sum:number,item:any)=>sum+Number(item.byte_size||0),0);
 const formatBytes=(n:number)=>n<1024?Math.round(n)+" B":n<1024**2?Math.round(n/1024)+" KB":Math.round(n/1024**2)+" MB";
 return <AppShell><div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-slate-400">Media</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Media library</h1><p className="mt-2 text-sm text-slate-500">{rows?.length??0} files · {formatBytes(totalBytes)} stored privately.</p></div><form action={cleanupOrphanMedia}><button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold">Clean orphan media</button></form></div>
  {params.error?<div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{params.error}</div>:null}
  <form className="mt-7 flex gap-2"><input name="q" defaultValue={params.q||""} placeholder="Search file name or MIME type…" className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm"/><button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Search</button></form>
  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{withUrls.map((item:any)=>{const name=String(item.storage_path).split("/").pop()||"Media";return <div key={item.storage_path} className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white"><div className="flex h-48 items-center justify-center bg-slate-50 p-4">{item.mime_type?.startsWith("image/")&&item.url?<img src={item.url} alt="" className="max-h-full max-w-full rounded-xl object-contain"/>:item.mime_type?.startsWith("audio/")&&item.url?<audio controls src={item.url} className="w-full"/>:item.mime_type?.startsWith("video/")&&item.url?<video controls src={item.url} className="max-h-full max-w-full rounded-xl"/>:<div className="text-center text-xs font-semibold text-slate-400">{item.mime_type||"FILE"}</div>}</div><div className="p-4"><p className="truncate text-sm font-semibold">{name}</p><p className="mt-1 text-xs text-slate-400">{item.mime_type||"application/octet-stream"} · {formatBytes(Number(item.byte_size||0))}{item.url?<MediaMetadata url={item.url} mimeType={item.mime_type||""}/>:null}</p><p className="mt-1 text-[11px] text-slate-400">{new Date(item.created_at).toLocaleString()}</p><div className="mt-4 flex justify-end gap-2"><a href={item.url} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold">Open</a><form action={deleteMedia.bind(null,item.storage_path)}><button className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">Delete</button></form></div></div></div>})}</div>
  {!withUrls.length?<div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">No media matches this search.</div>:null}
  <div className="mt-8"><Link href="/decks" className="text-sm font-semibold text-slate-700">Back to decks</Link></div>
 </div></AppShell>;
}
