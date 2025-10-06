import { GameState, createInitialState, getEnergyRegenInterval } from '../elemental-nexus/src/utils/GameState.js';

jest.useFakeTimers().setSystemTime(new Date());

describe('GameState', () => {
  test('registerDiscovery updates age thresholds', () => {
    const state = createInitialState();
    expect(state.age).toBe('Primal');
    state.registerDiscovery('Steam');
    state.registerDiscovery('Lava');
    state.registerDiscovery('Smoke');
    state.registerDiscovery('Mud');
    state.registerDiscovery('Mist');
    state.registerDiscovery('Dust');
    state.recalculateAge();
    expect(state.age).toBe('Natural');
  });

  test('energy regeneration restores units over time', () => {
    const state = new GameState({ energy: 10, maxEnergy: 20, lastEnergyTimestamp: Date.now() });
    state.spendEnergy(5);
    expect(state.energy).toBe(5);
    const interval = getEnergyRegenInterval();
    jest.setSystemTime(Date.now() + interval * 2);
    state.applyEnergyRegen(Date.now());
    expect(state.energy).toBe(7);
  });

  test('resetUniverse keeps legacy bonus', () => {
    const state = createInitialState();
    state.registerDiscovery('Steam');
    state.resetUniverse();
    expect(state.legacyLevel).toBe(1);
    expect(state.discovered.size).toBe(4);
  });
});
