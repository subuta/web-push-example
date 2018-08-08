self.addEventListener('push', function(event) {
  console.log('[Service Worker] Web Push Received.');
  console.log(`[Service Worker] Web Push had this data: "${event.data.text()}"`);

  const title = 'Web Push Example';
  const options = {
    body: 'Yay it works.',
    icon: 'images/icon_128x128.png'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  event.waitUntil(
    clients.openWindow('/example')
  );
});