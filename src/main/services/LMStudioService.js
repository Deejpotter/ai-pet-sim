/**
 * LMStudioService.js - AI integration for creature generation
 * 
 * DESIGN DECISIONS:
 * 
 * 1. JSON SCHEMA STRUCTURED OUTPUT:
 *    - Uses LM Studio's json_schema response_format for reliable JSON
 *    - Schema enforces type constraints, ranges, and required fields
 *    - "stage": "baby" is hardcoded via const constraint
 *    
 *    Rationale: Structured output eliminates parsing errors and ensures
 *    the AI returns valid, complete creature data. Better than markdown
 *    stripping or hoping for valid JSON.
 * 
 * 2. EGG TYPE THEMES:
 *    - Each egg type has descriptive theme for AI context
 *    - Themes guide visual appearance and personality generation
 *    - No gameplay differences between types (cosmetic only)
 *    
 *    Rationale: Egg types provide variety without complexity. Players
 *    can choose aesthetic without worrying about "best" choice.
 * 
 * 3. STAT RANGES IN SCHEMA:
 *    - Health: 50-100 (new creatures start healthy)
 *    - Hunger: 30-70 (slightly hungry but not starving)
 *    - Happiness: 40-80 (moderately happy)
 *    - Weight: 15-30g (reasonable starting weight)
 *    
 *    Rationale: Starting stats give immediate care opportunities without
 *    being critical. Player has time to learn before pet is in danger.
 * 
 * 4. ERROR HANDLING:
 *    - Try-catch around JSON parsing
 *    - Graceful degradation with fallback creature
 *    - Detailed error logging
 *    
 *    Rationale: AI generation can fail. App should still work with
 *    fallback data rather than crashing.
 */

const axios = require('axios');

class LMStudioService {
  constructor() {
    this.url = process.env.LM_STUDIO_URL || 'http://localhost:1234';
    this.timeout = 5000;
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.fallbackModels = ['mistralai/ministral-7b', 'mistralai/mini-2.7b'];

    // axios client for LM Studio-compatible endpoints
    this.client = axios.create({ baseURL: this.url, timeout: this.timeout });
  }


  async checkConnection() {
    try {
      await this.client.get('/v1/models');
      return { connected: true };
    } catch (err) {
      try {
        await this.client.get('/');
        return { connected: true };
      } catch (err2) {
        return { connected: false, error: err2.message };
      }
    }
  }

  async generateCreatureFromEgg(eggType) {
    const eggThemes = {
      mystic: 'mystic and arcane',
      nature: 'nature and growth',
      fire: 'fiery and energetic',
      water: 'oceanic and fluid',
      shadow: 'shadowy and mysterious',
      light: 'bright and pure'
    };
    const theme = eggThemes[eggType] || String(eggType || 'mysterious');

    // Comprehensive JSON schema for creature generation
    // Enforces valid ranges and required fields
    const creatureSchema = {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'A creative, memorable name matching the theme'
        },
        type: {
          type: 'string',
          enum: ['slime', 'blob', 'creature', 'monster']
        },
        stage: {
          const: 'baby'  // Force baby stage for new creatures
        },
        appearance: {
          type: 'object',
          properties: {
            baseColor: {
              type: 'string',
              pattern: '^#[0-9A-Fa-f]{6}$',
              description: 'Main body color in hex'
            },
            glowColor: {
              type: 'string',
              pattern: '^#[0-9A-Fa-f]{6}$',
              description: 'Glow/aura color in hex'
            },
            shape: {
              type: 'string',
              enum: ['circle', 'blob', 'oval']
            },
            radius: {
              type: 'integer',
              minimum: 30,
              maximum: 80
            },
            tentacles: {
              type: 'integer',
              minimum: 0,
              maximum: 8
            },
            eyeCount: {
              type: 'integer',
              minimum: 0,
              maximum: 4
            },
            specialFeatures: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['baseColor', 'glowColor', 'shape', 'radius', 'tentacles', 'eyeCount', 'specialFeatures']
        },
        personality: {
          type: 'object',
          properties: {
            traits: {
              type: 'array',
              items: { type: 'string' }
            },
            mood: { type: 'string' }
          },
          required: ['traits', 'mood']
        },
        stats: {
          type: 'object',
          properties: {
            // Core stats
            health: { type: 'integer', minimum: 70, maximum: 100 },
            energy: { type: 'integer', minimum: 60, maximum: 100 },
            happiness: { type: 'integer', minimum: 50, maximum: 80 },
            hunger: { type: 'integer', minimum: 30, maximum: 60 },

            // Expanded Tamagotchi stats
            weight: { type: 'integer', minimum: 15, maximum: 30 },
            hygiene: { type: 'integer', minimum: 80, maximum: 100 },
            discipline: { type: 'integer', minimum: 0, maximum: 2 }
          },
          required: ['health', 'energy', 'happiness', 'hunger', 'weight', 'hygiene', 'discipline']
        }
      },
      required: ['name', 'type', 'stage', 'appearance', 'personality', 'stats']
    };

