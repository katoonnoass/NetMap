const CACHE='netmap-v1';
const PRECACHE=['/','/static/app.css','/static/app-core.js','/static/app-auth.js','/static/app-map.js','/static/app-management.js','/static/app-views.js','/static/app-shell.js','/static/app-workflows.js'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(PRECACHE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  if(e.request.url.includes('/api/')) return;
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{
    if(resp.ok&&resp.type==='basic'){
      const cl=resp.clone();
      caches.open(CACHE).then(c=>c.put(e.request,cl));
    }
    return resp;
  }).catch(()=>caches.match('/'))));
});
