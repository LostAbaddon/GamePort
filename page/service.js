const CacheName = 'gameport-v1';
const CacheUrl = [
	'/',

	'/favicon.ico',
	'/webapp.json',
	'/index.html',
	'/ballcrush.html',
	'/elixir.html',

	'/img/favicon-32x32.png',
	'/img/logo.png',
	'/img/ballcrush.png',
	'/img/elixir.png',

	'/js/cache.js',
	'/js/connector.js',
	'/js/entrance.js',
	'/js/ballcrush.js',
	'/js/elixir.js',
];
const TagModify = 'last-modified';
const channel = new BroadcastChannel('service-messages');

const cacheResource = (req, res) => new Promise(done => {
	caches.open(CacheName).then(cache => {
		cache.put(req, res).then(done);
	});
});
const sendMessage = msg => {
	channel.postMessage(msg);
};

self.addEventListener('install', evt => {
	evt.waitUntil(new Promise(async res => {
		await caches.delete(CacheName);
		var cache = await caches.open(CacheName);
		await cache.addAll(CacheUrl);
		res();
	}));
});
self.addEventListener('fetch', evt => {
	evt.respondWith(caches.match(evt.request).then(cache => {
		var cacheAt = 0;
		if (cache) {
			let last = cache.headers.get(TagModify);
			if (!!last) {
				try {
					last = new Date(last);
					cacheAt = last.getTime();
				} catch {}
			}
		}

		var remote = fetch(evt.request).then(res => {
			var noCache = true;
			if (evt.request.method === 'GET') {
				let url = new URL(evt.request.url);
				if (url.protocol === 'http:' || url.protocol === 'https:') {
					if (CacheUrl.indexOf(url.pathname) >= 0) {
						noCache = false;
					}
				}
			}
			if (noCache) return res;

			var stamp = 0;
			var last = res.headers.get(TagModify);
			if (!!last) {
				try {
					last = new Date(last);
					stamp = last.getTime();
				} catch {}
			}
			if (stamp > cacheAt) {
				let clone = res.clone();
				cacheResource(evt.request, clone).then(() => {
					setTimeout(() => {
						sendMessage({
							event: 'cacheUpdated',
							url: evt.request.url,
							timestamp: stamp,
							lastCache: cacheAt,
						});
					}, 1000);
				});
			}
			return res;
		}).catch(e => {});

		return cache || remote;
	}));
});
channel.addEventListener('message', evt => {
	var msg = evt.data;
	console.log(msg);
});