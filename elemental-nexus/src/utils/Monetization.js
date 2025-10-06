import { Capacitor } from '@capacitor/core';

let iapPluginPromise;
let admobPluginPromise;

function loadIapPlugin() {
  if (!iapPluginPromise) {
    if (!Capacitor?.isNativePlatform?.()) {
      iapPluginPromise = Promise.resolve(null);
    } else {
      iapPluginPromise = import('@robingenz/capacitor-iap').then((module) => module.IAPPlugin).catch(() => null);
    }
  }
  return iapPluginPromise;
}

function loadAdMob() {
  if (!admobPluginPromise) {
    if (!Capacitor?.isNativePlatform?.()) {
      admobPluginPromise = Promise.resolve(null);
    } else {
      admobPluginPromise = import('@capacitor-community/admob').then((module) => module.AdMob).catch(() => null);
    }
  }
  return admobPluginPromise;
}

export async function purchaseEnergyPack(productId) {
  const plugin = await loadIapPlugin();
  if (!plugin) {
    return { success: false, reason: 'iap-unavailable' };
  }
  await plugin.connect();
  const result = await plugin.purchase({ productId });
  return { success: result?.transactionReceipt != null };
}

export async function purchaseTheme(productId) {
  return purchaseEnergyPack(productId);
}

export async function showRewardedAd(adUnitId) {
  const plugin = await loadAdMob();
  if (!plugin) {
    return { success: false, reason: 'ads-unavailable' };
  }
  await plugin.requestConsentInfo();
  await plugin.prepareRewardVideoAd({ adId: adUnitId });
  const result = await plugin.showRewardVideoAd();
  return { success: result?.rewardAmount != null };
}
