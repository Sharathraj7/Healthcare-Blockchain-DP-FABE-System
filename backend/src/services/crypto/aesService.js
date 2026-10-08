/**
 * AES-256-GCM Encryption Service
 * 
 * REAL CRYPTOGRAPHY - This module implements actual AES-256-GCM encryption
 * using Node.js built-in crypto module.
 * 
 * AES-256-GCM provides:
 * - 256-bit key strength
 * - Authenticated encryption (integrity + confidentiality)
 * - Authentication tag prevents tampering
 */

const crypto = require('crypto');
const config = require('../../config');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12;  // 96 bits (recommended for GCM)
const TAG_LENGTH = 16; // 128 bits authentication tag
const SALT_LENGTH = 32;

/**
 * Generate a cryptographically secure random encryption key
 * @returns {Buffer} 32-byte random key
 */
function generateKey() {
  return crypto.randomBytes(KEY_LENGTH);
}

/**
 * Generate a cryptographically secure random IV/nonce
 * @returns {Buffer} 12-byte random IV
 */
function generateIV() {
  return crypto.randomBytes(IV_LENGTH);
}

/**
 * Derive an encryption key from master key + record-specific salt
 * This provides key isolation per record
 * 
 * @param {string} salt - Record-specific salt (hex string)
 * @returns {Buffer} Derived 32-byte key
 */
function deriveKey(salt) {
  const masterKeyHex = config.encryption.masterKey;
  // Ensure master key is exactly 32 bytes (pad or truncate)
  const masterKeyBuffer = Buffer.from(masterKeyHex.slice(0, 64).padEnd(64, '0'), 'hex');
  const saltBuffer = Buffer.from(salt, 'hex');
  
  // HKDF-like key derivation using HMAC-SHA256
  return crypto.createHmac('sha256', masterKeyBuffer)
    .update(saltBuffer)
    .digest();
}

/**
 * Encrypt plaintext data using AES-256-GCM
 * 
 * @param {string|Buffer} plaintext - Data to encrypt
 * @param {Buffer} [key] - Optional key, generates random if not provided
 * @returns {Object} Encryption result with ciphertext, iv, authTag, key (hex)
 */
function encrypt(plaintext, key = null) {
  const startTime = Date.now();
  
  const encryptionKey = key || generateKey();
  const iv = generateIV();
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);
  
  const plaintextBuffer = Buffer.isBuffer(plaintext)
    ? plaintext
    : Buffer.from(typeof plaintext === 'object' ? JSON.stringify(plaintext) : String(plaintext), 'utf8');
  
  const encrypted = Buffer.concat([
    cipher.update(plaintextBuffer),
    cipher.final(),
  ]);
  
  const authTag = cipher.getAuthTag();
  
  const encryptionTimeMs = Date.now() - startTime;
  
  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    algorithm: ALGORITHM,
    keyLength: KEY_LENGTH * 8,
    salt,
    encryptionTimeMs,
    // Key returned separately - should be wrapped/protected before storage
    _rawKey: encryptionKey.toString('hex'),
  };
}

/**
 * Decrypt AES-256-GCM ciphertext
 * 
 * @param {Object} encryptedPayload - Object with ciphertext, iv, authTag
 * @param {string} keyHex - Encryption key as hex string
 * @returns {Buffer} Decrypted data
 */
function decrypt(encryptedPayload, keyHex) {
  const startTime = Date.now();
  
  const { ciphertext, iv, authTag, algorithm } = encryptedPayload;
  
  if (!ciphertext || !iv || !authTag) {
    throw new Error('Invalid encrypted payload: missing required fields');
  }
  
  const key = Buffer.from(keyHex, 'hex');
  const ivBuffer = Buffer.from(iv, 'hex');
  const authTagBuffer = Buffer.from(authTag, 'hex');
  const ciphertextBuffer = Buffer.from(ciphertext, 'base64');
  
  const decipher = crypto.createDecipheriv(algorithm || ALGORITHM, key, ivBuffer);
  decipher.setAuthTag(authTagBuffer);
  
  const decrypted = Buffer.concat([
    decipher.update(ciphertextBuffer),
    decipher.final(),
  ]);
  
  const decryptionTimeMs = Date.now() - startTime;
  
  return {
    data: decrypted,
    decryptionTimeMs,
  };
}

/**
 * Encrypt a Buffer (binary file) using AES-256-GCM
 * 
 * @param {Buffer} fileBuffer - File data to encrypt
 * @returns {Object} Encrypted file payload
 */
function encryptFile(fileBuffer) {
  return encrypt(fileBuffer);
}

/**
 * Decrypt an encrypted file payload
 * 
 * @param {Object} encryptedPayload - Encrypted file payload
 * @param {string} keyHex - Encryption key as hex
 * @returns {Buffer} Decrypted file data
 */
function decryptFile(encryptedPayload, keyHex) {
  const result = decrypt(encryptedPayload, keyHex);
  return result.data;
}

/**
 * Wrap (encrypt) a data encryption key using the master key
 * Key wrapping protects individual record keys
 * 
 * @param {string} dataKeyHex - Data encryption key to wrap
 * @returns {Object} Wrapped key payload
 */
function wrapKey(dataKeyHex) {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const wrappingKey = deriveKey(salt);
  const result = encrypt(dataKeyHex, wrappingKey);
  return {
    ...result,
    wrappingSalt: salt,
    _rawKey: undefined, // Remove the raw key from wrapped key payload
  };
}

/**
 * Unwrap (decrypt) a wrapped data encryption key
 * 
 * @param {Object} wrappedKeyPayload - Wrapped key payload
 * @returns {string} Unwrapped data encryption key as hex
 */
function unwrapKey(wrappedKeyPayload) {
  const { wrappingSalt, ...encryptedPayload } = wrappedKeyPayload;
  const wrappingKey = deriveKey(wrappingSalt);
  const result = decrypt(encryptedPayload, wrappingKey.toString('hex'));
  return result.data.toString('utf8');
}

/**
 * Calculate SHA-256 hash of data
 * Used for integrity verification and IPFS-like content addressing
 * 
 * @param {Buffer|string} data - Data to hash
 * @returns {string} SHA-256 hash as hex string
 */
function calculateHash(data) {
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

module.exports = {
  encrypt,
  decrypt,
  encryptFile,
  decryptFile,
  wrapKey,
  unwrapKey,
  generateKey,
  generateIV,
  calculateHash,
  deriveKey,
  ALGORITHM,
  KEY_LENGTH,
  IV_LENGTH,
  TAG_LENGTH,
};
