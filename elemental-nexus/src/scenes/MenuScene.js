import { saveState } from '../utils/Storage.js';
import { playSfx } from '../assets/sounds/index.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const state = this.registry.get('game-state');
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#050713');

    this.add.text(width / 2, height * 0.25, 'Elemental Nexus', {
      fontFamily: 'Orbitron',
      fontSize: `${Math.round(Math.min(width, height) * 0.08)}px`,
      color: '#5af7ff'
    }).setOrigin(0.5).setShadow(0, 0, '#0ff', 20, true, true);

    this.add.text(width / 2, height * 0.35, `Discovered ${state.discovered.size} / 176`, {
      fontFamily: 'Rajdhani',
      fontSize: '22px',
      color: '#d8fbff'
    }).setOrigin(0.5);

    this.createButton(width / 2, height * 0.5, 'Start Synthesis', () => {
      playSfx(this, 'discover');
      this.scene.start('GameScene');
      this.scene.launch('UIScene');
    });

    this.createButton(width / 2, height * 0.6, 'Tutorial', () => {
      playSfx(this, 'discover');
      this.scene.launch('TutorialScene');
    });

    this.createButton(width / 2, height * 0.7, 'Settings', () => {
      playSfx(this, 'discover');
      this.openSettings(state);
    });

    this.createButton(width / 2, height * 0.8, 'Reset Universe', async () => {
      playSfx(this, 'fail');
      state.resetUniverse();
      await saveState(state.toJSON());
      this.scene.restart();
    });
  }

  createButton(x, y, label, handler) {
    const button = this.add.text(x, y, label, {
      fontFamily: 'Rajdhani',
      fontSize: '24px',
      color: '#0a0a0a',
      backgroundColor: '#2fffd7',
      padding: { left: 24, right: 24, top: 12, bottom: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      button.setScale(1.05);
      button.setStyle({ backgroundColor: '#51ffe7' });
    });
    button.on('pointerout', () => {
      button.setScale(1);
      button.setStyle({ backgroundColor: '#2fffd7' });
    });
    button.on('pointerdown', handler);
    return button;
  }

  openSettings(state) {
    const { width, height } = this.scale;
    const backdrop = this.add.rectangle(width / 2, height / 2, width * 0.7, height * 0.5, 0x02030f, 0.95).setStrokeStyle(2, 0x2fffd7, 0.6);
    const title = this.add.text(width / 2, height * 0.4, 'Settings', {
      fontFamily: 'Orbitron',
      fontSize: '28px',
      color: '#5efcff'
    }).setOrigin(0.5);

    const themeButton = this.add.text(width / 2, height * 0.5, `Theme: ${state.theme}`, {
      fontFamily: 'Rajdhani',
      fontSize: '22px',
      color: '#0a0a0a',
      backgroundColor: '#2fffd7',
      padding: { left: 20, right: 20, top: 10, bottom: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    themeButton.on('pointerdown', async () => {
      state.theme = state.theme === 'neon' ? 'aurora' : 'neon';
      themeButton.setText(`Theme: ${state.theme}`);
      await saveState(state.toJSON());
    });

    const close = this.add.text(width / 2, height * 0.6, 'Close', {
      fontFamily: 'Rajdhani',
      fontSize: '20px',
      color: '#0a0a0a',
      backgroundColor: '#2fffd7',
      padding: { left: 20, right: 20, top: 10, bottom: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const destroyPopup = () => {
      [backdrop, title, themeButton, close].forEach((obj) => obj.destroy());
    };

    close.on('pointerdown', destroyPopup);
  }
}
