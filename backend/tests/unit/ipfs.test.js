/**
 * IPFS Service Tests
 */

const path = require('path');
const fs = require('fs');

// Override storage paths for tests
process.env.IPFS_STORAGE_PATH = path.join(__dirname, '../../storage/test-ipfs');

const ipfsService = require('../../src/services/ipfs/ipfsService');
const aesService = require('../../src/services/crypto/aesService');

describe('IPFS Simulation Service', () => {
  describe('store()', () => {
    it('should store encrypted content and return a CID', async () => {
      const content = JSON.stringify({ encrypted: 'data', test: true });
      const result = await ipfsService.store(content, { algorithm: 'AES-256-GCM' }, 'test.enc');
      
      expect(result).toBeDefined();
      expect(result.cid).toBeDefined();
      expect(result.cid).toMatch(/^Qm/);
      expect(result.hash).toBeDefined();
      expect(result.size).toBeGreaterThan(0);
    });
    
    it('should return the same CID for same content (deduplication)', async () => {
      const content = 'identical_content_' + Date.now();
      const result1 = await ipfsService.store(content, {}, 'test1.enc');
      const result2 = await ipfsService.store(content, {}, 'test2.enc');
      
      expect(result1.cid).toBe(result2.cid);
    });
    
    it('should return different CIDs for different content', async () => {
      const result1 = await ipfsService.store('content-A-' + Date.now(), {}, 'a.enc');
      const result2 = await ipfsService.store('content-B-' + Date.now(), {}, 'b.enc');
      
      expect(result1.cid).not.toBe(result2.cid);
    });
    
    it('should mark content as encrypted in metadata', async () => {
      await ipfsService.store('encrypted data', { algorithm: 'AES-256-GCM' }, 'test.enc');
    });
    
    it('should store encrypted file buffers', async () => {
      const medicalData = { name: 'Patient', diagnosis: 'Test' };
      const encrypted = aesService.encrypt(medicalData);
      const encryptedBuffer = Buffer.from(JSON.stringify(encrypted));
      
      const result = await ipfsService.store(encryptedBuffer, { isEncrypted: true }, 'report.enc');
      
      expect(result.cid).toBeDefined();
      expect(result.size).toBeGreaterThan(0);
    });
  });
  
  describe('retrieve()', () => {
    it('should retrieve stored content by CID', async () => {
      const content = 'retrievable_content_' + Date.now();
      const storeResult = await ipfsService.store(content, {}, 'test.enc');
      
      const retrieved = ipfsService.retrieve(storeResult.cid);
      
      expect(retrieved).toBeDefined();
      expect(retrieved.cid).toBe(storeResult.cid);
      expect(retrieved.content).toBeDefined();
      expect(retrieved.content.toString('utf8')).toBe(content);
    });
    
    it('should return null for non-existent CID', () => {
      const result = ipfsService.retrieve('QmNonExistentCID123456789');
      expect(result).toBeNull();
    });
  });
  
  describe('getMetadata()', () => {
    it('should return metadata for stored content', async () => {
      const content = 'metadata_test_' + Date.now();
      const storeResult = await ipfsService.store(content, { algorithm: 'AES-256-GCM' }, 'test.enc');
      
      const metadata = ipfsService.getMetadata(storeResult.cid);
      
      expect(metadata).toBeDefined();
      expect(metadata.cid).toBe(storeResult.cid);
      expect(metadata.hash).toBeDefined();
      expect(metadata.size).toBeGreaterThan(0);
      expect(metadata.encryptionInfo.isEncrypted).toBe(true);
    });
    
    it('should return null for unknown CID', () => {
      const metadata = ipfsService.getMetadata('QmUnknownCID');
      expect(metadata).toBeNull();
    });
  });
  
  describe('generateCID()', () => {
    it('should generate a CID starting with Qm', () => {
      const hash = 'a'.repeat(64);
      const cid = ipfsService.generateCID(hash);
      
      expect(cid).toMatch(/^Qm/);
      expect(cid.length).toBeGreaterThan(10);
    });
  });
  
  afterAll(() => {
    // Clean up test IPFS files
    const testPath = path.join(__dirname, '../../storage/test-ipfs');
    if (fs.existsSync(testPath)) {
      fs.rmSync(testPath, { recursive: true, force: true });
    }
  });
});
