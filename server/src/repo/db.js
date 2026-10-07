import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSeedData } from '../seed/seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(__dirname, '../../../server/data');

const DB_PATH = path.join(DATA_DIR, 'db.json');
const TEMP_DB_PATH = path.join(DATA_DIR, 'db.json.tmp');

let memoryDb = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function writeAtomic(data) {
  ensureDataDir();
  const jsonStr = JSON.stringify(data, null, 2);
  try {
    fs.writeFileSync(TEMP_DB_PATH, jsonStr, 'utf8');
    fs.renameSync(TEMP_DB_PATH, DB_PATH);
  } catch (err) {
    fs.writeFileSync(DB_PATH, jsonStr, 'utf8');
  }
}

export function initDb(forceReseed = false) {
  ensureDataDir();
  if (forceReseed || !fs.existsSync(DB_PATH)) {
    const seed = getSeedData();
    memoryDb = seed;
    writeAtomic(seed);
    return memoryDb;
  }

  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.rules)) {
      throw new Error('Corrupt DB structure');
    }
    memoryDb = parsed;
  } catch (err) {
    console.warn('[DB] DB file corrupt or unreadable, reseeding automatically...', err.message);
    const seed = getSeedData();
    memoryDb = seed;
    writeAtomic(seed);
  }
  return memoryDb;
}

export function getDb() {
  if (!memoryDb) {
    return initDb();
  }
  return memoryDb;
}

export function saveDb() {
  if (!memoryDb) return;
  if (memoryDb.auditLogs && memoryDb.auditLogs.length > 1000) {
    memoryDb.auditLogs = memoryDb.auditLogs.slice(-1000);
  }
  writeAtomic(memoryDb);
}

export function resetToSeed() {
  return initDb(true);
}

export const dbRepository = {
  resetToSeed() {
    return resetToSeed();
  },
  getDepartments() {
    return getDb().departments || [];
  },
  saveDepartments(departments) {
    const db = getDb();
    db.departments = departments;
    saveDb();
    return db.departments;
  },
  getDepartmentById(id) {
    if (!id) return null;
    return this.getDepartments().find(d =>
      d.id.toLowerCase() === id.toLowerCase() ||
      d.name.toLowerCase() === id.toLowerCase()
    );
  },
  getResources() {
    return getDb().resources || [];
  },
  getResourceById(id) {
    return this.getResources().find(r => r.id === id);
  },
  saveResources(resources) {
    const db = getDb();
    db.resources = resources;
    saveDb();
    return db.resources;
  },
  getUsers() {
    return getDb().users || [];
  },
  getUserById(id) {
    return this.getUsers().find(u => u.id === id);
  },
  getUserByEmail(email) {
    if (!email) return null;
    return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  },
  saveUsers(users) {
    const db = getDb();
    db.users = users;
    saveDb();
    return db.users;
  },
  getRules() {
    return getDb().rules || [];
  },
  saveRules(rules) {
    const db = getDb();
    db.rules = rules;
    saveDb();
    return db.rules;
  },
  getAccessRequests() {
    return getDb().accessRequests || [];
  },
  saveAccessRequests(requests) {
    const db = getDb();
    db.accessRequests = requests;
    saveDb();
    return db.accessRequests;
  },
  getAuditLogs() {
    return getDb().auditLogs || [];
  },
  addAuditLog(entry) {
    const db = getDb();
    if (!db.auditLogs) db.auditLogs = [];
    const fullEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    db.auditLogs.push(fullEntry);
    saveDb();
    return fullEntry;
  },
  getConfigHistory() {
    return getDb().configHistory || {};
  },
  saveConfigHistory(history) {
    const db = getDb();
    db.configHistory = history;
    saveDb();
    return db.configHistory;
  }
};
