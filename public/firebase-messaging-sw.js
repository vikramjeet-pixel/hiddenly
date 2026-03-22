importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// 1. Initialize Firebase centrally inside the SW isolating it from window/document
firebase.initializeApp({
  apiKey: "AIzaSyDtMi27-Ib0msYp9Pu8yLu8oaCICfBMV4E",
  authDomain: "vikram-480113.firebaseapp.com",
  projectId: "vikram-480113",
  storageBucket: "vikram-480113.firebasestorage.app",
  messagingSenderId: "28122479006",
  appId: "1:28122479006:web:d985aec56f833d1979be8f"
});

// 2. Bind the background messaging compat layer
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background Push Received:', payload);

  const notificationTitle = payload.notification?.title || 'Hidden Gems Alert';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new interaction.',
    icon: '/favicon.ico', // Update path if you have a custom 192x192 logo
    data: payload.data, // Contains the deep link variables
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 3. Listen to Notification click events to route Deep Links securely
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Extract URL natively passed from the Data payload of the Cloud Function
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if they are already browsing the target route
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise violently open a new navigation tab directly to the Gem link
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
