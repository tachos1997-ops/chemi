import Phaser from 'phaser';

export default class TutorialScene extends Phaser.Scene {
  constructor() {
    super('TutorialScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#020012');
    const { width, height } = this.scale;

    const panel = this.add.rectangle(width / 2, height / 2, width * 0.86, height * 0.76, 0x070028, 0.92)
      .setStrokeStyle(6, 0x4512ff, 0.8);

    const title = this.add.text(width / 2, panel.getCenter().y - panel.height / 2 + 80, 'Neon Alchemy Primer', {
      fontFamily: 'Montserrat',
      fontSize: `${Math.round(height * 0.05)}px`,
      color: '#fdfbff',
    }).setOrigin(0.5);

    const steps = [
      '1. Drag two element cards into the Alchemy Nexus or tap two cards on mobile.',
      '2. Discover over 170 syntheses across six Ages. Each Age unlock raises energy capacity.',
      '3. Invalid combos drain energy. Energy regenerates or can be refilled via ads or purchases.',
      '4. Swipe through the discovery log to review your breakthroughs and failures.',
      '5. Reset the universe to chase faster runs and earn legacy energy bonuses.',
      '6. Play offline anywhere — progress persists via on-device database.',
    ];

    steps.forEach((step, index) => {
      this.add.text(panel.x - panel.width / 2 + 60, panel.y - panel.height / 2 + 160 + index * 80, step, {
        fontFamily: 'Montserrat',
        fontSize: `${Math.round(height * 0.03)}px`,
        color: '#b5f5ff',
        wordWrap: { width: panel.width - 120 },
      });
    });

    const backButton = this.add.text(width / 2, panel.y + panel.height / 2 - 80, 'Back to Menu', {
      fontFamily: 'Montserrat',
      fontSize: `${Math.round(height * 0.035)}px`,
      color: '#aefbff',
      backgroundColor: '#15004a',
      padding: { left: 30, right: 30, top: 16, bottom: 16 },
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        this.scene.start('MenuScene');
      });

    this.tweens.add({ targets: backButton, alpha: { from: 0.5, to: 1 }, duration: 800, yoyo: true, repeat: -1 });
  }
}
