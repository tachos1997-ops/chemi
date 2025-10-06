import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

class StorageServiceClass {
  constructor() {
    this.initialized = false;
    this.sqlite = null;
    this.db = null;
    this.settings = {
      sound: true,
      music: true,
      theme: 'neon',
    };
    this.platform = Capacitor.getPlatform();
  }

  async init() {
    if (this.initialized) return;
    try {
      this.sqlite = new SQLiteConnection(CapacitorSQLite);
      const db = await this.sqlite.createConnection('elemental_nexus', false, 'no-encryption', 1);
      await db.open();
      await db.execute(`CREATE TABLE IF NOT EXISTS saves (id INTEGER PRIMARY KEY NOT NULL, data TEXT NOT NULL);`);
      await db.execute(`CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY NOT NULL, data TEXT NOT NULL);`);
      const storedSettings = await db.query(`SELECT data FROM settings WHERE id = 1;`);
      if (storedSettings?.values?.length) {
        this.settings = { ...this.settings, ...JSON.parse(storedSettings.values[0].data) };
      }
      this.db = db;
      this.initialized = true;
    } catch (err) {
      console.warn('[StorageService] Falling back to localStorage', err);
      this.initialized = true;
      this.db = null;
      this.loadSettingsFromLocal();
    }
  }

  async loadGame() {
    if (!this.initialized) {
      await this.init();
    }
    if (this.db) {
      const result = await this.db.query('SELECT data FROM saves WHERE id = 1;');
      if (result?.values?.length) {
        return JSON.parse(result.values[0].data);
      }
      return null;
    }
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('elemental-nexus-save') : null;
    return raw ? JSON.parse(raw) : null;
  }

  async saveGame(data) {
    if (!this.initialized) {
      await this.init();
    }
    const payload = JSON.stringify(data);
    if (this.db) {
      await this.db.run('INSERT OR REPLACE INTO saves (id, data) VALUES (1, ?);', [payload]);
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem('elemental-nexus-save', payload);
    }
  }

  loadSettingsFromLocal() {
    if (typeof localStorage === 'undefined') return;
    const raw = localStorage.getItem('elemental-nexus-settings');
    if (raw) {
      this.settings = { ...this.settings, ...JSON.parse(raw) };
    }
  }

  persistSettings() {
    const payload = JSON.stringify(this.settings);
    if (this.db) {
      this.db.run('INSERT OR REPLACE INTO settings (id, data) VALUES (1, ?);', [payload]);
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem('elemental-nexus-settings', payload);
    }
  }
}

export const StorageService = new StorageServiceClass();
