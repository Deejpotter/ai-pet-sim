const fs = require('fs').promises;
const path = require('path');
const { app } = require('electron');

class FileStorage {
  constructor() {
    this.basePath = path.join(app.getPath('userData'), 'ai-pet-sim');
    this.ensureDirectory();
  }

  async ensureDirectory() {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
    } catch (error) {
      console.error('Failed to create storage directory:', error);
    }
  }

  async read(key) {
    const filePath = path.join(this.basePath, `${key}.json`);
    
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
  }

  async write(key, data) {
    const filePath = path.join(this.basePath, `${key}.json`);
    
    // Backup existing file
    await this.backup(key);
    
    // Write new data
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  async backup(key) {
    try {
      const filePath = path.join(this.basePath, `${key}.json`);
      const backupDir = path.join(this.basePath, 'backups');
      const backupPath = path.join(backupDir, `${key}_${Date.now()}.json`);
      
      await fs.mkdir(backupDir, { recursive: true });
      
      const data = await fs.readFile(filePath);
      await fs.writeFile(backupPath, data);
      
      // Keep only last 10 backups
      await this.cleanupBackups(key, 10);
    } catch (error) {
      // File doesn't exist, no backup needed
    }
  }

  async cleanupBackups(key, maxBackups) {
    try {
      const backupDir = path.join(this.basePath, 'backups');
      const files = await fs.readdir(backupDir);
      
      const keyBackups = files
        .filter(f => f.startsWith(`${key}_`))
        .sort()
        .reverse();
      
      if (keyBackups.length > maxBackups) {
        const toDelete = keyBackups.slice(maxBackups);
        for (const file of toDelete) {
          await fs.unlink(path.join(backupDir, file));
        }
      }
    } catch (error) {
      console.error('Failed to cleanup backups:', error);
    }
  }
}

module.exports = FileStorage;
