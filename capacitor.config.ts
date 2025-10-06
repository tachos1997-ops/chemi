import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.neonforge.elementalnexus',
  appName: 'Elemental Nexus',
  webDir: 'www',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    },
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/ElementalNexus',
      androidIsEncryption: false
    },
    IAPPlugin: {
      autoFinishTransactions: true
    },
    AdMob: {
      bannerAdUnitId: 'ca-app-pub-3940256099942544/6300978111',
      interstitialAdUnitId: 'ca-app-pub-3940256099942544/1033173712',
      rewardAdUnitId: 'ca-app-pub-3940256099942544/5224354917'
    }
  }
};

export default config;
