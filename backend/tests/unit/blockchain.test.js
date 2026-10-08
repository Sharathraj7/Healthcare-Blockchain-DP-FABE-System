/**
 * Blockchain Service Tests
 */

const path = require('path');
const fs = require('fs');

// Override blockchain storage for tests
process.env.BLOCKCHAIN_STORAGE_PATH = path.join(__dirname, '../../storage/test-blockchain');
process.env.NODE_ENV = 'test';

const { Blockchain, TRANSACTION_TYPES } = require('../../src/services/blockchain/blockchainService');

describe('Blockchain Service', () => {
  let blockchain;
  
  beforeEach(() => {
    // Create a fresh blockchain for each test
    blockchain = new Blockchain();
    // Clear to start fresh (genesis only)
    blockchain.chain = [blockchain._createGenesisBlock()];
    blockchain._saveChain();
    blockchain.pendingTransactions = [];
  });
  
  describe('Genesis Block', () => {
    it('should create a genesis block on initialization', () => {
      expect(blockchain.chain).toHaveLength(1);
      expect(blockchain.chain[0].index).toBe(0);
      expect(blockchain.chain[0].previousHash).toBe(
        '0000000000000000000000000000000000000000000000000000000000000000'
      );
    });
    
    it('genesis block should have a valid hash', () => {
      const genesis = blockchain.chain[0];
      expect(genesis.hash).toBeDefined();
      expect(genesis.hash).toHaveLength(64);
    });
    
    it('genesis block should contain genesis transaction', () => {
      const genesis = blockchain.chain[0];
      expect(genesis.transactions).toHaveLength(1);
      expect(genesis.transactions[0].type).toBe('GENESIS');
    });
  });
  
  describe('addTransaction()', () => {
    it('should create a new block with transaction', () => {
      const result = blockchain.addTransaction(
        TRANSACTION_TYPES.MEDICAL_RECORD_CREATED,
        'patient-1',
        'patient-1',
        { recordId: 'record-1', ipfsCid: 'QmTest123' }
      );
      
      expect(result.transaction).toBeDefined();
      expect(result.block).toBeDefined();
      expect(result.transaction.type).toBe(TRANSACTION_TYPES.MEDICAL_RECORD_CREATED);
    });
    
    it('should increment block index', () => {
      blockchain.addTransaction(TRANSACTION_TYPES.PATIENT_REGISTERED, 'actor-1', 'patient-1', {});
      blockchain.addTransaction(TRANSACTION_TYPES.MEDICAL_RECORD_CREATED, 'actor-1', 'patient-1', {});
      
      expect(blockchain.chain).toHaveLength(3); // genesis + 2 blocks
      expect(blockchain.chain[1].index).toBe(1);
      expect(blockchain.chain[2].index).toBe(2);
    });
    
    it('should link blocks via previousHash', () => {
      blockchain.addTransaction(TRANSACTION_TYPES.PATIENT_REGISTERED, 'actor-1', 'patient-1', {});
      blockchain.addTransaction(TRANSACTION_TYPES.MEDICAL_RECORD_CREATED, 'actor-1', 'patient-1', {});
      
      const block1 = blockchain.chain[1];
      const block2 = blockchain.chain[2];
      
      expect(block2.previousHash).toBe(block1.hash);
      expect(block1.previousHash).toBe(blockchain.chain[0].hash);
    });
    
    it('should generate unique transaction IDs', () => {
      const result1 = blockchain.addTransaction(TRANSACTION_TYPES.PATIENT_REGISTERED, 'a1', 'p1', {});
      const result2 = blockchain.addTransaction(TRANSACTION_TYPES.PATIENT_REGISTERED, 'a2', 'p2', {});
      
      expect(result1.transaction.transactionId).not.toBe(result2.transaction.transactionId);
    });
  });
  
  describe('validateChain()', () => {
    it('should validate a valid chain', () => {
      blockchain.addTransaction(TRANSACTION_TYPES.MEDICAL_RECORD_CREATED, 'actor', 'patient', {});
      
      const result = blockchain.validateChain();
      
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
    
    it('should detect tampering', () => {
      blockchain.addTransaction(TRANSACTION_TYPES.MEDICAL_RECORD_CREATED, 'actor', 'patient', {});
      
      // Tamper with a block
      blockchain.chain[1].transactions[0].metadata = { tampered: true };
      
      const result = blockchain.validateChain();
      
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
    
    it('should detect broken chain linkage', () => {
      blockchain.addTransaction(TRANSACTION_TYPES.MEDICAL_RECORD_CREATED, 'actor', 'patient', {});
      blockchain.addTransaction(TRANSACTION_TYPES.MEDICAL_RECORD_CREATED, 'actor', 'patient', {});
      
      // Break the chain linkage
      blockchain.chain[2].previousHash = 'invalid_hash';
      
      const result = blockchain.validateChain();
      
      expect(result.isValid).toBe(false);
    });
  });
  
  describe('getPatientTransactions()', () => {
    it('should return transactions for a specific patient', () => {
      blockchain.addTransaction(TRANSACTION_TYPES.MEDICAL_RECORD_CREATED, 'actor', 'patient-A', {});
      blockchain.addTransaction(TRANSACTION_TYPES.MEDICAL_RECORD_CREATED, 'actor', 'patient-B', {});
      blockchain.addTransaction(TRANSACTION_TYPES.MEDICAL_RECORD_CREATED, 'actor', 'patient-A', {});
      
      const txs = blockchain.getPatientTransactions('patient-A');
      
      expect(txs.length).toBe(2);
      txs.forEach(tx => expect(tx.patientId).toBe('patient-A'));
    });
  });
  
  describe('getTransaction()', () => {
    it('should find a transaction by ID', () => {
      const result = blockchain.addTransaction(
        TRANSACTION_TYPES.MEDICAL_RECORD_CREATED, 'actor', 'patient', {}
      );
      
      const found = blockchain.getTransaction(result.transaction.transactionId);
      
      expect(found).toBeDefined();
      expect(found.transactionId).toBe(result.transaction.transactionId);
    });
    
    it('should return null for non-existent transaction', () => {
      const found = blockchain.getTransaction('non-existent-id');
      expect(found).toBeNull();
    });
  });
  
  afterAll(() => {
    // Clean up test blockchain files
    const testPath = path.join(__dirname, '../../storage/test-blockchain');
    if (fs.existsSync(testPath)) {
      fs.rmSync(testPath, { recursive: true, force: true });
    }
  });
});
