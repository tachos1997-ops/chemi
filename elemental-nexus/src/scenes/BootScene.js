import Phaser from 'phaser';
import { generateIconAtlas } from '../assets/icons/generator.js';
import { ensureSparkParticle } from '../assets/particles/generator.js';
import { preloadAudio } from '../assets/sounds/index.js';
import { COMBOS, INITIAL_ELEMENTS } from '../utils/Combos.js';
import { loadState, saveState } from '../utils/Storage.js';
import { reviveState } from '../utils/GameState.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
    this.loadedState = null;
  }

  preload() {
    const { width, height } = this.scale;
    const progressBg = this.add.rectangle(width / 2, height / 2, width * 0.6, 20, 0x102033, 0.8);
    const progressBar = this.add.rectangle(width * 0.2, height / 2, 0, 14, 0x2fffd7, 1).setOrigin(0, 0.5);
    const progressText = this.add.text(width / 2, height / 2 + 30, 'Loading...', {
      fontFamily: 'Orbitron',
      fontSize: '16px',
      color: '#89f6ff'
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      progressBar.width = width * 0.6 * value;
      progressText.setText(`Loading ${(value * 100).toFixed(0)}%`);
    });

    preloadAudio(this);
    this.load.json('manifest', 'manifest.json');

    const keys = new Set(INITIAL_ELEMENTS);
    COMBOS.forEach((combo) => {
      keys.add(combo.result);
      combo.ingredients.forEach((ingredient) => keys.add(ingredient));
    });
    this.registry.set('texture-keys', Array.from(keys));

    this.load.once('complete', () => {
      progressBg.destroy();
      progressBar.destroy();
      progressText.destroy();
    });
  }

  async create() {
    const keys = this.registry.get('texture-keys');
    generateIconAtlas(this, keys);
    ensureSparkParticle(this);

    const stored = await loadState();
    const state = reviveState(stored);
    state.applyEnergyRegen();
    this.loadedState = state;
    this.registry.set('game-state', state);
    await saveState(state.toJSON());

    this.scene.start('MenuScene');
  }
}
