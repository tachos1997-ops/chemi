import Phaser from 'phaser';
import { MonetizationService } from '../utils/Monetization';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
    this.state = null;
  }

  create() {
    this.scene.bringToTop();
    const gameScene = this.scene.get('GameScene');
    gameScene.events.on('state-update', this.updateState, this);
    gameScene.events.on('log-update', this.updateLog, this);

    this.createHud();
    this.createLog();
    this.updateState(gameScene.state || {});
  }

  shutdown() {
    const gameScene = this.scene.get('GameScene');
    gameScene.events.off('state-update', this.updateState, this);
    gameScene.events.off('log-update', this.updateLog, this);
  }

  createHud() {
    const { width } = this.scale;
    this.energyBarBg = this.add.rectangle(width * 0.1, width * 0.05, width * 0.36, width * 0.05, 0x0d0023, 0.8)
      .setStrokeStyle(4, 0x00f5ff, 0.7)
      .setOrigin(0, 0.5);
    this.energyBarFill = this.add.rectangle(this.energyBarBg.x + 6, this.energyBarBg.y, this.energyBarBg.width - 12, this.energyBarBg.height - 12, 0x2be9ff, 0.85)
      .setOrigin(0, 0.5);

    this.energyText = this.add.text(this.energyBarBg.x + this.energyBarBg.width / 2, this.energyBarBg.y, 'Energy 0/0', {
      fontFamily: 'Montserrat',
      fontSize: `${Math.round(this.scale.height * 0.028)}px`,
      color: '#e4fbff',
    }).setOrigin(0.5);

    this.refillButton = this.add.text(this.energyBarBg.x + this.energyBarBg.width + 30, this.energyBarBg.y, 'Refill', {
      fontFamily: 'Montserrat',
      fontSize: `${Math.round(this.scale.height * 0.028)}px`,
      color: '#9df7ff',
      backgroundColor: '#180051',
      padding: { left: 20, right: 20, top: 10, bottom: 10 },
    }).setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        this.handleRefill();
      });

    this.progressGraphics = this.add.graphics({ x: width * 0.85, y: width * 0.06 });
    this.progressLabel = this.add.text(width * 0.85, width * 0.06, 'Primal', {
      fontFamily: 'Montserrat',
      fontSize: `${Math.round(this.scale.height * 0.024)}px`,
      color: '#f8f8ff',
      align: 'center',
    }).setOrigin(0.5);

    this.discoveryCounter = this.add.text(width * 0.1, width * 0.12, 'Discovered 0', {
      fontFamily: 'Montserrat',
      fontSize: `${Math.round(this.scale.height * 0.032)}px`,
      color: '#d3faff',
    }).setOrigin(0, 0.5);
  }

  createLog() {
    const { width, height } = this.scale;
    this.logPanel = this.add.rectangle(width * 0.07, height * 0.86, width * 0.86, height * 0.18, 0x05001c, 0.85)
      .setStrokeStyle(4, 0x3f00ff, 0.6)
      .setOrigin(0, 0.5);
    this.logEntries = [];
  }

  handleRefill() {
    const gameScene = this.scene.get('GameScene');
    MonetizationService.buyEnergyPack().then((amount) => {
      if (amount) {
        gameScene.events.emit('refill-energy', amount);
      } else {
        MonetizationService.showRewardedAd().then((reward) => {
          if (reward) {
            gameScene.events.emit('refill-energy', reward);
          }
        });
      }
    });
  }

  updateState(state = {}) {
    this.state = state;
    if (!this.energyBarBg) return;
    const energyRatio = state.maxEnergy ? state.energy / state.maxEnergy : 0;
    this.energyBarFill.width = (this.energyBarBg.width - 12) * Phaser.Math.Clamp(energyRatio, 0, 1);
    this.energyText.setText(`Energy ${state.energy ?? 0}/${state.maxEnergy ?? 0}`);
    this.discoveryCounter.setText(`Discovered ${state.total ?? 0}`);
    this.progressLabel.setText(`${state.currentAge ?? 'Primal'}`);
    const progressRatio = state.nextThreshold ? (state.total ?? 0) / state.nextThreshold : 1;
    this.drawProgressRing(progressRatio, state);
  }

  drawProgressRing(ratio, state) {
    const radius = this.scale.width * 0.07;
    this.progressGraphics.clear();
    this.progressGraphics.lineStyle(6, 0x1f005a, 0.9);
    this.progressGraphics.strokeCircle(0, 0, radius);
    this.progressGraphics.lineStyle(6, 0x4ff9ff, 1);
    this.progressGraphics.beginPath();
    const clamped = Phaser.Math.Clamp(ratio, 0, 1);
    this.progressGraphics.arc(0, 0, radius, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(-90 + 360 * clamped), false);
    this.progressGraphics.strokePath();

    if (state.nextThreshold) {
      this.progressGraphics.fillStyle(0xffffff, 0);
      const tooltip = `${state.total}/${state.nextThreshold}`;
      if (!this.progressTooltip) {
        this.progressTooltip = this.add.text(this.progressGraphics.x, this.progressGraphics.y + radius + 20, tooltip, {
          fontFamily: 'Montserrat',
          fontSize: `${Math.round(this.scale.height * 0.02)}px`,
          color: '#a6f8ff',
        }).setOrigin(0.5);
      } else {
        this.progressTooltip.setText(tooltip);
      }
    } else if (this.progressTooltip) {
      this.progressTooltip.setText(`${state.total}`);
    }
  }

  updateLog(entries = []) {
    this.logEntries.forEach((entry) => entry.destroy());
    this.logEntries = entries.slice(0, 6).map((item, index) => {
      const text = this.add.text(this.logPanel.x + 20, this.logPanel.y - this.logPanel.height / 2 + 20 + index * 36, `${this.formatLog(item)}`, {
        fontFamily: 'Montserrat',
        fontSize: `${Math.round(this.scale.height * 0.022)}px`,
        color: this.colorForLog(item.type),
      }).setOrigin(0, 0);
      return text;
    });
  }

  colorForLog(type) {
    switch (type) {
      case 'success':
        return '#75fffa';
      case 'age':
        return '#ffc7ff';
      case 'fail':
        return '#ff8080';
      case 'info':
        return '#8bd4ff';
      default:
        return '#b4b4ff';
    }
  }

  formatLog(item) {
    const date = new Date(item.timestamp || Date.now());
    const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    return `[${time}] ${item.text}`;
  }
}
