// Firebase Cloud Messaging Background Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyAnKH8UnhldVypvkn8bbUhNd-6QHI4TUeM",
  authDomain: "my-proj-c7766.firebaseapp.com",
  projectId: "my-proj-c7766",
  storageBucket: "my-proj-c7766.firebasestorage.app",
  messagingSenderId: "678737200251",
  appId: "1:678737200251:web:37a4f9edea209d1c894ede",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'PTE Study Alert';
  const notificationOptions = {
    body: payload.notification?.body || 'Check your dashboard for new updates!',
    icon: '/logo.png',
    badge: '/logo.png',
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click to focus or open window and navigate
self.addEventListener('notificationclick', (event) => {
  console.log('[FCM SW] Notification clicked:', event);
  event.notification.close();

  // Retrieve path from notification data payload
  let path = event.notification.data?.url || '/dashboard';

  // Extract base directory from service worker script path to support subpath bases
  const scriptPath = self.location.pathname; // e.g. "/Exam-Prep-Platform/firebase-messaging-sw.js"
  const swDir = scriptPath.substring(0, scriptPath.lastIndexOf('/')).replace(/\/$/, "");

  if (swDir && path.startsWith('/') && !path.startsWith(swDir + '/')) {
    path = swDir + path;
  }

  const targetUrl = new URL(path, self.location.origin).toString();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, navigate it and focus
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.navigate(targetUrl).then(c => c.focus());
        }
      }
      // If no window is open, open a new tab/window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
