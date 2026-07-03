importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');


const CACHE_VERSION = 'v2';
const CACHE_NAME = `assets-${CACHE_VERSION}`;

workbox.routing.registerRoute(
  /\.(?:js|css|html|png|ico|json|bin)$/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: CACHE_NAME,
    plugins: [
      new workbox.expiration.ExpirationPlugin({ maxEntries: 50 })
    ]
  })
);


workbox.precaching.precacheAndRoute([
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/styles.css',
  '/assets/js/core/app.js',
  '/assets/js/core/config.js',
  '/assets/js/core/utils.js',
  '/assets/js/services/camera.service.js',
  '/assets/js/services/detection.service.js',
  '/assets/js/services/facts.service.js',
  '/assets/js/ui/ui.handler.js',
  '/model/model.json',
  '/model/weights.bin',
  '/model/metadata.json',
  '/assets/icons/apple-touch-icon.png',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
  '/assets/icons/favicon.ico'
]);