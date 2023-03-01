
const _caches_name = 'v1.0.0';

function regExpURL(pathname, origin) {
    const url = new URL(pathname, origin);
    return '^' + url.href.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&') + '.*';
}

const addResourcesToCache = async (resources) => {
  const cache = await caches.open(_caches_name);
  await cache.addAll(resources);
};


self.addEventListener("install", (event) => {
  event.waitUntil(
    addResourcesToCache([
      "/index.html",

      "/assets/css/style.css",

      "/assets/js/db.mjs",
      "/assets/js/db-extra.mjs",
      "/assets/js/main.mjs",
      "/assets/js/roulette.mjs",
      "/assets/js/util.mjs",
    ])
  );
});


const deleteCache = async key => {
  await caches.delete(key)
}

const deleteOldCaches = async () => {
   const cacheKeepList = [_caches_name];
   const keyList = await caches.keys()
   const cachesToDelete = keyList.filter(key => !cacheKeepList.includes(key))
   await Promise.all(cachesToDelete.map(deleteCache));
}

self.addEventListener('activate', (event) => {
  event.waitUntil(deleteOldCaches());
});

const putInCache = async (request, response) => {
  const cache = await caches.open(_caches_name);
  await cache.put(request, response);
}

async function fetchOrEmpty(request) {
    let response;
    try {
        response = await fetch(request);
    } catch(e) {
        response = new Response('[]', {
            headers: { 'Content-Type': 'application/json' },
        });
    }

    return response;
}

/*
async function _search_fallback(request) {
    const responseFromNetwork = await fetch(request);
    if (responseFromNetwork.ok) {
        return responseFromNetwork;
    }

    const responseFromCache = await caches.match("/assets/index/index.ndjson.gz");
    return responseFromCache;
}
*/

const cacheFirst = async (request) => {
    const responseFromCache = await caches.match(request);
    if (responseFromCache) {
      return responseFromCache;
    }

    try {
        const responseFromNetwork = await fetch(request);
        putInCache(request, responseFromNetwork.clone())
        return responseFromNetwork;
    } catch(e) {
        const url = new URL(request.url);

        const fallbackResponseFromCache = await caches.match(url.pathname);
        if (fallbackResponseFromCache) {
          return fallbackResponseFromCache;
        }

        try {
            const fallbackResponseFromNetwork = await fetch(url.pathname);
            putInCache(request, fallbackResponseFromNetwork.clone())
            return fallbackResponseFromNetwork;
        } catch(err) {
            return new Response('Network error happened', {
                status: 408,
                headers: { 'Content-Type': 'text/plain' },
            });
        }
    }

};

self.addEventListener('fetch', (event) => {
    let re = new RegExp(regExpURL('post', location.origin));
    if (re.test(event.request.url)) {
        event.respondWith(fetchOrEmpty(event.request));
    } else {
        event.respondWith(cacheFirst(event.request));
    }
});
