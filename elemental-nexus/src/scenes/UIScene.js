import Phaser from 'phaser';
import { AGES, AGE_THRESHOLDS } from '../utils/Combos.js';
import { saveState } from '../utils/Storage.js';
import { showRewardedAd, purchaseEnergyPack } from '../utils/Monetization.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
    this.energyFill = null;
    this.energyText = null;
    this.progressGraphics = null;
    this.progressText = null;
    this.discoveredText = null;
    this.nextRegenTimer = null;
    this.regenInterval = 0;
  }

  create() {
    const state = this.registry.get('game-state');
    const { width } = this.scale;
    this.energyFill = this.add.rectangle(width * 0.25, 40, 0, 24, 0x38ffe2).setOrigin(0, 0.5);
    this.add.rectangle(width * 0.25, 40, width * 0.3, 28, 0x071220, 0.7).setOrigin(0, 0.5).setStrokeStyle(2, 0x38ffe2, 0.9);
    this.energyText = this.add.text(width * 0.25 + 10, 40, '', {
      fontFamily: 'Rajdhani',
      fontSize: '18px',
      color: '#0d0d0d'
    }).setOrigin(0, 0.5);

    this.progressGraphics = this.add.graphics({ x: width - 100, y: 80 });
    this.progressText = this.add.text(width - 100, 80, '', {
      fontFamily: 'Rajdhani',
      fontSize: '18px',
      color: '#c8faff'
    }).setOrigin(0.5);

    this.discoveredText = this.add.text(width * 0.25, 80, '', {
      fontFamily: 'Rajdhani',
      fontSize: '20px',
      color: '#9ffcff'
    }).setOrigin(0, 0.5);

    const rewardButton = this.add.text(width * 0.25, 120, 'Watch Ad for Energy', {
      fontFamily: 'Rajdhani',
      fontSize: '18px',
      color: '#041924',
      backgroundColor: '#2fffd7',
      padding: { left: 12, right: 12, top: 6, bottom: 6 }
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    rewardButton.on('pointerdown', async () => {
      rewardButton.disableInteractive();
      const result = await showRewardedAd('ca-app-pub-3940256099942544/5224354917');
      if (result.success) {
        state.grantEnergy(5);
        await saveState(state.toJSON());
        this.updateEnergyDisplay(state.energy, state.maxEnergy);
      }
      rewardButton.setInteractive({ useHandCursor: true });
    });

    const storeButton = this.add.text(width * 0.45, 120, 'Buy Energy Pack', {
      fontFamily: 'Rajdhani',
      fontSize: '18px',
      color: '#041924',
      backgroundColor: '#2fffd7',
      padding: { left: 12, right: 12, top: 6, bottom: 6 }
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    storeButton.on('pointerdown', async () => {
      storeButton.disableInteractive();
      const result = await purchaseEnergyPack('energy_pack_1');
      if (result.success) {
        state.grantEnergy(state.maxEnergy);
        await saveState(state.toJSON());
        this.updateEnergyDisplay(state.energy, state.maxEnergy);
      }
      storeButton.setInteractive({ useHandCursor: true });
    });

    this.game.events.on('energy-changed', this.onEnergyChanged, this);
    this.game.events.on('discovery', this.onDiscovery, this);
    this.game.events.on('age-unlocked', this.onAgeUnlocked, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('energy-changed', this.onEnergyChanged, this);
      this.game.events.off('discovery', this.onDiscovery, this);
      this.game.events.off('age-unlocked', this.onAgeUnlocked, this);
    });

    this.updateEnergyDisplay(state.energy, state.maxEnergy);
    this.updateDiscovery(state.discovered.size, state.age);

    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this.updateCountdown()
    });
  }

  onEnergyChanged({ energy, maxEnergy, regenInterval }) {
    this.regenInterval = regenInterval;
    this.updateEnergyDisplay(energy, maxEnergy);
  }

  onDiscovery({ total, age }) {
    this.updateDiscovery(total, age);
  }

  onAgeUnlocked(age) {
    const toast = this.add.text(this.scale.width / 2, this.scale.height * 0.2, `${age} Age Awakened`, {
      fontFamily: 'Orbitron',
      fontSize: '28px',
      color: '#f5ff8c',
      backgroundColor: '#0a1c2a',
      padding: { left: 20, right: 20, top: 8, bottom: 8 }
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({
      targets: toast,
      alpha: 1,
      duration: 300,
      yoyo: true,
      hold: 1200,
      onComplete: () => toast.destroy()
    });
  }

  updateEnergyDisplay(energy, maxEnergy) {
    const { width } = this.scale;
    const barWidth = width * 0.3;
    const ratio = Phaser.Math.Clamp(energy / maxEnergy, 0, 1);
    this.energyFill.width = barWidth * ratio;
    this.energyText.setText(`Energy ${energy} / ${maxEnergy}`);
    if (energy <= 0) {
      this.energyText.setColor('#ff6b6b');
    } else {
      this.energyText.setColor('#0d0d0d');
    }
    this.nextRegenTimer = Date.now();
  }

  updateDiscovery(total, age) {
    this.discoveredText.setText(`Discovered ${total} / 176 – Age: ${age}`);
    const currentIndex = AGES.indexOf(age);
    const currentThreshold = AGE_THRESHOLDS[age] ?? 0;
    const nextAge = AGES[Math.min(currentIndex + 1, AGES.length - 1)];
    const nextThreshold = AGE_THRESHOLDS[nextAge] ?? total;
    const previousAge = AGES[Math.max(currentIndex - 1, 0)];
    const previousThreshold = AGE_THRESHOLDS[previousAge] ?? 0;
    const denominator = Math.max(1, nextThreshold - previousThreshold);
    const progress = Phaser.Math.Clamp((total - previousThreshold) / denominator, 0, 1);
    this.drawProgressRing(progress, age);
  }

  drawProgressRing(progress, age) {
    this.progressGraphics.clear();
    this.progressGraphics.lineStyle(6, 0x0c283d, 0.6);
    this.progressGraphics.strokeCircle(0, 0, 40);
    this.progressGraphics.beginPath();
    this.progressGraphics.lineStyle(6, 0x38ffe2, 1);
    this.progressGraphics.arc(0, 0, 40, Phaser.Math.DegToRad(270), Phaser.Math.DegToRad(270 + 360 * progress), false);
    this.progressGraphics.strokePath();
    this.progressGraphics.closePath();
    this.progressText.setText(`${age}\n${Math.round(progress * 100)}%`);
  }

  updateCountdown() {
    const state = this.registry.get('game-state');
    if (state.energy >= state.maxEnergy) {
      return;
    }
    const elapsed = Date.now() - state.lastEnergyTimestamp;
    const remaining = Math.max(0, this.regenInterval - elapsed);
    const seconds = Math.ceil(remaining / 1000);
    if (seconds > 0) {
      this.energyText.setText(`Energy ${state.energy} / ${state.maxEnergy} · +1 in ${seconds}s`);
    }
  }
}
