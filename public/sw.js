const CACHE = 'artwalk-2026-v2';
const ASSETS = ['/', '/index.html', '/styles.css', '/app.js', '/domain.js', '/stops.json', '/icon.svg', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png', '/manifest.webmanifest', '/vendor/leaflet.js', '/vendor/leaflet.css', '/vendor/images/layers.png', '/vendor/images/layers-2x.png', '/vendor/images/marker-icon.png', '/vendor/images/marker-icon-2x.png', '/vendor/images/marker-shadow.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('artwalk-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  // Third-party map tiles use normal browser caching, never offline prefetching.
  if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).catch(()=>caches.match('/index.html')));return;
  }
  if(url.pathname==='/stops.json'){
    event.respondWith((async()=>{
      try{const response=await fetch(event.request,{signal:AbortSignal.timeout(3500)});if(!response.ok)throw Error('Data unavailable');const cache=await caches.open(CACHE);await cache.put('/stops.json',response.clone());return response;}
      catch{const cached=await caches.match('/stops.json');return cached||new Response('Offline guide not downloaded',{status:503});}
    })());return;
  }
  if(ASSETS.includes(url.pathname))event.respondWith(caches.match(url.pathname).then(cached=>cached||fetch(event.request)));
});
