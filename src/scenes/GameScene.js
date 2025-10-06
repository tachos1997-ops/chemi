import Phaser from 'phaser';
import { StorageService } from '../utils/Storage';
import { MonetizationService } from '../utils/Monetization';

const ENERGY_MAX = 20;
const ENERGY_REGEN_INTERVAL = 45000; // 45 seconds
const AGE_THRESHOLDS = [10, 20, 35, 50, 70];

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.stateReady = false;
  }

  init(data) {
    this.restored = data?.restored ?? false;
  }

  async create() {
    this.combos = this.registry.get('combos');
    this.ages = this.registry.get('ages');
    this.baseElements = this.registry.get('baseElements');
    this.comboMap = new Map();
    this.resultToAge = new Map();

    this.combos.forEach((combo) => {
      const key = GameScene.keyFor(combo.ingredients[0], combo.ingredients[1]);
      this.comboMap.set(key, combo.result);
      this.resultToAge.set(combo.result, combo.age);
    });

    this.elements = new Set(this.baseElements);
    this.discoveredOrder = [...this.baseElements];
    this.energy = ENERGY_MAX;
    this.maxEnergy = ENERGY_MAX;
    this.energyTimer = null;
    this.currentAgeIndex = 0;
    this.discoveryLog = [];
    this.theme = StorageService.settings.theme || 'neon';
    this.pendingSelection = [];
    this.lastSaveTime = 0;

    await StorageService.init();
    const saved = await StorageService.loadGame();
    if (saved && saved.discovered?.length) {
      this.elements = new Set(saved.discovered);
      this.discoveredOrder = [...saved.discovered];
      this.energy = saved.energy ?? this.energy;
      this.maxEnergy = saved.maxEnergy ?? this.maxEnergy;
      this.currentAgeIndex = saved.ageIndex ?? this.currentAgeIndex;
      this.discoveryLog = saved.log ?? this.discoveryLog;
      this.theme = saved.theme ?? this.theme;
    }

    this.createBackground();
    this.createDropZone();
    this.createPalette();
    this.createResetButton();
    this.applyTheme();
    this.stateReady = true;

    this.energyTimer = this.time.addEvent({
      delay: ENERGY_REGEN_INTERVAL,
      loop: true,
      callback: () => {
        if (this.energy < this.maxEnergy) {
          this.energy += 1;
          this.dispatchState();
          this.logEvent('Energy regenerated');
        }
      },
    });

    this.input.on('gameobjectdown', this.handleTapSelect, this);
    this.input.on('drop', this.handleDrop, this);
    this.events.on('refill-energy', this.handleEnergyRefill, this);
    this.events.on('reset-universe', this.resetUniverse, this);
    this.events.on('set-theme', (value) => {
      this.theme = value;
      this.applyTheme();
      this.dispatchState();
      this.queueSave();
    });

    this.dispatchState();
  }

  static keyFor(a, b) {
    return [a, b].sort().join('|');
  }

  createBackground() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x050018, 0.7);

    this.grid = this.add.grid(width / 2, height / 2, width, height, 120, 120, 0x0b0030, 0.3, 0x25006a, 0.1);
    this.tweens.add({
      targets: this.grid,
      angle: 360,
      duration: 48000,
      repeat: -1,
      ease: 'Linear',
    });
  }

  createDropZone() {
    const { width } = this.scale;
    const radius = width * 0.22;
    this.dropZone = this.add.circle(width / 2, this.scale.height * 0.45, radius, 0x160032, 0.72)
      .setStrokeStyle(6, 0x7e2bff, 0.8)
      .setInteractive({ dropZone: true });

    this.dropAura = this.add.circle(this.dropZone.x, this.dropZone.y, radius * 0.65, 0x3ef8ff, 0.22)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: [this.dropZone, this.dropAura],
      scale: { from: 1, to: 1.05 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.dropLabel = this.add.text(this.dropZone.x, this.dropZone.y, 'Alchemy Nexus', {
      fontFamily: 'Montserrat',
      fontSize: `${Math.round(this.scale.height * 0.035)}px`,
      color: '#d5f9ff',
      align: 'center',
    }).setOrigin(0.5);
  }

  createPalette() {
    if (this.palette) {
      this.palette.destroy(true);
    }
    const { width, height } = this.scale;
    this.palette = this.add.container(width / 2, height * 0.78);
    const background = this.add.rectangle(0, 0, width * 0.9, height * 0.36, 0x0a0028, 0.85)
      .setStrokeStyle(6, 0x6419ff, 0.7);
    this.palette.add(background);

    const columns = this.sys.game.device.os.desktop ? 6 : 3;
    const cellWidth = background.width / columns;
    const cellHeight = background.height / Math.ceil(this.discoveredOrder.length / columns || 1);

    this.cardGroup = this.add.group();
    this.discoveredOrder.forEach((element, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const card = this.createElementCard(
        -background.width / 2 + col * cellWidth + cellWidth / 2,
        -background.height / 2 + row * cellHeight + cellHeight / 2,
        element,
      );
      this.palette.add(card);
      this.cardGroup.add(card);
    });
  }

  createElementCard(x, y, element) {
    const card = this.add.container(x, y);
    const width = this.scale.width * 0.12;
    const height = this.scale.height * 0.09;
    const rect = this.add.rectangle(0, 0, width, height, 0x12003a, 0.92)
      .setStrokeStyle(3, 0x3f00ff, 0.8)
      .setInteractive({ draggable: true });
    rect.setData('element', element);

    const textureKey = `icon-${element.replace(/\s/g, '_')}`;
    const icon = this.add.image(0, -height * 0.1, textureKey).setDisplaySize(width * 0.7, width * 0.7);

    const text = this.add.text(0, height * 0.22, element, {
      fontFamily: 'Montserrat',
      fontSize: `${Math.max(16, Math.round(height * 0.22))}px`,
      color: '#f8f8ff',
      wordWrap: { width: width * 0.9 },
      align: 'center',
    }).setOrigin(0.5);

    card.add([rect, icon, text]);
    card.setData('element', element);

    this.input.setDraggable(rect, true);

    rect.on('dragstart', (pointer, dragX, dragY) => {
      this.tweens.add({ targets: card, scale: 1.1, duration: 180, ease: 'Back.Out' });
      card.setDepth(20);
    });

    rect.on('drag', (pointer, dragX, dragY) => {
      card.x = dragX;
      card.y = dragY;
    });

    rect.on('dragend', () => {
      this.tweens.add({ targets: card, scale: 1, duration: 160 });
      card.setDepth(0);
      card.x = x;
      card.y = y;
    });

    rect.on('pointerdown', (pointer) => {
      this.handleTapSelect(rect, pointer);
    });

    return card;
  }

  handleTapSelect(gameObject) {
    if (!this.stateReady) return;
    const element = gameObject.getData ? gameObject.getData('element') : gameObject.parentContainer?.getData('element');
    if (!element) return;

    if (!this.sys.game.device.os.desktop) {
      this.pendingSelection.push(element);
      this.highlightSelection(gameObject.parentContainer);
      if (this.pendingSelection.length === 2) {
        const [a, b] = this.pendingSelection.splice(0, 2);
        this.combineElements(a, b);
      }
    }
  }

  highlightSelection(card) {
    this.tweens.add({
      targets: card,
      y: card.y - 12,
      yoyo: true,
      duration: 160,
    });
  }

  handleDrop(pointer, gameObject, dropZone) {
    if (!this.stateReady || !dropZone || this.energy <= 0) {
      if (this.energy <= 0) {
        this.sound.play('sfx-fail', { volume: 0.5 });
        this.logEvent('Out of energy. Refill to continue synthesis.');
      }
      return;
    }
    const element = gameObject.parentContainer.getData('element');
    const other = this.pendingSelection.pop();
    if (other) {
      this.combineElements(other, element);
    } else {
      this.pendingSelection.push(element);
    }
  }

  combineElements(a, b) {
    const key = GameScene.keyFor(a, b);
    const result = this.comboMap.get(key);
    if (result) {
      this.resolveDiscovery(result, a, b);
    } else {
      this.resolveFailure(a, b);
    }
  }

  resolveDiscovery(result, a, b) {
    const isNew = !this.elements.has(result);
    if (isNew) {
      this.elements.add(result);
      this.discoveredOrder.push(result);
      this.discoveryLog.unshift({
        type: 'success',
        text: `${a} + ${b} → ${result}`,
        timestamp: Date.now(),
      });
      this.spawnParticles(result);
      this.sound.play('sfx-discover', { volume: 0.6 });
      this.checkAgeProgress(result);
      this.createPalette();
      this.dispatchState();
      this.queueSave();
    } else {
      this.discoveryLog.unshift({
        type: 'repeat',
        text: `${result} rediscovered`,
        timestamp: Date.now(),
      });
      this.sound.play('sfx-discover', { volume: 0.3 });
    }
    this.dispatchLog();
  }

  resolveFailure(a, b) {
    this.energy = Math.max(0, this.energy - 1);
    this.discoveryLog.unshift({
      type: 'fail',
      text: `${a} + ${b} fizzles`,
      timestamp: Date.now(),
    });
    this.tweens.add({
      targets: this.dropAura,
      tint: { from: 0x3ef8ff, to: 0xff1f4b },
      alpha: { from: 0.22, to: 0.6 },
      duration: 180,
      yoyo: true,
      onStart: () => this.sound.play('sfx-fail', { volume: 0.5 }),
    });
    this.dispatchState();
    this.dispatchLog();
    this.queueSave();
  }

  spawnParticles(result) {
    const emitter = this.add.particles(this.dropZone.x, this.dropZone.y, 'particle-spark', {
      speed: { min: 100, max: 220 },
      lifespan: 600,
      quantity: 16,
      scale: { start: 0.6, end: 0 },
      blendMode: 'ADD',
    });
    this.time.delayedCall(900, () => emitter.destroy());

    const label = this.add.text(this.dropZone.x, this.dropZone.y - this.dropZone.radius, `NEW: ${result}`, {
      fontFamily: 'Montserrat',
      fontSize: `${Math.round(this.scale.height * 0.03)}px`,
      color: '#80fffb',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.tweens.add({ targets: label, y: label.y - 60, alpha: 0, duration: 1200, onComplete: () => label.destroy() });
  }

  checkAgeProgress(newElement) {
    const total = this.elements.size;
    const nextThreshold = AGE_THRESHOLDS[this.currentAgeIndex];
    if (nextThreshold && total >= nextThreshold) {
      this.currentAgeIndex += 1;
      this.maxEnergy += 2;
      this.energy = Math.min(this.maxEnergy, this.energy + 5);
      this.sound.play('sfx-levelup', { volume: 0.8 });
      this.discoveryLog.unshift({
        type: 'age',
        text: `${this.ages[this.currentAgeIndex]} Age unlocked!`,
        timestamp: Date.now(),
      });
    }
    this.dispatchState();
    this.dispatchLog();
  }

  handleEnergyRefill(amount) {
    if (amount === 'max') {
      this.energy = this.maxEnergy;
    } else {
      this.energy = Math.min(this.maxEnergy, this.energy + (amount || 5));
    }
    this.logEvent('Energy refilled');
    this.dispatchState();
    this.queueSave();
  }

  logEvent(message) {
    this.discoveryLog.unshift({
      type: 'info',
      text: message,
      timestamp: Date.now(),
    });
    this.dispatchLog();
  }

  dispatchState() {
    if (!this.stateReady) return;
    const payload = {
      energy: this.energy,
      maxEnergy: this.maxEnergy,
      discovered: this.discoveredOrder,
      total: this.elements.size,
      ageIndex: this.currentAgeIndex,
      currentAge: this.ages[this.currentAgeIndex] || this.ages[this.ages.length - 1],
      nextThreshold: AGE_THRESHOLDS[this.currentAgeIndex] ?? null,
      theme: this.theme,
    };
    this.state = payload;
    this.events.emit('state-update', payload);
  }

  dispatchLog() {
    this.events.emit('log-update', this.discoveryLog.slice(0, 12));
  }

  queueSave() {
    const now = Date.now();
    if (now - this.lastSaveTime < 1000) {
      return;
    }
    this.lastSaveTime = now;
    StorageService.saveGame({
      discovered: Array.from(this.elements),
      energy: this.energy,
      maxEnergy: this.maxEnergy,
      ageIndex: this.currentAgeIndex,
      log: this.discoveryLog.slice(0, 40),
      theme: this.theme,
      timestamp: now,
    }).catch(() => {
      // ignore save errors for offline fallback
    });
  }

  resetUniverse({ legacyBoost = 2 } = {}) {
    MonetizationService.trackReset();
    this.elements = new Set(this.baseElements);
    this.discoveredOrder = [...this.baseElements];
    this.energy = Math.min(this.maxEnergy + legacyBoost, this.maxEnergy + legacyBoost);
    this.maxEnergy += legacyBoost;
    this.currentAgeIndex = 0;
    this.discoveryLog.unshift({
      type: 'info',
      text: `Universe reset. Legacy energy +${legacyBoost}.`,
      timestamp: Date.now(),
    });
    this.createPalette();
    this.dispatchState();
    this.dispatchLog();
    this.queueSave();
  }

  createResetButton() {
    const button = this.add.text(this.scale.width * 0.85, this.scale.height * 0.12, 'Reset Universe', {
      fontFamily: 'Montserrat',
      fontSize: `${Math.round(this.scale.height * 0.028)}px`,
      color: '#ff8cda',
      backgroundColor: '#1b004e',
      padding: { left: 16, right: 16, top: 10, bottom: 10 },
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        this.confirmReset();
      });

    this.add.text(button.x, button.y + 60, 'Keep legacy energy bonuses', {
      fontFamily: 'Montserrat',
      fontSize: `${Math.round(this.scale.height * 0.02)}px`,
      color: '#9be7ff',
    }).setOrigin(0.5);
  }

  confirmReset() {
    const modal = this.add.container(this.scale.width / 2, this.scale.height / 2);
    const panel = this.add.rectangle(0, 0, this.scale.width * 0.74, this.scale.height * 0.44, 0x0b0034, 0.95)
      .setStrokeStyle(6, 0xd234ff, 0.7);
    const title = this.add.text(0, -panel.height / 2 + 60, 'Reset Universe?', {
      fontFamily: 'Montserrat',
      fontSize: `${Math.round(this.scale.height * 0.04)}px`,
      color: '#ffffff',
    }).setOrigin(0.5);

    const description = this.add.text(0, 0, 'You will keep legacy energy bonuses and unlocked themes.', {
      fontFamily: 'Montserrat',
      fontSize: `${Math.round(this.scale.height * 0.024)}px`,
      color: '#c8f4ff',
      align: 'center',
      wordWrap: { width: panel.width - 80 },
    }).setOrigin(0.5);

    const confirm = this.add.text(-panel.width / 4, panel.height / 2 - 80, 'Reset', {
      fontFamily: 'Montserrat',
      fontSize: `${Math.round(this.scale.height * 0.03)}px`,
      color: '#ff7f9f',
      backgroundColor: '#2c005c',
      padding: { left: 24, right: 24, top: 12, bottom: 12 },
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        modal.destroy();
        this.resetUniverse({ legacyBoost: 3 });
      });

    const cancel = this.add.text(panel.width / 4, panel.height / 2 - 80, 'Cancel', {
      fontFamily: 'Montserrat',
      fontSize: `${Math.round(this.scale.height * 0.03)}px`,
      color: '#9ef7ff',
      backgroundColor: '#130046',
      padding: { left: 24, right: 24, top: 12, bottom: 12 },
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        modal.destroy();
      });

    modal.add([panel, title, description, confirm, cancel]);
    this.tweens.add({ targets: modal, alpha: { from: 0, to: 1 }, scale: { from: 0.7, to: 1 }, duration: 280, ease: 'Back.Out' });
  }

  applyTheme() {
    const palettes = {
      neon: { stroke: 0x6419ff, fill: 0x0a0028 },
      cosmic: { stroke: 0x00d1ff, fill: 0x001d3a },
      ember: { stroke: 0xff7b45, fill: 0x280009 },
    };
    const palette = palettes[this.theme] || palettes.neon;
    if (this.palette) {
      this.palette.list.forEach((child) => {
        if (child.isFilled) {
          child.fillColor = palette.fill;
        }
        if (child.strokeColor) {
          child.setStrokeStyle(child.lineWidth, palette.stroke, 0.8);
        }
      });
    }
  }
}
