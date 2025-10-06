import { INITIAL_ELEMENTS, AGES, AGE_THRESHOLDS } from './Combos.js';

const ENERGY_MAX = 20;
const ENERGY_REGEN_INTERVAL = 90 * 1000;

export class GameState {
  constructor(data) {
    this.discovered = new Set(data?.discovered ?? INITIAL_ELEMENTS);
    this.energy = data?.energy ?? ENERGY_MAX;
    this.maxEnergy = data?.maxEnergy ?? ENERGY_MAX;
    this.lastEnergyTimestamp = data?.lastEnergyTimestamp ?? Date.now();
    this.legacyLevel = data?.legacyLevel ?? 0;
    this.theme = data?.theme ?? 'neon';
    this.tutorialSeen = data?.tutorialSeen ?? false;
    this.age = data?.age ?? 'Primal';
  }

  clone() {
    return new GameState(this.toJSON());
  }

  toJSON() {
    return {
      discovered: Array.from(this.discovered),
      energy: this.energy,
      maxEnergy: this.maxEnergy,
      lastEnergyTimestamp: this.lastEnergyTimestamp,
      legacyLevel: this.legacyLevel,
      theme: this.theme,
      tutorialSeen: this.tutorialSeen,
      age: this.age
    };
  }

  applyEnergyRegen(now = Date.now()) {
    if (this.energy >= this.maxEnergy) {
      this.lastEnergyTimestamp = now;
      return false;
    }
    const elapsed = now - this.lastEnergyTimestamp;
    if (elapsed < ENERGY_REGEN_INTERVAL) {
      return false;
    }
    const regenCount = Math.floor(elapsed / ENERGY_REGEN_INTERVAL);
    this.energy = Math.min(this.maxEnergy, this.energy + regenCount);
    this.lastEnergyTimestamp = now - (elapsed % ENERGY_REGEN_INTERVAL);
    return regenCount > 0;
  }

  spendEnergy(amount = 1, now = Date.now()) {
    this.applyEnergyRegen(now);
    if (this.energy < amount) {
      return false;
    }
    this.energy -= amount;
    this.lastEnergyTimestamp = now;
    return true;
  }

  grantEnergy(amount = 1, now = Date.now()) {
    this.applyEnergyRegen(now);
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
    this.lastEnergyTimestamp = now;
  }

  registerDiscovery(element) {
    const beforeSize = this.discovered.size;
    this.discovered.add(element);
    if (this.discovered.size !== beforeSize) {
      this.recalculateAge();
      return true;
    }
    return false;
  }

  resetUniverse() {
    this.legacyLevel += 1;
    this.discovered = new Set(INITIAL_ELEMENTS);
    this.energy = this.maxEnergy;
    this.lastEnergyTimestamp = Date.now();
    this.age = 'Primal';
  }

  recalculateAge() {
    const count = this.discovered.size;
    let newAge = 'Primal';
    for (const age of AGES) {
      if (count >= AGE_THRESHOLDS[age] ?? 0) {
        newAge = age;
      }
    }
    this.age = newAge;
  }
}

export function createInitialState() {
  const state = new GameState();
  state.recalculateAge();
  return state;
}

export function reviveState(serialised) {
  if (!serialised) {
    return createInitialState();
  }
  return new GameState(serialised);
}

export function getEnergyRegenInterval() {
  return ENERGY_REGEN_INTERVAL;
}
