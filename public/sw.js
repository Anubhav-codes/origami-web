/* Offline support: hashed build assets are cache-first (they never change); pages are network-first. */
const CACHE = 'fold-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const put = (res) => {
    if (res.ok) {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
    }
    return res;
  };
  if (/\/assets\//.test(req.url)) e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then(put)));
  else e.respondWith(fetch(req).then(put).catch(() => caches.match(req).then((hit) => hit || caches.match('./'))));
});
