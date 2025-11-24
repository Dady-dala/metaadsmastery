import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.bf9decc320f5491ba950a7d3c3e8322c',
  appName: 'metaadsmastery',
  webDir: 'dist',
  server: {
    url: 'https://bf9decc3-20f5-491b-a950-a7d3c3e8322c.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#22C55E',
      showSpinner: false
    }
  }
};

export default config;
