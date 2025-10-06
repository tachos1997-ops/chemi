import { Capacitor } from '@capacitor/core';

const DB_NAME = 'elemental_nexus';
const TABLE_NAME = 'saves';

class LocalStorageDriver {
  constructor(key) {
    this.key = key;
  }

  async init() {
    return true;
  }

  async readState() {
    const raw = localStorage.getItem(this.key);
    return raw ? JSON.parse(raw) : null;
  }

  async writeState(state) {
    localStorage.setItem(this.key, JSON.stringify(state));
  }
}

class SQLiteDriver {
  constructor(sqlite) {
    this.sqlite = sqlite;
    this.connection = null;
  }

  async init() {
    this.connection = await this.sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
    await this.connection.open();
    await this.connection.execute(`CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (id INTEGER PRIMARY KEY NOT NULL, data TEXT NOT NULL)`);
  }

  async readState() {
    const results = await this.connection.query(`SELECT data FROM ${TABLE_NAME} WHERE id = 1`);
    if (results && results.values && results.values.length > 0) {
      return JSON.parse(results.values[0].data);
    }
    return null;
  }

  async writeState(state) {
    const payload = JSON.stringify(state);
    await this.connection.execute(`INSERT OR REPLACE INTO ${TABLE_NAME} (id, data) VALUES (1, ?)`, [payload]);
  }
}

let driverPromise = null;

export function initStorage() {
  if (!driverPromise) {
    driverPromise = (async () => {
      if (Capacitor?.isNativePlatform?.()) {
        const sqliteModule = await import('@capacitor-community/sqlite').then((m) => m).catch(() => null);
        if (sqliteModule?.CapacitorSQLite) {
          const sqlite = sqliteModule.CapacitorSQLite;
          const driver = new SQLiteDriver(sqlite);
          await driver.init();
          return driver;
        }
      }
      const fallback = new LocalStorageDriver('elemental-nexus-save');
      await fallback.init();
      return fallback;
    })();
  }
  return driverPromise;
}

export async function loadState() {
  const driver = await initStorage();
  return driver.readState();
}

export async function saveState(state) {
  const driver = await initStorage();
  await driver.writeState(state);
}
