import Phaser from 'phaser';
import iconsManifest from '../assets/icons/manifest.json';
import discoverSfx from '../assets/sounds/discover.js';
import failSfx from '../assets/sounds/fail.js';
import levelupSfx from '../assets/sounds/levelup.js';
import sparkParticle from '../assets/particles/spark.js';
import { BASE_ELEMENTS, COMBOS, AGES } from '../utils/Combos';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const { width, height } = this.cameras.main;

    const progressBg = this.add.rectangle(width / 2, height / 2, width * 0.6, 30, 0x190028, 0.8)
      .setStrokeStyle(3, 0x4d1fff, 0.7)
      .setOrigin(0.5);
    const progressBar = this.add.rectangle(progressBg.x - progressBg.width / 2, progressBg.y, 10, 20, 0x6f4aff)
      .setOrigin(0, 0.5);

    const loadingText = this.add.text(width / 2, progressBg.y - 60, 'Initializing Nexus...', {
      fontFamily: 'Montserrat',
      fontSize: '36px',
      color: '#a7f7ff',
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      progressBar.width = progressBg.width * value;
      loadingText.setText(`Booting Elemental Nexus ${Math.floor(value * 100)}%`);
    });

    this.load.on('complete', () => {
      this.registry.set('baseElements', BASE_ELEMENTS);
      this.registry.set('combos', COMBOS);
      this.registry.set('ages', AGES);
      this.scene.start('MenuScene');
    });

    this.load.audio('sfx-discover', [discoverSfx]);
    this.load.audio('sfx-fail', [failSfx]);
    this.load.audio('sfx-levelup', [levelupSfx]);

    this.load.image('particle-spark', sparkParticle);

    const iconsContext = require.context('../assets/icons', false, /\.svg$/);
    iconsManifest.elements.forEach((name) => {
      const key = `icon-${name.replace(/\s/g, '_')}`;
      const fileName = `${name.replace(/\s/g, '_')}.svg`;
      const path = iconsContext(`./${fileName}`);
      this.load.svg(key, path, { scale: 1 });
    });
  }
}
