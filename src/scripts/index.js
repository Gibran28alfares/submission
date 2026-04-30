import '../styles/styles.css';
import { createIcons, Menu, LogOut, Bell, BellOff, Download } from 'lucide';
import App from './pages/app';
import PushHelper from './utils/push-helper';
import SyncHelper from './utils/sync-helper';
import { showMessage } from './utils/index';
import CONFIG from './config';
import StoryApi from './data/api';

document.addEventListener('DOMContentLoaded', async () => {
  createIcons({
    icons: { Menu, LogOut, Bell, BellOff, Download }
  });

  // PWA Install Prompt handling
  let deferredPrompt;
  const installItem = document.querySelector('#install-item');
  const installBtn = document.querySelector('#btn-install');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installItem?.classList.remove('hidden');
  });

  installBtn?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    deferredPrompt = null;
    installItem?.classList.add('hidden');
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installItem?.classList.add('hidden');
    showMessage('Terima kasih telah memasang StoryApp!');
  });
  
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });
  
  await app.renderPage();

  // Sync offline data
  SyncHelper.syncPendingStories();

  window.addEventListener('online', () => {
    SyncHelper.syncPendingStories();
  });

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });

  // PWA Support (Managed by vite-plugin-pwa)
  // Check if we are inside an iFrame
  if (window.self !== window.top) {
    console.warn('RUNNING INSIDE IFRAME: PWA Installation is blocked in this context. Please open the app in a new tab to see the Install button.');
  }

  // Debugging Helper: Log Status
  const logSystemStatus = async () => {
    const swStatus = 'serviceWorker' in navigator ? 'Supported' : 'Not Supported';
    const notificationPerm = Notification.permission;
    console.table({
      'Service Worker': swStatus,
      'Notification Permission': notificationPerm,
      'Context': window.self !== window.top ? 'Inside iFrame (Restrictions likely)' : 'Top Level',
      'Protocol': window.location.protocol
    });
    
    if (window.self !== window.top) {
      console.warn('RUNNING INSIDE IFRAME: Notifications are often blocked in this context. Please open in a new tab for testing.');
    }
  };
  logSystemStatus();

  // Notification Toggle Logic
  const setupNotificationToggle = async () => {
    const notifyBtn = document.querySelector('#btn-notification');
    if (!notifyBtn) return;

    try {
      const isSupported = await PushHelper.isSupported();
      if (!isSupported) {
        notifyBtn.style.display = 'none';
        return;
      }

      const updateButtonUI = (isSubscribed) => {
        notifyBtn.innerHTML = isSubscribed
          ? '<i data-lucide="bell" class="w-5 h-5"></i>'
          : '<i data-lucide="bell-off" class="w-5 h-5"></i>';

        if (isSubscribed) {
          notifyBtn.title = 'Matikan Notifikasi';
          notifyBtn.classList.add('text-blue-600');
        } else {
          notifyBtn.title = 'Aktifkan Notifikasi';
          notifyBtn.classList.remove('text-blue-600');
        }
        createIcons({ icons: { Bell, BellOff } });
      };

      const currentSubscription = await PushHelper.getSubscription();
      updateButtonUI(!!currentSubscription);

      notifyBtn.addEventListener('click', async () => {
        const token = localStorage.getItem(CONFIG.DEFAULT_TOKEN_KEY);
        if (!token) {
          showMessage('Silakan login terlebih dahulu untuk mengaktifkan notifikasi', true);
          return;
        }

        try {
          const subscription = await PushHelper.getSubscription();
          if (subscription) {
            // Unsubscribe from browser
            const result = await PushHelper.unsubscribeUser();
            if (result) {
              // Also notify server
              try {
                await StoryApi.unsubscribePush(token, subscription);
              } catch (e) {
                console.warn('Failed to notify server about unsubscribe', e);
              }
              showMessage('Notifikasi dinonaktifkan');
              updateButtonUI(false);
            }
          } else {
            // Check permission first
            let permission = PushHelper.checkPermission();
            if (permission === 'default') {
              permission = await Notification.requestPermission();
            }

            if (permission === 'denied') {
              showMessage('Notifikasi diblokir oleh browser. Harap aktifkan di pengaturan browser Anda.', true);
              return;
            }

            if (window.self !== window.top && permission === 'granted') {
              showMessage('Tips: Jika notifikasi tidak muncul, coba buka aplikasi di tab baru.', false);
            }

            // Subscribe from browser
            const publicVapidKey = CONFIG.PUSH_MSG_VAPID_PUBLIC_KEY; 
            const newSubscription = await PushHelper.subscribeUser(publicVapidKey);
            if (newSubscription) {
              // Send to server
              const response = await StoryApi.subscribePush(token, newSubscription);
              if (response.error) {
                throw new Error(response.message);
              }
              
              showMessage('Notifikasi diaktifkan');
              updateButtonUI(true);
              
              // Welcome Notification
              if (Notification.permission === 'granted') {
                const registration = await navigator.serviceWorker.ready;
                registration.showNotification('StoryApp', {
                  body: 'Terima kasih telah berlangganan notifikasi!',
                  icon: '/images/icon-192.png',
                  badge: '/favicon.png',
                  data: { url: '/#/' }
                });
              }
              
              console.log('Push Subscription:', JSON.stringify(newSubscription));
            }
          }
        } catch (error) {
          console.error('Failed to toggle push notification:', error);
          if (error.message.includes('permission denied')) {
            showMessage('Izin notifikasi ditolak. Harap izinkan notifikasi di browser Anda.', true);
          } else {
            showMessage(`Gagal mengubah pengaturan notifikasi: ${error.message}`, true);
          }
        }
      });
    } catch (error) {
      console.error('Notification Setup Error:', error);
      notifyBtn.style.display = 'none';
    }
  };

  await setupNotificationToggle();
});
