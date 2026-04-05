import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.axion.crm',
  appName: 'CRM by Axion',
  webDir: 'www',
  server: {
    url: 'https://axions-crm.vercel.app/',
    cleartext: true,
    allowNavigation: ["*"],
    androidScheme: 'https'
  }
};

export default config;