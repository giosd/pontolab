// PontoLab Service Worker — cache de shell + página offline.
// Não armazena dados sensíveis, sessão ou registros do usuário.

const CACHE_VERSION = "pontolab-v1";
const OFFLINE_URL = "/offline";

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isCacheableStaticAsset(url) {
  return (
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname === "/manifest.webmanifest"
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  // Nunca cachear rotas de dados/sessão/API/server actions.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/login") ||
    url.search.includes("_rsc")
  ) {
    return;
  }

  // Navegações: network-first com fallback para página offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((cached) => cached ?? Response.error()),
      ),
    );
    return;
  }

  // Estáticos: cache-first (stale-while-revalidate simplificado).
  if (isCacheableStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const copy = response.clone();
              caches
                .open(CACHE_VERSION)
                .then((cache) => cache.put(request, copy))
                .catch(() => undefined);
            }
            return response;
          })
          .catch(() => cached);

        return cached ?? network;
      }),
    );
  }
});
