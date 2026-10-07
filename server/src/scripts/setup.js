import { resetToSeed } from '../repo/db.js';

console.log('[SETUP] Initializing EnterpriseNet Access Portal database...');
resetToSeed();
console.log('[SETUP] Seed data successfully generated at server/data/db.json!');
process.exit(0);
