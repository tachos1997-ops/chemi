import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.elemental.nexus',
  appName: 'Elemental Nexus',
  webDir: 'www',
  bundledWebRuntime: false,
  ios: {
    contentInset: 'always',
    backgroundColor: '#02000f',
  },
  android: {
    backgroundColor: '#02000f',
    allowMixedContent: false,
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#02000f',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    InAppPurchase: {
      autoFinishTransactions: true,
    },
    AdMob: {
      appIdAndroid: 'ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy',
      appIdIos: 'ca-app-pub-xxxxxxxxxxxxxxxx~zzzzzzzzzz',
      margin: 0,
    },
  },
};

export default config;
