import Phaser from 'phaser';
import { StorageService } from '../utils/Storage';
import { MonetizationService } from '../utils/Monetization';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.cameras.main.fadeIn(600, 0, 0, 0);
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width * 0.95, height * 0.95, 0x080022, 0.6)
      .setStrokeStyle(8, 0x4c00ff, 0.55)
      .setOrigin(0.5);

    this.add.text(width / 2, height * 0.23, 'Elemental Nexus', {
      fontFamily: 'Montserrat',
      fontSize: `${Math.round(height * 0.06)}px`,
      fontStyle: 'bold',
      color: '#ffffff',
      shadow: { color: '#00f0ff', fill: true, blur: 14, offsetX: 0, offsetY: 0 },
    }).setOrigin(0.5);

    const subtitle = this.add.text(width / 2, height * 0.29, 'Forge the Ages with Neon Alchemy', {
      fontFamily: 'Montserrat',
      fontSize: `${Math.round(height * 0.024)}px`,
      color: '#9ef7ff',
    }).setOrigin(0.5);
    subtitle.alpha = 0;
    this.tweens.add({ targets: subtitle, alpha: 1, duration: 1400, ease: 'Sine.easeInOut' });

    this.createButton(width / 2, height * 0.42, 'Start Synthesis', () => {
      this.scene.start('GameScene');
      this.scene.launch('UIScene');
    });

    this.createButton(width / 2, height * 0.52, 'Tutorial', () => {
      this.scene.start('TutorialScene');
    });

    this.createButton(width / 2, height * 0.62, 'Settings', () => {
      this.openSettings();
    });

    this.createButton(width / 2, height * 0.72, 'Restore Purchases', () => {
      MonetizationService.restorePurchases();
      this.sound.play('sfx-discover', { volume: 0.4 });
    });

    StorageService.init()
      .then(() => StorageService.loadGame())
      .then((saved) => {
        if (saved && saved.discovered?.length) {
          const resumeButton = this.createButton(width / 2, height * 0.82, 'Resume Universe', () => {
            this.scene.start('GameScene', { restored: true });
            this.scene.launch('UIScene');
          });
          resumeButton.setFillStyle(0x0b2358, 0.95);
        }
      })
      .catch(() => {
        // ignore storage errors in menu
      });
  }

  createButton(x, y, label, callback) {
    const button = this.add.container(x, y);
    const rect = this.add.rectangle(0, 0, this.scale.width * 0.5, this.scale.height * 0.065, 0x120036, 0.85)
      .setStrokeStyle(4, 0x5f00ff, 0.9)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        this.sound.play('sfx-discover', { volume: 0.3 });
        callback();
      })
      .on('pointerover', () => {
        rect.setFillStyle(0x1e0066, 0.9);
      })
      .on('pointerout', () => {
        rect.setFillStyle(0x120036, 0.85);
      });

    const text = this.add.text(0, 0, label, {
      fontFamily: 'Montserrat',
      fontSize: `${Math.round(this.scale.height * 0.028)}px`,
      color: '#f2f8ff',
    }).setOrigin(0.5);

    button.add([rect, text]);
    return rect;
  }

  openSettings() {
    const modal = this.add.container(this.scale.width / 2, this.scale.height / 2);
    const panel = this.add.rectangle(0, 0, this.scale.width * 0.7, this.scale.height * 0.5, 0x0a0024, 0.95)
      .setStrokeStyle(6, 0x7a22ff, 0.8)
      .setOrigin(0.5);

    const title = this.add.text(0, -panel.height / 2 + 80, 'Settings', {
      fontFamily: 'Montserrat',
      fontSize: `${Math.round(this.scale.height * 0.045)}px`,
      color: '#ffffff',
    }).setOrigin(0.5);

    const soundLabel = this.add.text(-panel.width / 2 + 60, -panel.height / 2 + 160, 'Sound FX', {
      fontFamily: 'Montserrat',
      fontSize: `${Math.round(this.scale.height * 0.028)}px`,
      color: '#e3f6ff',
      align: 'left',
    }).setOrigin(0, 0.5);

    const musicLabel = this.add.text(-panel.width / 2 + 60, -panel.height / 2 + 220, 'Ambient Music', {
      fontFamily: 'Montserrat',
      fontSize: `${Math.round(this.scale.height * 0.028)}px`,
      color: '#e3f6ff',
      align: 'left',
    }).setOrigin(0, 0.5);

    const themeLabel = this.add.text(-panel.width / 2 + 60, -panel.height / 2 + 280, 'Theme', {
      fontFamily: 'Montserrat',
      fontSize: `${Math.round(this.scale.height * 0.028)}px`,
      color: '#e3f6ff',
      align: 'left',
    }).setOrigin(0, 0.5);

    const soundToggle = this.createToggleButton(panel.width / 2 - 160, soundLabel.y, StorageService.settings.sound, (value) => {
      StorageService.settings.sound = value;
      StorageService.persistSettings();
    });

    const musicToggle = this.createToggleButton(panel.width / 2 - 160, musicLabel.y, StorageService.settings.music, (value) => {
      StorageService.settings.music = value;
      StorageService.persistSettings();
    });

    const themeToggle = this.createCycleButton(panel.width / 2 - 160, themeLabel.y, StorageService.settings.theme, (value) => {
      StorageService.settings.theme = value;
      StorageService.persistSettings();
      this.events.emit('theme-changed', value);
    });

    const close = this.add.text(0, panel.height / 2 - 80, 'Close', {
      fontFamily: 'Montserrat',
      fontSize: `${Math.round(this.scale.height * 0.03)}px`,
      color: '#95f9ff',
      backgroundColor: '#13003f',
      padding: { left: 26, right: 26, top: 12, bottom: 12 },
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        this.sound.play('sfx-fail', { volume: 0.25 });
        modal.destroy();
      });

    modal.add([panel, title, soundLabel, musicLabel, themeLabel, soundToggle, musicToggle, themeToggle, close]);
    this.tweens.add({ targets: modal, alpha: { from: 0, to: 1 }, scale: { from: 0.8, to: 1 }, duration: 300, ease: 'Back.Out' });
  }

  createToggleButton(x, y, initial, onChange) {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 140, 54, 0x1b0058, 0.9)
      .setOrigin(0.5)
      .setStrokeStyle(2, 0x7f3bff, 0.8);
    const knob = this.add.circle(initial ? 30 : -30, 0, 22, 0x40f9ff, 0.9);
    const label = this.add.text(0, 0, initial ? 'ON' : 'OFF', {
      fontFamily: 'Montserrat',
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const toggle = () => {
      const value = knob.x < 0;
      this.tweens.add({ targets: knob, x: value ? 30 : -30, duration: 180, ease: 'Sine.easeInOut' });
      label.setText(value ? 'ON' : 'OFF');
      onChange(value);
    };

    bg.setInteractive({ useHandCursor: true }).on('pointerup', toggle);
    container.add([bg, knob, label]);
    return container;
  }

  createCycleButton(x, y, initial, onChange) {
    const themes = ['neon', 'cosmic', 'ember'];
    let index = Math.max(0, themes.indexOf(initial));
    const button = this.add.text(x, y, `Theme: ${themes[index]}`, {
      fontFamily: 'Montserrat',
      fontSize: '22px',
      color: '#f0c5ff',
      backgroundColor: '#1d0059',
      padding: { left: 16, right: 16, top: 10, bottom: 10 },
    }).setOrigin(0.5);

    button.setInteractive({ useHandCursor: true }).on('pointerup', () => {
      index = (index + 1) % themes.length;
      button.setText(`Theme: ${themes[index]}`);
      onChange(themes[index]);
    });

    return button;
  }
}
