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

### Prerequisites

- Node.js 18 or newer (LTS recommended)
- npm 9+
- Capacitor CLI (`npm install -g @capacitor/cli`) for native platform commands
- Xcode 14+ for iOS builds, Android Studio (with Android SDK) for Android builds

### 1. Install dependencies

```bash
npm install
```

### 2. Run the web build locally

```bash
npm run dev
```

This launches Webpack Dev Server with hot reload on `http://localhost:8080`. The game stores saves in your browser (IndexedDB/localStorage fallback) so you can test persistence without native shells.

### 3. Execute unit tests (optional but recommended)

```bash
npm test
```

Jest runs the combination catalog, energy regeneration, and storage bridge coverage.

### 4. Create a production bundle

```bash
npm run build
```

The optimized bundle is written to `dist/` and copied into `www/` so Capacitor can serve it in native shells.

### 5. Prepare Capacitor native projects

Add platforms once per machine:

```bash
npx cap add ios
npx cap add android
```

Sync web assets into the native projects whenever the bundle changes:

```bash
npx cap sync
```

### 6. Launch native projects

- **iOS:**
  ```bash
  npm run ios
  ```
  Opens Xcode with the generated workspace. Select a simulator or device, then run the app.
- **Android:**
  ```bash
  npm run android
  ```
  Opens Android Studio. Choose a virtual or physical device and hit Run.

Capacitor automatically bridges the SQLite, IAP, AdMob, and Splash Screen plugins declared in `capacitor.config.ts`. Replace the placeholder bundle identifiers and plugin configuration with your production values before submitting to the stores.

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
