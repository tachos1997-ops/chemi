# Elemental Nexus

Elemental Nexus is a cyber-fantasy neon alchemy puzzle built with Phaser 3 and bundled for mobile stores with Capacitor. Players begin with four primal elements and synthesize over one hundred discoveries across six Ages while balancing an energy economy, unlock progression, and cosmetic rewards.

## Project structure

```
elemental-nexus/
├── src/
│   ├── main.js
│   ├── scenes/
│   │   ├── BootScene.js
│   │   ├── MenuScene.js
│   │   ├── GameScene.js
│   │   ├── UIScene.js
│   │   └── TutorialScene.js
│   ├── assets/
│   │   ├── icons/
│   │   ├── sounds/
│   │   └── particles/
│   └── utils/
│       └── Combos.js
├── capacitor.config.ts
├── package.json
├── webpack.config.js
└── www/
```

## Getting started

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Start the development server**
   ```bash
   npm run dev
   ```
   This launches Webpack Dev Server with hot reload on `http://localhost:8080`.
3. **Run production build**
   ```bash
   npm run build
   ```
   Outputs optimized assets to `dist/` and copies them into `www/` for Capacitor.
4. **Sync with Capacitor**
   ```bash
   npx cap sync
   ```
   Make sure iOS and Android platforms are added first via `npx cap add ios` and/or `npx cap add android`.

## Native builds

- `npm run ios` – builds the web bundle then opens the iOS project in Xcode.
- `npm run android` – builds the bundle then opens Android Studio.

Both scripts rely on Capacitor CLI and the official Capacitor SQLite, IAP, and AdMob plugins being installed in the native projects.

## Offline support

A lightweight service worker caches critical game files during the boot scene so Elemental Nexus remains playable offline after first load.

## Testing

Gameplay logic is covered by unit tests executed with `npm test` using Jest + jsdom. Tests validate the combination dictionary, energy regeneration, and persistence bridge fallbacks.

## Assets

All icons, sound cues, and particle textures are embedded as data URIs to keep the repository text-only while still providing polished visuals and audio.

## License

This project is provided as production-ready sample code. Update the bundle identifier and store metadata before publishing to the App Store or Google Play.
