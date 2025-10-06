import Phaser from 'phaser';

const STEPS = [
  'Drag two elements into the glowing nexus or tap them to combine.',
  'Discoveries unlock new Ages. Reach milestones to reveal the future.',
  'Each failed attempt costs energy. Let it recharge or refill via ads or purchases.',
  'Reset the universe after Futuristic Age to earn legacy bonuses and replay.'
];

export default class TutorialScene extends Phaser.Scene {
  constructor() {
    super('TutorialScene');
    this.stepIndex = 0;
  }

  create() {
    const { width, height } = this.scale;
    const backdrop = this.add.rectangle(width / 2, height / 2, width * 0.8, height * 0.7, 0x010409, 0.92)
      .setStrokeStyle(2, 0x2fffd7, 0.8)
      .setDepth(10);
    this.text = this.add.text(width / 2, height / 2 - 40, STEPS[this.stepIndex], {
      fontFamily: 'Rajdhani',
      fontSize: '22px',
      color: '#c8faff',
      wordWrap: { width: width * 0.7 }
    }).setOrigin(0.5).setDepth(10);

    this.nextButton = this.add.text(width / 2, height / 2 + 80, 'Next', {
      fontFamily: 'Orbitron',
      fontSize: '20px',
      color: '#041924',
      backgroundColor: '#2fffd7',
      padding: { left: 16, right: 16, top: 8, bottom: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(10);

    this.nextButton.on('pointerdown', () => this.advance());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      backdrop.destroy();
      this.text.destroy();
      this.nextButton.destroy();
    });
  }

  advance() {
    this.stepIndex += 1;
    if (this.stepIndex >= STEPS.length) {
      this.scene.stop();
      return;
    }
    this.text.setText(STEPS[this.stepIndex]);
    if (this.stepIndex === STEPS.length - 1) {
      this.nextButton.setText('Close');
    }
  }
}
