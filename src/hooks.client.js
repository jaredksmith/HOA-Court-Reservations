// Client-side hooks for the HOA Court Reservations app

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then((registration) => {
      console.log('Service Worker registered successfully:', registration);
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error);
    });
}

// Request notification permission on app load
if ('Notification' in window && 'serviceWorker' in navigator) {
  // Check if notifications are already granted
  if (Notification.permission === 'default') {
    // We'll request permission when the user logs in or interacts with the app
    console.log('Notification permission not yet requested');
  } else if (Notification.permission === 'granted') {
    console.log('Notification permission already granted');
  } else {
    console.log('Notification permission denied');
  }
}
