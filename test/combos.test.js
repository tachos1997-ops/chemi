import { COMBOS, INITIAL_ELEMENTS, AGES, findCombo } from '../elemental-nexus/src/utils/Combos.js';

describe('Combos dataset', () => {
  test('contains at least 100 recipes', () => {
    expect(COMBOS.length).toBeGreaterThanOrEqual(100);
  });

  test('all results are unique', () => {
    const results = new Set(COMBOS.map((combo) => combo.result));
    expect(results.size).toBe(COMBOS.length);
  });

  test('all combos use known elements', () => {
    const known = new Set([...INITIAL_ELEMENTS, ...COMBOS.map((combo) => combo.result)]);
    COMBOS.forEach((combo) => {
      combo.ingredients.forEach((ingredient) => {
        expect(known.has(ingredient)).toBe(true);
      });
      expect(AGES.includes(combo.age)).toBe(true);
    });
  });

  test('findCombo resolves regardless of order', () => {
    const sample = COMBOS[10];
    expect(findCombo(sample.ingredients[0], sample.ingredients[1])?.result).toBe(sample.result);
    expect(findCombo(sample.ingredients[1], sample.ingredients[0])?.result).toBe(sample.result);
  });
});
