import { Capacitor } from '@capacitor/core';

let IAPPlugin;
let AdsPlugin;

try {
  // Dynamically require so bundler includes plugin when available
  // eslint-disable-next-line global-require
  IAPPlugin = require('@capacitor-community/in-app-purchase');
} catch (err) {
  IAPPlugin = null;
}

try {
  // eslint-disable-next-line global-require
  AdsPlugin = require('@capacitor-community/admob');
} catch (err) {
  AdsPlugin = null;
}

class MonetizationServiceClass {
  constructor() {
    this.iapReady = false;
    this.platform = Capacitor.getPlatform();
    this.energyProducts = [
      { id: 'nexus_energy_small', amount: 10 },
      { id: 'nexus_energy_large', amount: 30 },
    ];
  }

  async init() {
    if (this.iapReady || !IAPPlugin?.InAppPurchase) return;
    try {
      await IAPPlugin.InAppPurchase.initialize({
        ios: {
          autoFinishTransactions: false,
        },
        android: {
          licenseKey: '',
        },
      });
      await IAPPlugin.InAppPurchase.getProducts({ productIds: this.energyProducts.map((p) => p.id) });
      this.iapReady = true;
    } catch (err) {
      console.warn('[MonetizationService] IAP initialization failed', err);
    }
  }

  async buyEnergyPack() {
    await this.init();
    if (!this.iapReady) {
      return null;
    }
    try {
      const product = this.energyProducts[0];
      const purchase = await IAPPlugin.InAppPurchase.purchase({ productId: product.id });
      if (purchase?.transactionId) {
        await IAPPlugin.InAppPurchase.finishTransaction({ transactionId: purchase.transactionId });
        return product.amount;
      }
      return null;
    } catch (err) {
      console.warn('[MonetizationService] purchase failed', err);
      return null;
    }
  }

  async showRewardedAd() {
    if (!AdsPlugin?.AdMob) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(5), 1500);
      });
    }
    try {
      await AdsPlugin.AdMob.prepareRewardVideoAd({
        adId: '',
        isTesting: true,
      });
      await AdsPlugin.AdMob.showRewardVideoAd();
      return 5;
    } catch (err) {
      console.warn('[MonetizationService] rewarded ad failed', err);
      return 0;
    }
  }

  async restorePurchases() {
    if (!this.iapReady) {
      await this.init();
    }
    if (!this.iapReady) return;
    try {
      await IAPPlugin.InAppPurchase.restorePurchases();
    } catch (err) {
      console.warn('[MonetizationService] restore failed', err);
    }
  }

  trackReset() {
    if (typeof window !== 'undefined') {
      const count = Number(window.localStorage.getItem('nexus-resets') || '0') + 1;
      window.localStorage.setItem('nexus-resets', String(count));
    }
  }
}

export const MonetizationService = new MonetizationServiceClass();