    try {
      const resp = await this.client.post('/v1/chat/completions', {
        model: 'local-model',
        messages: [
          { role: 'system', content: `You are a creative creature generator for a virtual pet game.` },
          { role: 'user', content: `Create a unique baby creature hatched from a ${eggType} egg. Theme: ${theme}. Return JSON that matches schema.` }
        ],
        temperature: 0.8,
        max_tokens: 800,
        response_format: { type: 'json_schema', json_schema: { name: 'creature_response', strict: true, schema: creatureSchema } }
      });

      const content = resp?.data?.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty AI response');

      const creatureData = JSON.parse(content);
      return this._normalizeCreatureResponse(creatureData);
    } catch (err) {
      console.warn('LMStudioService.generateCreatureFromEgg - AI failed, using fallback:', err.message);
      return this._generateFallbackCreature(eggType);
    }
  }

  _normalizeCreatureResponse(data) {
    return {
      ...data,
      stage: 'baby',
      state: { isSick: false, isSleeping: false, isDead: false, lightsOn: true, lastSickAt: null, diedAt: null },
      stats: { ...data.stats, age: 0, hiddenHungerHearts: 0, hiddenHappinessHearts: 0, snacksEaten: 0, sicknessCount: 0 },
      careMistakes: { physical: [], mental: [], total: 0 },
      attentionCalls: [],
      poops: [],
      evolutionHistory: []
    };
  }

  _generateFallbackCreature(eggType) {
    const presets = {
      mystic: { name: 'Misty', baseColor: '#8B5CF6', glowColor: '#A78BFA' },
      nature: { name: 'Sprout', baseColor: '#22C55E', glowColor: '#86EFAC' },
      fire: { name: 'Blaze', baseColor: '#EF4444', glowColor: '#FCA5A5' },
      water: { name: 'Ripple', baseColor: '#3B82F6', glowColor: '#93C5FD' },
      shadow: { name: 'Umbra', baseColor: '#6B7280', glowColor: '#9CA3AF' },
      light: { name: 'Glim', baseColor: '#EAB308', glowColor: '#FDE68A' }
    };

    const p = presets[eggType] || { name: 'Pebble', baseColor: '#8B5CF6', glowColor: '#A78BFA' };

    return {
      name: `${p.name} (${eggType})`,
      type: 'creature',
      stage: 'baby',
      appearance: {
        baseColor: p.baseColor,
        glowColor: p.glowColor,
        shape: 'blob',
        radius: 50,
        tentacles: 0,
        eyeCount: 2,
        specialFeatures: []
      },
      personality: { traits: ['curious'], mood: 'happy' },
      stats: { health: 90, energy: 90, happiness: 70, hunger: 40, weight: 20, hygiene: 95, discipline: 0, age: 0, hiddenHungerHearts: 0, hiddenHappinessHearts: 0, snacksEaten: 0, sicknessCount: 0 },
      state: { isSick: false, isSleeping: false, isDead: false, lightsOn: true, lastSickAt: null, diedAt: null },
      careMistakes: { physical: [], mental: [], total: 0 },
      attentionCalls: [],
      poops: [],
      evolutionHistory: []
    };
  }

  async generateEvolutionEvent(creature, action) {
    const evolutionSchema = {
      type: 'object',
      properties: {
        evolved: { type: 'boolean' },
        newStage: {
          type: 'string',
          enum: ['egg', 'baby', 'child', 'teen', 'adult', 'elder']
        },
        statChanges: {
          type: 'object',
          properties: {
            health: { type: 'integer' },
            energy: { type: 'integer' },
            happiness: { type: 'integer' },
            hunger: { type: 'integer' },
            weight: { type: 'integer' }
          },
          required: ['health', 'energy', 'happiness', 'hunger', 'weight']
        },
        event: { type: 'string' },
        newFeatures: {
          type: 'array',
          items: { type: 'string' }
        },
        message: { type: 'string' }
      },
      required: ['evolved', 'newStage', 'statChanges', 'event', 'newFeatures', 'message']
    };

    const response = await this.client.post('/v1/chat/completions', {
      model: 'local-model',
      messages: [
        {
          role: 'system',
          content: 'You are an evolution event generator for a virtual pet game. Determine what happens based on the creature state and user action.'
        },
        {
          role: 'user',
          content: `Creature "${creature.name}" (a ${creature.type}) is at stage "${creature.stage}". 
User performed action: "${action}". 
Current stats: ${JSON.stringify(creature.stats)}.
What happens?`
        }
      ],
      temperature: 0.7,
      max_tokens: 400,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'evolution_response',
          strict: true,
          schema: evolutionSchema
        }
      }
    });

    return JSON.parse(response.data.choices[0].message.content);
  }
}

module.exports = LMStudioService;
