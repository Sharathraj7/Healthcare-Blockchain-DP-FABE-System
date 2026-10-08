/**
 * AES Encryption Service Tests
 */

const aesService = require('../../src/services/crypto/aesService');

describe('AES-256-GCM Encryption Service', () => {
  describe('encrypt()', () => {
    it('should encrypt string data successfully', () => {
      const plaintext = 'Hello, Healthcare!';
      const result = aesService.encrypt(plaintext);
      
      expect(result).toBeDefined();
      expect(result.ciphertext).toBeDefined();
      expect(result.iv).toBeDefined();
      expect(result.authTag).toBeDefined();
      expect(result.algorithm).toBe('aes-256-gcm');
      expect(result._rawKey).toBeDefined();
    });
    
    it('should encrypt object data as JSON', () => {
      const data = { name: 'Arun Kumar', age: 45, disease: 'Diabetes' };
      const result = aesService.encrypt(data);
      
      expect(result.ciphertext).toBeDefined();
      expect(result.ciphertext).not.toBe(JSON.stringify(data));
    });
    
    it('ciphertext should differ from plaintext', () => {
      const plaintext = 'sensitive medical data';
      const result = aesService.encrypt(plaintext);
      
      expect(result.ciphertext).not.toBe(plaintext);
      expect(result.ciphertext).not.toContain(plaintext);
    });
    
    it('should generate unique IV for each encryption', () => {
      const plaintext = 'same data';
      const result1 = aesService.encrypt(plaintext);
      const result2 = aesService.encrypt(plaintext);
      
      expect(result1.iv).not.toBe(result2.iv);
      expect(result1.ciphertext).not.toBe(result2.ciphertext);
    });
    
    it('should generate encryption metadata', () => {
      const result = aesService.encrypt('test');
      
      expect(result.algorithm).toBe('aes-256-gcm');
      expect(result.keyLength).toBe(256);
      expect(result.encryptionTimeMs).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('decrypt()', () => {
    it('should decrypt encrypted data to original string', () => {
      const plaintext = 'Hello, Healthcare!';
      const encrypted = aesService.encrypt(plaintext);
      const { data } = aesService.decrypt(encrypted, encrypted._rawKey);
      
      expect(data.toString('utf8')).toBe(plaintext);
    });
    
    it('should decrypt encrypted object data', () => {
      const data = { name: 'Arun Kumar', age: 45 };
      const encrypted = aesService.encrypt(data);
      const { data: decrypted } = aesService.decrypt(encrypted, encrypted._rawKey);
      const parsed = JSON.parse(decrypted.toString('utf8'));
      
      expect(parsed.name).toBe(data.name);
      expect(parsed.age).toBe(data.age);
    });
    
    it('should fail with wrong key', () => {
      const encrypted = aesService.encrypt('sensitive data');
      const wrongKey = aesService.generateKey().toString('hex');
      
      expect(() => {
        aesService.decrypt(encrypted, wrongKey);
      }).toThrow();
    });
    
    it('should fail with tampered ciphertext', () => {
      const encrypted = aesService.encrypt('test data');
      const tampered = {
        ...encrypted,
        ciphertext: Buffer.from('tampered').toString('base64'),
      };
      
      expect(() => {
        aesService.decrypt(tampered, encrypted._rawKey);
      }).toThrow();
    });
    
    it('should fail with invalid auth tag', () => {
      const encrypted = aesService.encrypt('test data');
      const tampered = {
        ...encrypted,
        authTag: 'aabbccddeeff00112233445566778899',
      };
      
      expect(() => {
        aesService.decrypt(tampered, encrypted._rawKey);
      }).toThrow();
    });
  });
  
  describe('encryptFile() and decryptFile()', () => {
    it('should encrypt and decrypt a file buffer', () => {
      const fileData = Buffer.from('PDF file content simulation');
      const encrypted = aesService.encryptFile(fileData);
      const decrypted = aesService.decryptFile(encrypted, encrypted._rawKey);
      
      expect(decrypted.toString('utf8')).toBe(fileData.toString('utf8'));
    });
  });
  
  describe('wrapKey() and unwrapKey()', () => {
    it('should wrap and unwrap a key successfully', () => {
      const originalKey = aesService.generateKey().toString('hex');
      const wrapped = aesService.wrapKey(originalKey);
      const unwrapped = aesService.unwrapKey(wrapped);
      
      expect(unwrapped).toBe(originalKey);
    });
  });
  
  describe('calculateHash()', () => {
    it('should calculate consistent SHA-256 hash', () => {
      const data = 'test data';
      const hash1 = aesService.calculateHash(data);
      const hash2 = aesService.calculateHash(data);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 = 32 bytes = 64 hex chars
    });
    
    it('different data should produce different hashes', () => {
      const hash1 = aesService.calculateHash('data1');
      const hash2 = aesService.calculateHash('data2');
      
      expect(hash1).not.toBe(hash2);
    });
  });
});
