/**
 * Database Service - JSON-based persistence layer
 * 
 * This provides a clean repository pattern for data access.
 * Can be replaced with MongoDB or any other database without
 * changing the service layer.
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '../../storage/data');

// Ensure storage directory exists
if (!fs.existsSync(DB_PATH)) {
  fs.mkdirSync(DB_PATH, { recursive: true });
}

/**
 * Generic collection handler - simulates a database collection
 */
class Collection {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(DB_PATH, `${name}.json`);
    this._ensureFile();
  }

  _ensureFile() {
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
    }
  }

  _read() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  _write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  findAll() {
    return this._read();
  }

  findById(id) {
    const data = this._read();
    return data.find(item => item.id === id) || null;
  }

  findOne(query) {
    const data = this._read();
    return data.find(item => {
      return Object.keys(query).every(key => item[key] === query[key]);
    }) || null;
  }

  find(query) {
    const data = this._read();
    return data.filter(item => {
      return Object.keys(query).every(key => item[key] === query[key]);
    });
  }

  insert(document) {
    const data = this._read();
    const newDoc = {
      id: document.id || uuidv4(),
      ...document,
      createdAt: document.createdAt || new Date().toISOString(),
      updatedAt: document.updatedAt || new Date().toISOString(),
    };
    data.push(newDoc);
    this._write(data);
    return newDoc;
  }

  updateById(id, updates) {
    const data = this._read();
    const index = data.findIndex(item => item.id === id);
    if (index === -1) return null;
    data[index] = {
      ...data[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this._write(data);
    return data[index];
  }

  deleteById(id) {
    const data = this._read();
    const index = data.findIndex(item => item.id === id);
    if (index === -1) return false;
    data.splice(index, 1);
    this._write(data);
    return true;
  }

  count(query = {}) {
    if (Object.keys(query).length === 0) {
      return this._read().length;
    }
    return this.find(query).length;
  }

  clear() {
    this._write([]);
  }
}

// Database collections
const db = {
  patients: new Collection('patients'),
  doctors: new Collection('doctors'),
  medicalRecords: new Collection('medical_records'),
  auditLogs: new Collection('audit_logs'),
  encryptedKeys: new Collection('encrypted_keys'),
};

module.exports = db;
