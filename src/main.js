import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import MenuScene from './scenes/MenuScene';
import GameScene from './scenes/GameScene';
import UIScene from './scenes/UIScene';
import TutorialScene from './scenes/TutorialScene';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#03000f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1080,
    height: 1920,
    min: {
      width: 480,
      height: 720,
    },
  },
  physics: {
    default: 'arcade',
  },
  scene: [BootScene, MenuScene, TutorialScene, GameScene, UIScene],
};

window.addEventListener('load', () => {
  if (!document.getElementById('game-container')) {
    const container = document.createElement('div');
    container.id = 'game-container';
    document.body.appendChild(container);
  }
  // Add viewport meta for mobile builds
  let meta = document.querySelector('meta[name="viewport"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'viewport';
    document.head.appendChild(meta);
  }
  meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';

  // create root background for neon vibes
  document.body.style.margin = '0';
  document.body.style.background = 'radial-gradient(circle at top, #241a47 0%, #02000a 60%, #020008 100%)';
  document.body.style.fontFamily = '"Montserrat", Arial, sans-serif';

  // eslint-disable-next-line no-new
  new Phaser.Game(config);
});
