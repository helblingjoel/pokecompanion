import { build, files, version } from '$service-worker';

// https://github.com/microsoft/TypeScript/issues/11781 - this is needed for TS and ESLint

/// env serviceworker
const globalThis = /** @type {unknown} */ (self);
/// <reference no-default-lib="true"/>
/// <reference lib="es2020" />
/// <reference lib="WebWorker" />
const sw = /** @type {ServiceWorkerGlobalScope & typeof globalThis} */ (globalThis);

const ASSETS = `assets-${version}`;
const REQUESTS = `requests-${version}`;

// `build` is an array of all the files generated by the bundler,
// `files` is an array of everything in the `static` directory
const staticAssets = build.concat(files);
const staticAssetUrls = staticAssets.map((a) => self.location.origin + a);

/** @param {ExtendableEvent} event */
function install_listener(event) {
	try {
		event.waitUntil(
			caches
				.open(ASSETS)
				.then((cache) => {
					cache.addAll(staticAssets).catch((err) => {
						console.log(`Failed to add asset to static cache - ${err}`);
					});
				})
				.catch((err) => {
					console.error('Error during installation:', err);
				})
		);
	} catch (err) {
		console.error('Error when installing service worker:', err);
	}
}

/** @param {ExtendableEvent} event */
function activate_listener(event) {
	try {
		event.waitUntil(
			caches.keys().then(async (keys) => {
				for (const key of keys) {
					if (key !== ASSETS) {
						await caches.delete(key);
					}
				}
				sw.clients.claim();
			})
		);
	} catch (err) {
		console.error('Error when activating service worker listener:', err);
		throw err;
	}
}

/**
 * Fetch the asset from the network and store it in the cache.
 * Fall back to the cache if the user is offline.
 * @param {RequestInfo} request
 * @param {string} cacheName
 */
async function networkFirst(request, cacheName = REQUESTS) {
	const cache = await caches.open(cacheName);

	try {
		const response = await fetch(request);

		if (response.status < 400) {
			cache.put(request, response.clone());
		}

		return response;
	} catch (err) {
		const cachedResponse = await cache.match(request);

		if (cachedResponse) {
			return cachedResponse;
		}

		if (!navigator.onLine) {
			return new Response('You are offline', {
				status: 523,
				statusText: 'Requested an online resource while offline'
			});
		}

		throw err;
	}
}

/**
 * Try to load an object from cache first, fall back to the network and cache it then
 * @param {RequestInfo} request
 */
async function cacheFirst(request, cacheName = REQUESTS) {
	const cache = await caches.open(cacheName);
	const cachedResponse = await cache.match(request);

	if (cachedResponse) {
		// Check if the cached response is older than 30 minutes
		const cacheAge = Date.now() - new Date(cachedResponse.headers.get('date')).getTime();
		const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds

		if (cacheAge > thirtyMinutes) {
			try {
				cache.delete(request);

				const networkResponse = await fetch(request);
				console.log('updating cached entry for', request);
				if (networkResponse.status < 400) {
					cache.put(request, networkResponse.clone());
				}
				return networkResponse;
			} catch (err) {
				return new Response({
					status: 503,
					statusText: 'Failed to connect to server'
				});
			}
		}

		return cachedResponse;
	}

	if (!navigator.onLine) {
		return new Response({
			status: 523,
			statusText: 'Requested an online resource while offline'
		});
	}

	try {
		const networkResponse = await fetch(request);
		if (networkResponse.status < 400) {
			cache.put(request, networkResponse.clone());
		}
		return networkResponse;
	} catch (err) {
		return new Response({
			status: 503,
			statusText: 'Failed to connect to server'
		});
	}
}

async function networkOnly(request) {
	if (!navigator.onLine) {
		return new Response({
			status: 523,
			statusText: 'Requested an online resource while offline'
		});
	}
	try {
		return await fetch(request);
	} catch (err) {
		console.log('error in network only', err);
		throw err;
	}
}

/** @param {FetchEvent} event */
async function fetch_listener(event) {
	const request = event.request;
	const url = new URL(request.url);

	// Don't cache any non-get requests
	if (event.request.method !== 'GET') {
		event.respondWith(networkOnly(request));
		return;
	}

	// Serve any static assets from cache first
	if (staticAssetUrls.includes(url.href)) {
		event.respondWith(cacheFirst(request, ASSETS));
		return;
	}

	// Always serve pokeapi from cache first
	if (url.hostname === 'pokeapi.co' || url.hostname === 'raw.githubusercontent.com') {
		event.respondWith(cacheFirst(request, REQUESTS));
		return;
	}

	if (url.hostname === self.location.hostname) {
		// Never cache protected routes
		if (
			url.pathname.includes('/auth/') ||
			url.pathname.includes('/api/') ||
			url.pathname.includes('/user/')
		) {
			event.respondWith(networkOnly(request));
			return;
		}

		if (url.pathname.startsWith('/src/lib/data')) {
			event.respondWith(cacheFirst(request));
			return;
		}
		// Try to get every other request fresh first - search should be cached in the future
		event.respondWith(networkFirst(request, REQUESTS));
		return;
	}

	event.respondWith(networkFirst(request, REQUESTS));
}

try {
	sw.addEventListener('install', install_listener);
	sw.addEventListener('activate', activate_listener);
	sw.addEventListener('fetch', fetch_listener);
} catch (err) {
	console.log(`failed to add event listeners with error`, err);
	throw err;
}
