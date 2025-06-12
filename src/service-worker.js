import { build, files, version } from '$service-worker';

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

const ASSETS = [
	...build, // the app itself
	...files  // everything in `static`
];

self.addEventListener('install', (event) => {
	// Create a new cache and add all files to it
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
	}

	event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event) => {
	// Remove previous cached data from disk
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) await caches.delete(key);
		}
	}

	event.waitUntil(deleteOldCaches());
});

self.addEventListener('fetch', (event) => {
	// ignore POST requests etc
	if (event.request.method !== 'GET') return;

	async function respond() {
		const url = new URL(event.request.url);
		const cache = await caches.open(CACHE);

		// `build`/`files` can always be served from the cache
		if (ASSETS.includes(url.pathname)) {
			return cache.match(url.pathname);
		}

		// for everything else, try the network first, but
		// fall back to the cache if we're offline
		try {
			const response = await fetch(event.request);

			if (response.status === 200) {
				cache.put(event.request, response.clone());
			}

			return response;
		} catch {
			return cache.match(event.request);
		}
	}

	event.respondWith(respond());
});

// Push notification handling
self.addEventListener('push', (event) => {
	if (event.data) {
		const data = event.data.json();
		
		const options = {
			body: data.body,
			icon: '/icons/icon-192x192.png',
			badge: '/icons/icon-72x72.png',
			vibrate: [100, 50, 100],
			data: {
				dateOfArrival: Date.now(),
				primaryKey: data.primaryKey || 1
			},
			actions: data.actions || []
		};

		event.waitUntil(
			self.registration.showNotification(data.title, options)
		);
	}
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
	event.notification.close();

	if (event.action === 'accept') {
		// Handle accept action
		event.waitUntil(
			clients.openWindow('/booking/accept?id=' + event.notification.data.primaryKey)
		);
	} else if (event.action === 'decline') {
		// Handle decline action
		event.waitUntil(
			clients.openWindow('/booking/decline?id=' + event.notification.data.primaryKey)
		);
	} else {
		// Default action - open the app
		event.waitUntil(
			clients.openWindow('/')
		);
	}
});
