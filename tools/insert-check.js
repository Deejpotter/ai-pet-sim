const fs = require('fs');
const p = 'src/main/services/LMStudioService.js';
let s = fs.readFileSync(p, 'utf8');
const asyncIdx = s.indexOf('async generateCreatureFromEgg(');
if (asyncIdx === -1) {
  console.error('async generateCreatureFromEgg not found');
  process.exit(1);
}
if (s.includes('async checkConnection')) {
  console.log('checkConnection already present');
  process.exit(0);
}
const method = `
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

`;
const out = s.slice(0, asyncIdx) + method + s.slice(asyncIdx);
fs.writeFileSync(p, out, 'utf8');
console.log('inserted checkConnection');
