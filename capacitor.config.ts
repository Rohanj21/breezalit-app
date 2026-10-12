import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.breezalit.app',
  appName: 'Breezalit',
  webDir: 'dist',
  // Enable native HTTP — all fetch() calls in the WebView go through
  // the native networking layer, completely bypassing CORS restrictions.
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
  // Uncomment the server block below for live-reload during development:
  // server: {
  //   url: 'http://192.168.1.20:5173',
  //   cleartext: true
  // }
};

export default config;