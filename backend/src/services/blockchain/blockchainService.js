/**
 * Simulated Blockchain Service
 * 
 * IMPLEMENTATION STATUS: SIMULATED
 * This implements a local blockchain simulation for development/prototype purposes.
 * Phase 2 will deploy to an actual blockchain network (e.g., Ethereum Sepolia testnet).
 * 
 * The blockchain maintains:
 * - Cryptographic hash chain (SHA-256)
 * - Immutable transaction records
 * - Medical record references (NOT actual medical data)
 * - Audit trail of all healthcare operations
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../../config');

const BLOCKCHAIN_FILE = path.join(config.storage.blockchainPath, 'ledger.json');
const DIFFICULTY = 2; // Proof of work difficulty (leading zeros)

// Ensure blockchain storage directory exists
if (!fs.existsSync(config.storage.blockchainPath)) {
  fs.mkdirSync(config.storage.blockchainPath, { recursive: true });
}

/**
 * Block structure
 */
class Block {
  constructor(index, transactions, previousHash) {
    this.index = index;
    this.timestamp = new Date().toISOString();
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto.createHash('sha256')
      .update(
        this.index +
        this.timestamp +
        this.previousHash +
        JSON.stringify(this.transactions) +
        this.nonce
      )
      .digest('hex');
  }

  mine(difficulty) {
    const target = Array(difficulty + 1).join('0');
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    return this;
  }
}

/**
 * Transaction types
 */
const TRANSACTION_TYPES = {
  PATIENT_REGISTERED: 'PATIENT_REGISTERED',
  MEDICAL_RECORD_CREATED: 'MEDICAL_RECORD_CREATED',
  MEDICAL_RECORD_ACCESSED: 'MEDICAL_RECORD_ACCESSED',
  DOCTOR_AUTHORIZED: 'DOCTOR_AUTHORIZED',
  DOCTOR_REGISTERED: 'DOCTOR_REGISTERED',
};

/**
 * Blockchain class
 */
class Blockchain {
  constructor() {
    this.chain = this._loadChain();
    if (this.chain.length === 0) {
      this.chain = [this._createGenesisBlock()];
      this._saveChain();
    }
    this.pendingTransactions = [];
  }

  /**
   * Create the genesis block (first block in chain)
   */
  _createGenesisBlock() {
    const genesis = {
      index: 0,
      timestamp: new Date().toISOString(),
      transactions: [{
        transactionId: 'genesis',
        type: 'GENESIS',
        message: 'Healthcare Blockchain System - Phase 1 Genesis Block',
        systemInfo: {
          name: 'HealthChain',
          version: '1.0.0-prototype',
          status: 'SIMULATED',
        },
      }],
      previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
      nonce: 0,
    };
    
    genesis.hash = crypto.createHash('sha256')
      .update(
        genesis.index +
        genesis.timestamp +
        genesis.previousHash +
        JSON.stringify(genesis.transactions) +
        genesis.nonce
      )
      .digest('hex');
    
    return genesis;
  }

