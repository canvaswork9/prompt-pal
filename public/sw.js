self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'FitDecide', {
      body:  data.body  || 'Time to check in!',
      icon:  data.icon  || '/icon-192.png',
      badge: data.badge || '/favicon-32.png',
      tag:   data.tag   || 'checkin-reminder',
      data:  { url: data.url || '/app' },
      actions: [
        { action: 'checkin', title: '⚡ Check in now' },
        { action: 'dismiss', title: 'Later' },
      ],
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const url = event.notification.data?.url || '/app';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
