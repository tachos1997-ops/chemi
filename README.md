# Elemental Nexus

Elemental Nexus is a cyber-fantasy neon alchemy puzzle built with Phaser 3 and packaged for iOS/Android with CapacitorJS. Forge more than 170 elements across six Ages, manage energy carefully, and push progression with legacy bonuses.

## Getting Started

```bash
npm install
npm run start
```

The dev server launches at `http://localhost:8080` and hot reloads scenes, UI, and assets.

## Production Build

```bash
npm run build
```

The optimized bundle is written to the `www/` directory which is also consumed by Capacitor when preparing native shells.

## Native Platforms

* `npm run ios` – builds the web bundle, copies it into the Capacitor iOS shell, and opens Xcode.
* `npm run android` – builds the web bundle, copies into the Android shell, and opens Android Studio.

Before running native targets ensure the respective Capacitor platforms are added:

```bash
npx cap add ios
npx cap add android
```

## Key Features

- 176 handcrafted combinations producing more than 170 unique elements with on-device SVG icons.
- Six distinct Ages with milestone unlocks, neon HUD, and particle-rich discovery feedback.
- Energy management system with regen timers, rewarded ads, and in-app purchases for refills.
- Offline-first persistence powered by Capacitor SQLite (with automatic browser fallback).
- Resettable universe runs that retain legacy energy bonuses for long-term replayability.
- Responsive UI supporting drag-and-drop (desktop) and tap-to-combine (mobile).

## Project Layout

```
src/
  main.js                 # Phaser bootstrap and viewport handling
  scenes/                 # Boot, Menu, Game, UI overlay, Tutorial scenes
  utils/                  # SQLite persistence + monetization bridges
  assets/                 # Auto-generated SVG icons, audio cues, particles
www/                      # Production bundle output
```

## Assets

All icons are procedurally generated SVGs stored on disk, ensuring offline availability. Particle textures and audio cues are generated via build scripts (`tools/generate_assets.py`).

## License

MIT © Elemental Nexus Studio