  /**
   * Load chain from persistent storage
   */
  _loadChain() {
    try {
      if (fs.existsSync(BLOCKCHAIN_FILE)) {
        const data = fs.readFileSync(BLOCKCHAIN_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (err) {
      console.error('[Blockchain] Error loading chain:', err.message);
    }
    return [];
  }

  /**
   * Save chain to persistent storage
   */
  _saveChain() {
    fs.writeFileSync(BLOCKCHAIN_FILE, JSON.stringify(this.chain, null, 2));
  }

  /**
   * Get the latest block in the chain
   */
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Calculate hash of a block
   */
  calculateBlockHash(block) {
    return crypto.createHash('sha256')
      .update(
        block.index +
        block.timestamp +
        block.previousHash +
        JSON.stringify(block.transactions) +
        block.nonce
      )
      .digest('hex');
  }

  /**
   * Create a new transaction
   * 
   * @param {string} type - Transaction type
   * @param {string} actorId - ID of the actor performing the action
   * @param {string} patientId - Patient's ID
   * @param {Object} metadata - Additional transaction data
   * @returns {Object} Created transaction
   */
  createTransaction(type, actorId, patientId, metadata = {}) {
    const transaction = {
      transactionId: uuidv4(),
      type,
      actorId,
      patientId,
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        // Never store actual medical data in blockchain
        // Only store references and hashes
      },
    };
    
    this.pendingTransactions.push(transaction);
    return transaction;
  }

  /**
   * Mine pending transactions into a new block
   * 
   * @returns {Object} The newly created block
   */
  minePendingTransactions() {
    const previousBlock = this.getLatestBlock();
    const newBlock = new Block(
      this.chain.length,
      [...this.pendingTransactions],
      previousBlock.hash
    );
    
    newBlock.mine(DIFFICULTY);
    
    this.chain.push({
      index: newBlock.index,
      timestamp: newBlock.timestamp,
      transactions: newBlock.transactions,
      previousHash: newBlock.previousHash,
      hash: newBlock.hash,
      nonce: newBlock.nonce,
    });
    
    this.pendingTransactions = [];
    this._saveChain();
    
    return this.getLatestBlock();
  }

  /**
   * Add a transaction and immediately mine it into a block
   * For prototype: each transaction gets its own block
   * 
   * @param {string} type - Transaction type
   * @param {string} actorId - Actor's ID
   * @param {string} patientId - Patient's ID
   * @param {Object} metadata - Additional data (references only, no medical data)
   * @returns {Object} Result with transaction and block
   */
  addTransaction(type, actorId, patientId, metadata = {}) {
    const startTime = Date.now();
    const transaction = this.createTransaction(type, actorId, patientId, metadata);
    const block = this.minePendingTransactions();
    const blockchainTimeMs = Date.now() - startTime;
    
    return {
      transaction,
      block,
      blockchainTimeMs,
    };
  }

  /**
   * Validate the blockchain integrity
   * Checks that all hashes are correct and chain is unbroken
   * 
   * @returns {Object} Validation result
   */
  validateChain() {
    const issues = [];
    
    // Validate genesis block
    const genesis = this.chain[0];
    if (!genesis || genesis.index !== 0) {
      issues.push('Genesis block missing or invalid');
    }
    
    // Validate each block
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];
      
      // Check hash integrity
      const recalculatedHash = crypto.createHash('sha256')
        .update(
          currentBlock.index +
          currentBlock.timestamp +
          currentBlock.previousHash +
          JSON.stringify(currentBlock.transactions) +
          currentBlock.nonce
        )
        .digest('hex');
      
      if (currentBlock.hash !== recalculatedHash) {
        issues.push(`Block ${i}: Hash mismatch - data may have been tampered`);
      }
      
      // Check chain linkage
      if (currentBlock.previousHash !== previousBlock.hash) {
        issues.push(`Block ${i}: Previous hash mismatch - chain broken`);
      }
      
      // Check index sequence
      if (currentBlock.index !== i) {
        issues.push(`Block ${i}: Index mismatch`);
      }
    }
    
    const isValid = issues.length === 0;
    
    return {
      isValid,
      blockCount: this.chain.length,
      issues,
      message: isValid
        ? `Blockchain integrity verified - ${this.chain.length} blocks validated`
        : `Blockchain integrity compromised - ${issues.length} issue(s) found`,
    };
  }

  /**
   * Get all blocks
   */
  getBlocks() {
    return this.chain;
  }

  /**
   * Get all transactions across all blocks
   */
  getAllTransactions() {
    return this.chain.flatMap(block => block.transactions || []);
  }

  /**
   * Get transactions for a specific patient
   * 
   * @param {string} patientId - Patient's ID
   * @returns {Array} Patient's transactions
   */
  getPatientTransactions(patientId) {
    return this.getAllTransactions().filter(tx => tx.patientId === patientId);
  }

  /**
   * Get a specific transaction by ID
   * 
   * @param {string} transactionId - Transaction ID
   * @returns {Object|null} Transaction or null
   */
  getTransaction(transactionId) {
    return this.getAllTransactions().find(tx => tx.transactionId === transactionId) || null;
  }

  /**
   * Get blockchain statistics
   */
  getStats() {
    const allTransactions = this.getAllTransactions();
    return {
      totalBlocks: this.chain.length,
      totalTransactions: allTransactions.length,
      latestBlockHash: this.getLatestBlock()?.hash,
      latestBlockIndex: this.getLatestBlock()?.index,
      implementationStatus: 'SIMULATED',
      note: 'Phase 2: Deploy to Ethereum Sepolia testnet',
    };
  }
}

// Singleton instance
let blockchainInstance = null;

function getBlockchain() {
  if (!blockchainInstance) {
    blockchainInstance = new Blockchain();
  }
  return blockchainInstance;
}

module.exports = {
  getBlockchain,
  TRANSACTION_TYPES,
  Blockchain,
};
