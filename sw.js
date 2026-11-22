const CACHE="luke-beth-shopping-v22";
const CORE=["./","./index.html","./styles.css","./app.js","./manifest.webmanifest","./icon.svg","./icon-192.png","./icon-512.png"];
self.addEventListener("install",event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(CORE);})()));
self.addEventListener("activate",event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)));await self.clients.claim();})()));
self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET"||new URL(event.request.url).origin!==self.location.origin)return;
 const url=new URL(event.request.url);const isAppFile=url.pathname.endsWith("/")||/\.(html|js|css|webmanifest)$/.test(url.pathname);
 if(isAppFile){event.respondWith((async()=>{const cache=await caches.open(CACHE);try{const fresh=await fetch(event.request,{cache:"no-store"});if(fresh.ok)await cache.put(event.request,fresh.clone());return fresh;}catch(error){return (await cache.match(event.request))||Response.error();}})());return;}
 event.respondWith((async()=>{const cached=await caches.match(event.request);if(cached)return cached;const response=await fetch(event.request);if(response.ok){const cache=await caches.open(CACHE);cache.put(event.request,response.clone());}return response;})());
});

self.addEventListener("message",event=>{
 if(event.data&&event.data.type==="SKIP_WAITING")self.skipWaiting();
});
