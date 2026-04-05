import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.axion.crm',
  appName: 'CRM by Axion',
  webDir: 'out',  // ← change from 'public' to 'out'
  server: {
    url: 'https://axions-crm.vercel.app/',
    cleartext: true,
    allowNavigation: ["*"]
  }
};