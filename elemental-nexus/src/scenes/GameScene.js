import Phaser from 'phaser';
import { findCombo } from '../utils/Combos.js';
import { playSfx } from '../assets/sounds/index.js';
import { ensureIconTexture } from '../assets/icons/generator.js';
import { ensureSparkParticle } from '../assets/particles/generator.js';
import { saveState } from '../utils/Storage.js';
import { getEnergyRegenInterval } from '../utils/GameState.js';

const DISCOVERY_LIMIT = 8;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.paletteContainer = null;
    this.logEntries = [];
    this.pendingCard = null;
    this.pendingElement = null;
    this.dropZone = null;
  }

  create() {
    this.cameras.main.setBackgroundColor('#040510');
    const state = this.registry.get('game-state');
    state.applyEnergyRegen();
    ensureSparkParticle(this);

    this.dropRing = this.add.circle(this.scale.width * 0.68, this.scale.height * 0.55, 120, 0x0f172a, 0.6)
      .setStrokeStyle(6, 0x36fff2, 0.8)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.dropZone = this.add.zone(this.dropRing.x, this.dropRing.y, this.dropRing.radius * 2, this.dropRing.radius * 2)
      .setCircleDropZone(this.dropRing.radius)
      .setInteractive();

    this.add.text(this.dropRing.x, this.dropRing.y - this.dropRing.radius - 20, 'Alchemy Nexus', {
      fontFamily: 'Orbitron',
      fontSize: '24px',
      color: '#5dfbff'
    }).setOrigin(0.5);

    this.discoveryLog = this.add.text(this.scale.width * 0.03, this.scale.height * 0.55, 'Discovery Log', {
      fontFamily: 'Rajdhani',
      fontSize: '22px',
      color: '#5dfbff'
    });

    this.logGroup = this.add.group();
    this.refreshPalette();
    this.registerInputHandlers();

    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this.tickEnergy()
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.logGroup.clear(true, true);
      this.logEntries = [];
    });
  }

  registerInputHandlers() {
    this.input.on('drop', async (_pointer, gameObject) => {
      const element = gameObject.getData('element');
      await this.handleElementSelection(gameObject, element, true);
    });

    this.input.on('drag', (_pointer, gameObject, dragX, dragY) => {
      gameObject.setPosition(dragX, dragY);
    });

    this.input.on('dragstart', (_pointer, gameObject) => {
      gameObject.setData('dragging', true);
      gameObject.setDepth(10);
    });

    this.input.on('dragend', async (_pointer, gameObject, dropped) => {
      gameObject.setDepth(1);
      gameObject.setData('dragging', false);
      if (!dropped) {
        this.resetCardPosition(gameObject);
        await this.handleElementSelection(gameObject, gameObject.getData('element'), false);
      }
    });

    this.input.on('gameobjectdown', async (_pointer, gameObject) => {
      if (gameObject.getData('element') && !gameObject.getData('dragging')) {
        await this.handleElementSelection(gameObject, gameObject.getData('element'), false);
      }
    });
  }

  resetCardPosition(card) {
    const origin = card.getData('origin');
    card.setPosition(this.paletteContainer.x + origin.x, this.paletteContainer.y + origin.y);
    card.setScale(1);
    card.setDepth(1);
  }

  async handleElementSelection(card, element, fromDrop) {
    if (!card) {
      return;
    }
    this.resetCardPosition(card);

    if (!this.pendingElement) {
      this.pendingElement = element;
      this.pendingCard = card;
      card.setScale(1.1);
      this.tweens.add({
        targets: this.dropRing,
        alpha: 0.8,
        scale: 1.05,
        duration: 200,
        yoyo: true
      });
      return;
    }

    if (this.pendingCard === card) {
      card.setScale(1);
      this.pendingCard = null;
      this.pendingElement = null;
      return;
    }

    const first = this.pendingElement;
    const second = element;
    const originCard = this.pendingCard;
    this.pendingElement = null;
    this.pendingCard = null;
    originCard.setScale(1);
    this.resetCardPosition(originCard);

    await this.attemptCombine(first, second, card);
  }

  async attemptCombine(first, second, card) {
    const state = this.registry.get('game-state');
    const combo = findCombo(first, second);
    const previousAge = state.age;
    if (combo) {
      const discovered = state.registerDiscovery(combo.result);
      playSfx(this, 'discover');
      this.spawnParticleBurst();
      this.addLog(`${first} + ${second} → ${combo.result}`, true);
      if (discovered) {
        this.refreshPalette();
      }
      if (state.age !== previousAge) {
        playSfx(this, 'age');
        this.game.events.emit('age-unlocked', state.age);
      }
      this.game.events.emit('discovery', { element: combo.result, total: state.discovered.size, age: state.age });
      await saveState(state.toJSON());
      this.game.events.emit('energy-changed', {
        energy: state.energy,
        maxEnergy: state.maxEnergy,
        regenInterval: getEnergyRegenInterval()
      });
      if (card) {
        this.resetCardPosition(card);
      }
      return;
    }

    const spent = state.spendEnergy();
    if (!spent) {
      this.addLog('Not enough energy. Wait or refill.', false);
    } else {
      this.addLog(`${first} + ${second} fizzles.`, false);
    }
    playSfx(this, 'fail');
    await saveState(state.toJSON());
    this.game.events.emit('energy-changed', {
      energy: state.energy,
      maxEnergy: state.maxEnergy,
      regenInterval: getEnergyRegenInterval()
    });
    if (card) {
      this.resetCardPosition(card);
    }
  }

  refreshPalette() {
    if (this.paletteContainer) {
      this.paletteContainer.destroy(true);
    }
    const state = this.registry.get('game-state');
    const sorted = Array.from(state.discovered).sort((a, b) => a.localeCompare(b));
    this.paletteContainer = this.add.container(this.scale.width * 0.05, this.scale.height * 0.1);
    const columns = this.scale.width < 900 ? 3 : 5;
    const spacingX = 150;
    const spacingY = 140;
    sorted.forEach((element, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = col * spacingX;
      const y = row * spacingY;
      const card = this.createElementCard(element, x, y);
      this.paletteContainer.add(card);
    });
  }

  createElementCard(element, offsetX, offsetY) {
    const container = this.add.container(0, 0);
    const iconKey = `icon-${element}`;
    ensureIconTexture(this, element);
    const bg = this.add.rectangle(0, 0, 120, 120, 0x0c1122, 0.8).setStrokeStyle(2, 0x2fffd7, 0.7).setOrigin(0.5);
    const image = this.add.image(0, -10, iconKey).setScale(0.55);
    const label = this.add.text(0, 52, element, {
      fontFamily: 'Rajdhani',
      fontSize: '18px',
      color: '#cfffff'
    }).setOrigin(0.5);
    container.add([bg, image, label]);
    container.setSize(120, 120);
    container.setInteractive({ useHandCursor: true });
    container.setData('element', element);
    container.setPosition(offsetX, offsetY);
    container.setData('origin', { x: offsetX, y: offsetY });
    this.input.setDraggable(container);
    return container;
  }

  spawnParticleBurst() {
    const emitter = this.add.particles(ensureSparkParticle(this)).createEmitter({
      x: this.dropRing.x,
      y: this.dropRing.y,
      speed: { min: 80, max: 200 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      quantity: 24,
      blendMode: 'ADD'
    });
    this.time.delayedCall(500, () => emitter.stop());
    this.time.delayedCall(1000, () => emitter.manager.destroy());
  }

  addLog(message, success) {
    const timestamp = new Date().toLocaleTimeString();
    const entry = `${timestamp}  ${message}`;
    this.logEntries.unshift({ message: entry, success });
    if (this.logEntries.length > DISCOVERY_LIMIT) {
      this.logEntries.length = DISCOVERY_LIMIT;
    }
    this.renderLog();
  }

  renderLog() {
    this.logGroup.clear(true, true);
    this.logEntries.forEach((entry, index) => {
      const text = this.add.text(this.scale.width * 0.03, this.scale.height * 0.6 + index * 26, entry.message, {
        fontFamily: 'Rajdhani',
        fontSize: '18px',
        color: entry.success ? '#7dffec' : '#ff7676'
      });
      this.logGroup.add(text);
    });
  }

  tickEnergy() {
    const state = this.registry.get('game-state');
    const changed = state.applyEnergyRegen();
    if (changed) {
      saveState(state.toJSON());
      this.game.events.emit('energy-changed', {
        energy: state.energy,
        maxEnergy: state.maxEnergy,
        regenInterval: getEnergyRegenInterval()
      });
    }
  }
}
