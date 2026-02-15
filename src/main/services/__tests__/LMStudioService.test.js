const LMStudioService = require('../LMStudioService');

describe('LMStudioService', () => {
  test('checkConnection returns connected:false when client GET fails', async () => {
    const svc = new LMStudioService();
    svc.client = { get: jest.fn().mockRejectedValue(new Error('network')) };

    const res = await svc.checkConnection();
    expect(res.connected).toBe(false);
    expect(res.error).toBeDefined();
  });

  test('generateCreatureFromEgg returns fallback when AI is unavailable', async () => {
    const svc = new LMStudioService();
    svc.client = { post: jest.fn().mockRejectedValue(new Error('offline')) };

    const creature = await svc.generateCreatureFromEgg('mystic');
    expect(creature).toBeDefined();
    expect(creature.name).toMatch(/Misty|Pebble/);
    expect(creature.stage).toBe('baby');
    expect(creature.stats).toHaveProperty('health');
  });

  test('generateCreatureFromEgg parses AI response when available', async () => {
    const svc = new LMStudioService();

    const aiCreature = {
      name: 'AiBuddy',
      type: 'slime',
      stage: 'baby',
      appearance: {
        baseColor: '#00FF00',
        glowColor: '#00FF88',
        shape: 'blob',
        radius: 40,
        tentacles: 0,
        eyeCount: 2,
        specialFeatures: []
      },
      personality: { traits: ['playful'], mood: 'happy' },
      stats: { health: 85, energy: 80, happiness: 70, hunger: 40, weight: 20, hygiene: 95, discipline: 0 }
    };

    const fakeResp = { data: { choices: [ { message: { content: JSON.stringify(aiCreature) } } ] } };
    svc.client = { post: jest.fn().mockResolvedValue(fakeResp) };

    const creature = await svc.generateCreatureFromEgg('mystic');
    expect(creature.name).toBe('AiBuddy');
    expect(creature.stage).toBe('baby');
    expect(creature.stats.age).toBe(0);
    expect(creature.state).toBeDefined();
  });
});
