const CACHE_NAME="shyraq-shell-v1";
const APP_SHELL=["/offline","/dashboard","/decks","/review","/settings/sync","/favicon.ico"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",event=>{event.waitUntil(self.clients.claim());});
self.addEventListener("sync",event=>{if(event.tag==="shyraq-sync"){event.waitUntil(fetch("/api/health",{cache:"no-store"}).catch(()=>{}));}});
self.addEventListener("fetch",event=>{
 const request=event.request;
 if(request.method!=="GET")return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin)return;
 if(url.pathname.startsWith("/_next/")){
  event.respondWith(caches.match(request).then(hit=>hit||fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));return response;})));
  return;
 }
 if(request.mode==="navigate"){
  event.respondWith(fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));return response;}).catch(()=>caches.match(request).then(hit=>hit||caches.match("/offline"))));
 }
});