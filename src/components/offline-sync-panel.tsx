"use client";
import {useEffect,useState} from "react";
import {cacheMediaAsset,clearFailedMutations,getOfflineOverview,getSyncProgress as readProgress,listenToSyncProgress,syncAll} from "@/lib/sync/client";
import {deleteCachedMedia,getOfflineMedia,getSyncMeta} from "@/lib/offline/store";

type Device={id:string;name:string;last_seen_at:string;created_at:string};
type MediaItem={storage_path:string;mime_type:string;byte_size:number|null;signed_url:string|null};

export function OfflineSyncPanel({userId,devices}:{userId:string;devices:Device[]}){
 const [online,setOnline]=useState(typeof navigator==="undefined"?true:navigator.onLine);
 const [overview,setOverview]=useState({reviews:0,reviewCache:0,decks:0,cards:0,cardTemplates:0,tags:0,collections:0,mutations:0,mediaFiles:0,mediaBytes:0});
 const [meta,setMeta]=useState({cursor:0,lastSyncAt:null as string|null,lastError:null as string|null,lastAccepted:0,lastConflicts:0});
 const [progress,setProgress]=useState(readProgress());
 const [busy,setBusy]=useState(false);
 const [media,setMedia]=useState<MediaItem[]>([]);
 const [cachedPaths,setCachedPaths]=useState<Set<string>>(new Set());
 const [mediaBusy,setMediaBusy]=useState("");

 const refresh=async()=>{
  const [nextOverview,nextMeta]=await Promise.all([getOfflineOverview(),getSyncMeta(userId)]);
  setOverview(nextOverview);setMeta(nextMeta);
 };
 const loadMedia=async()=>{
  try{
   const response=await fetch("/api/sync?bootstrap=1",{cache:"no-store"});
   if(!response.ok)return;
   const data=await response.json() as {media?:MediaItem[]};
   setMedia((data.media??[]).slice(0,20));
   const entries=await Promise.all((data.media??[]).slice(0,20).map(async item=>[item.storage_path,Boolean(await getOfflineMedia(item.storage_path))] as const));
   setCachedPaths(new Set(entries.filter(([,cached])=>cached).map(([path])=>path)));
  }catch{}
 };

 useEffect(()=>{
  const onOnline=()=>setOnline(true),onOffline=()=>setOnline(false);
  window.addEventListener("online",onOnline);window.addEventListener("offline",onOffline);
  const stop=listenToSyncProgress(setProgress);
  void refresh();void loadMedia();
  return()=>{window.removeEventListener("online",onOnline);window.removeEventListener("offline",onOffline);stop();};
 },[userId]);

 const runSync=async()=>{
  if(!online)return;
  setBusy(true);
  try{await syncAll(userId);}catch{}finally{await refresh();await loadMedia();setBusy(false);}
 };
 const clearFailed=async()=>{await clearFailedMutations(userId);await refresh();};
 const cacheMedia=async(item:MediaItem)=>{
  if(!item.signed_url)return;
  setMediaBusy(item.storage_path);
  try{await cacheMediaAsset(userId,item.storage_path,item.signed_url,item.storage_path.split("/").pop()||"media");setCachedPaths(prev=>new Set(prev).add(item.storage_path));await refresh();}catch{}finally{setMediaBusy("");}
 };
 const removeMedia=async(path:string)=>{setMediaBusy(path);try{await deleteCachedMedia(path);setCachedPaths(prev=>{const next=new Set(prev);next.delete(path);return next;});await refresh();}finally{setMediaBusy("");}};
 const formatBytes=(bytes:number)=>bytes<1024?"0 KB":bytes<1024**2?Math.round(bytes/1024)+" KB":Math.round(bytes/1024**2)+" MB";

 return <div className="mt-8 space-y-5">
  <div className="grid gap-4 sm:grid-cols-3">
   <Metric label="Connection" value={online?"Online":"Offline"} detail={online?"Automatic sync enabled":"Changes stay local until reconnect"}/>
   <Metric label="Local mirror" value={overview.decks+" decks · "+overview.cards+" cards · "+overview.cardTemplates+" templates"} detail={overview.mutations+" pending changes"}/>
   <Metric label="Last sync" value={meta.lastSyncAt?new Date(meta.lastSyncAt).toLocaleTimeString():"Never"} detail={"Cursor "+meta.cursor}/>
  </div>
  <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
   <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">Sync health</p><p className="mt-1 text-sm text-slate-400">{meta.lastError||progress.message||"No sync errors recorded."}</p></div><button onClick={()=>void runSync()} disabled={!online||busy} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">{busy?"Syncing…":"Sync now"}</button></div>
   {progress.phase!=="idle"&&progress.phase!=="done"?<div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-slate-950 transition-all" style={{width:(progress.total?Math.min(100,progress.completed/progress.total*100):8)+"%"}}/></div>:null}
   <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><Info label="Uploaded" value={String(meta.lastAccepted)}/><Info label="Conflicts" value={String(meta.lastConflicts)}/><Info label="Pending mutations" value={String(overview.mutations)}/></div>
  </div>
  <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
   <div className="flex items-center justify-between gap-3"><div><p className="font-semibold">Offline storage</p><p className="mt-1 text-sm text-slate-400">{overview.mediaFiles} cached media files · {formatBytes(overview.mediaBytes)}</p></div><button onClick={()=>void clearFailed()} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Clear failed queue</button></div>
   <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-7"><Info label="Reviews" value={String(overview.reviews)}/><Info label="Cards" value={String(overview.cards)}/><Info label="Templates" value={String(overview.cardTemplates)}/><Info label="Tags" value={String(overview.tags)}/><Info label="Collections" value={String(overview.collections)}/><Info label="Decks" value={String(overview.decks)}/><Info label="Mutations" value={String(overview.mutations)}/><Info label="Media" value={String(overview.mediaFiles)}/></div>
   <StorageMeter/>
  </div>
  <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
   <div className="flex items-center justify-between gap-3"><div><p className="font-semibold">Media cache</p><p className="mt-1 text-sm text-slate-400">Keep frequently used private media available without a connection.</p></div><button onClick={()=>void loadMedia()} disabled={!online} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold disabled:opacity-40">Refresh media</button></div>
   <div className="mt-4 divide-y divide-slate-100">{media.length?media.map(item=>{const cached=cachedPaths.has(item.storage_path);return <div key={item.storage_path} className="flex items-center justify-between gap-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{item.storage_path.split("/").pop()||"Media"}</p><p className="text-xs text-slate-400">{item.mime_type||"file"} · {item.byte_size?formatBytes(item.byte_size):"size unknown"}</p></div>{cached?<button onClick={()=>void removeMedia(item.storage_path)} disabled={mediaBusy===item.storage_path} className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold">{mediaBusy===item.storage_path?"Removing…":"Remove"}</button>:<button onClick={()=>void cacheMedia(item)} disabled={!online||!item.signed_url||mediaBusy===item.storage_path} className="shrink-0 rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">{mediaBusy===item.storage_path?"Caching…":"Cache"}</button>}</div>}):<p className="py-3 text-sm text-slate-400">No private media found.</p>}</div>
  </div>
  <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
   <div className="flex items-center justify-between gap-3"><div><p className="font-semibold">Devices</p><p className="mt-1 text-sm text-slate-400">Recent devices that have synced review activity.</p></div><a href="/api/sync/diagnostics" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Export diagnostics</a></div>
   <div className="mt-4 divide-y divide-slate-100">{devices.length?devices.map(device=><div key={device.id} className="flex items-center justify-between py-3"><div><p className="text-sm font-medium">{device.name||"Web browser"}</p><p className="text-xs text-slate-400">{device.id.slice(0,8)}…</p></div><p className="text-xs text-slate-400">{new Date(device.last_seen_at).toLocaleString()}</p></div>):<p className="py-3 text-sm text-slate-400">No sync devices recorded yet.</p>}</div>
  </div>
 </div>;
}

function StorageMeter(){const [value,setValue]=useState<{usage:number;quota:number}|null>(null);useEffect(()=>{const storage=navigator.storage;if(!storage?.estimate)return;void storage.estimate().then(x=>setValue({usage:Number(x.usage||0),quota:Number(x.quota||0)}));},[]);if(!value?.quota)return null;const percent=Math.min(100,value.usage/value.quota*100);return <div className="mt-5"><div className="flex justify-between text-xs text-slate-400"><span>Browser storage usage</span><span>{Math.round(percent)}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-slate-950" style={{width:percent+"%"}}/></div></div>}
function Metric({label,value,detail}:{label:string;value:string;detail:string}){return <div className="rounded-2xl border border-black/[0.06] bg-white p-5"><p className="text-xs uppercase tracking-[0.12em] text-slate-400">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></div>}
function Info({label,value}:{label:string;value:string}){return <div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] uppercase tracking-[0.1em] text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>}
