const VERSION="shyraq-v2";
const SHELL_CACHE=VERSION+"-shell";
const RUNTIME_CACHE=VERSION+"-runtime";
const APP_SHELL=["/offline","/favicon.ico"];

self.addEventListener("install",event=>{
 event.waitUntil(caches.open(SHELL_CACHE).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate",event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==SHELL_CACHE&&key!==RUNTIME_CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener("sync",event=>{
 if(event.tag!=="shyraq-sync")return;
 event.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(clients=>clients.forEach(client=>client.postMessage({type:"shyraq-sync-request"}))).catch(()=>{}));
});

self.addEventListener("fetch",event=>{
 const request=event.request;
 if(request.method!=="GET")return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin)return;

 const isRsc=request.headers.get("accept")?.includes("text/x-component")||url.searchParams.has("_rsc");
 if(url.pathname.startsWith("/_next/")||request.destination==="style"||request.destination==="script"||request.destination==="font"||request.destination==="image"||isRsc){
  event.respondWith(caches.match(request).then(hit=>{
   const network=fetch(request).then(response=>{
    if(response.ok){const copy=response.clone();void caches.open(RUNTIME_CACHE).then(cache=>cache.put(request,copy));}
    return response;
   }).catch(()=>hit||new Response("",{status:503}));
   return hit||network;
  }));
  return;
 }

 if(request.mode==="navigate"){
  event.respondWith(fetch(request).then(response=>{
   const copy=response.clone();
   void caches.open(RUNTIME_CACHE).then(cache=>cache.put(request,copy));
   return response;
  }).catch(()=>caches.match(request).then(hit=>hit||caches.match("/offline"))));
 }
});