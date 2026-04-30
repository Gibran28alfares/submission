# Push Notifications Setup Guide

## Overview

Your StoryApp now has a complete push notification system using **Workbox with InjectManifest strategy**. This setup allows your server to send real-time push notifications to users.

## What Changed

### 1. **Service Worker Configuration** (`vite.config.js`)
- Changed from `GenerateManifest` to **`injectManifest`** strategy
- This allows proper handling of server-sent push events
- Service worker file location: `/src/sw.js`

### 2. **Service Worker Implementation** (`src/sw.js`)
The service worker includes:

#### **Push Event Handler**
```javascript
self.addEventListener('push', (event) => {
  // Receives server-sent notifications
  // Parses JSON payload from server
  // Displays native browser notification
});
```

#### **Notification Click Handler**
```javascript
self.addEventListener('notificationclick', (event) => {
  // Handles user clicking on notification
  // Focuses existing window or opens new one
});
```

#### **Notification Close Handler**
```javascript
self.addEventListener('notificationclose', (event) => {
  // Logs when user dismisses notification
});
```

#### **Precaching & Runtime Caching**
- Precaches essential app assets using `self.__WB_MANIFEST`
- Caches API responses (`story-api.dicoding.dev`) with NetworkFirst strategy
- Caches map tiles with StaleWhileRevalidate strategy
- Caches story images for offline viewing

## How Push Notifications Work

### Client-Side (Browser)
1. User clicks notification button in your app
2. Browser requests notification permission
3. `PushHelper.subscribeUser()` creates a subscription object
4. Subscription is sent to server via `StoryApi.subscribePush()`

### Server-Side (Backend)
1. Server stores the subscription object
2. When you want to send a notification:
   ```javascript
   // Server code example
   webpush.sendNotification(subscription, JSON.stringify({
     title: "Disaster Alert",
     body: "New story from your area",
     icon: "/images/icon-192.png"
   }));
   ```

### Service Worker (Background)
1. Service worker receives the `push` event from server
2. Parses the JSON payload
3. Calls `self.registration.showNotification()` to display it
4. Service worker is active even when app is closed!

## Testing Push Notifications

### In Development

#### Using DevTools (Recommended)
1. Open DevTools → **Application** tab
2. Go to **Service Workers**
3. Click the service worker entry
4. Scroll to **Push** section
5. Enter test notification JSON:
```json
{
  "title": "Test Notification",
  "body": "This is a test from DevTools"
}
```
6. Click **Push** button
7. You'll see the notification appear (or check DevTools console)

#### Using Your App UI
1. Make sure service worker is registered and running
2. Click the bell icon in your app
3. Grant notification permission when prompted
4. The app will show a welcome notification immediately
5. This confirms both client and server communication works

### Production Testing
To send real server-side push notifications:

1. **Setup your backend** to send push notifications using `web-push` library
2. **Store subscriptions** from users in your database
3. **Send notifications** using the stored subscription objects:

```bash
# Backend example (Node.js)
npm install web-push

# In your API
const webpush = require('web-push');
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

await webpush.sendNotification(userSubscription, JSON.stringify({
  title: "Breaking News",
  body: "New disaster report in your area",
  icon: "/images/icon-192.png"
}));
```

## Key Differences: Client vs Server Notifications

| Aspect | Client-Side | Server-Side |
|--------|------------|------------|
| Trigger | App code (JavaScript) | Backend API |
| Requires Service Worker | ❌ No | ✅ Yes |
| Works when app closed | ❌ No | ✅ Yes |
| User sees notification | Only in active tab | Always (even offline) |
| Best for | Alerts in active session | Real-time alerts, breaking news |

## Testing Checklist

- [ ] Service Worker is registered (`Application > Service Workers`)
- [ ] Service Worker status shows "activated and running"
- [ ] Clicking bell icon requests notification permission
- [ ] Welcome notification appears when enabled
- [ ] DevTools > Application > Push can send test notifications
- [ ] Notification appears even when app is closed
- [ ] Clicking notification focuses/opens the app
- [ ] Console shows `[v0]` debug logs from service worker

## Important VAPID Keys

Your VAPID keys are already configured in:
- **Public Key**: `/src/config.js` as `PUSH_MSG_VAPID_PUBLIC_KEY`
- **Private Key**: Should be in `.env` file on server (never expose in frontend code)

These keys ensure:
- Only your server can send notifications to your users
- Each app has unique encryption keys
- Secure communication between server and browser

## Debugging

The service worker includes console.log statements prefixed with `[v0]`:
- Watch the DevTools > Console while testing
- Look for messages like `[v0] Push event received from server`
- Monitor for any JSON parsing errors

## File Structure

```
/src
├── sw.js                 ← Service worker (new)
├── scripts
│   ├── utils/push-helper.js    ← Client-side subscription logic
│   ├── data/api.js             ← API calls to server
│   └── index.js                ← Notification UI toggle
└── styles/
```

## Next Steps

1. **Test with DevTools** - Practice sending test notifications
2. **Setup Backend** - Implement push notification endpoint in your server
3. **Store Subscriptions** - Save user subscriptions in database
4. **Send Notifications** - Create API endpoint to trigger notifications
5. **Monitor Errors** - Check browser console and server logs during testing

## References

- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [Push API Specification](https://www.w3.org/TR/push-api/)
- [Web Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [Web Push Protocol](https://datatracker.ietf.org/doc/html/draft-thomson-webpush-protocol)
