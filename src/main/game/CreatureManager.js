const Creature = require('./Creature');

class CreatureManager {
  constructor(storage) {
    this.storage = storage;
    this.currentCreature = null;
    this.autoSaveInterval = null;
  }

  async createCreature(data) {
    const creature = new Creature(data);
    await this.saveCreature(creature);
    this.currentCreature = creature;
    this.startAutoSave();
    return creature;
  }

  async getCurrentCreature() {
    if (this.currentCreature) {
      return this.currentCreature;
    }

    const data = await this.storage.read('creature');
    if (data) {
      this.currentCreature = new Creature(data);
      this.startAutoSave();
      return this.currentCreature;
    }

    return null;
  }

  async saveCreature(creature) {
    if (!creature) return;
    await this.storage.write('creature', creature.toJSON());
  }

  async archiveCreature(creature) {
    // Save to history
    const history = await this.storage.read('history') || [];
    history.push({
      ...creature.toJSON(),
      archivedAt: Date.now()
    });
    await this.storage.write('history', history);

    // Clear current
    await this.storage.write('creature', null);
    this.currentCreature = null;
    this.stopAutoSave();
  }

  startAutoSave() {
    if (this.autoSaveInterval) return;
    
    // Auto-save every 5 minutes
    this.autoSaveInterval = setInterval(async () => {
      if (this.currentCreature) {
        await this.saveCreature(this.currentCreature);
      }
    }, 5 * 60 * 1000);
  }

  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }
}

module.exports = CreatureManager;
