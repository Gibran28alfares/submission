import { defineConfig } from 'vite';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  root: resolve(__dirname, 'src'),
  publicDir: resolve(__dirname, 'public'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  plugins: [
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      includeAssets: [
        'favicon.png',
        'images/icon-192.png',
        'images/icon-512.png',
        'images/maskable-icon.png'
      ],

      manifest: {
        id: "com.storyapp.disaster",
        name: "StoryApp - Disaster Reporting",
        short_name: "StoryApp",
        description: "Platform pelaporan bencana real-time untuk masyarakat.",
        theme_color: "#141414",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/images/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/images/icon-512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "/images/maskable-icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },

      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
