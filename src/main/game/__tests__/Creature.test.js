const Creature = require('../Creature');

describe('Creature - core behavior', () => {
  test('updateStats applies decay correctly when awake', () => {
    const c = new Creature({
      stats: { hunger: 10, happiness: 50, energy: 50, hygiene: 100, age: 0 }
    });

    // prevent sleep logic from interfering with deterministic stat decay
    c.updateSleepState = jest.fn();

    // Use 10 minutes
    c.updateStats(10);

    // hunger += 0.5/min => +5
    expect(c.stats.hunger).toBeCloseTo(15, 5);

    // happiness -= 0.2/min => -2
    expect(c.stats.happiness).toBeCloseTo(48, 5);

    // energy -= 0.3/min => -3
    expect(c.stats.energy).toBeCloseTo(47, 5);

    // hygiene -= 0.1/min => -1
    expect(c.stats.hygiene).toBeCloseTo(99, 5);

    // age increased by minutes / (24*60)
    expect(c.stats.age).toBeCloseTo(10 / (24 * 60), 6);
  });

  test('feed reduces hunger, increases weight and updates stats (no poop)', async () => {
    const c = new Creature({
      name: 'Testy',
      stats: { hunger: 60, health: 50, energy: 40, weight: 20, snacksEaten: 0 }
    });

    // Force Math.random to > 0.5 so addPoop is NOT called
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.99);

    const result = await c.feed(20);

    // hunger decreased by 20
    expect(c.stats.hunger).toBe(40);

    // weight increased by 5
    expect(c.stats.weight).toBe(25);

    // hungerChange = 20 -> healthGain = 20, energyGain = 8
    expect(result.statChanges).toMatchObject({ hunger: 20, weight: 5, health: 20, energy: 8 });
    expect(result.success).toBe(true);

    randomSpy.mockRestore();
  });
});
