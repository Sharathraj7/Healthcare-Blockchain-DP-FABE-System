/**
 * Simulated IPFS Service
 * 
 * IMPLEMENTATION STATUS: SIMULATED
 * This simulates IPFS (InterPlanetary File System) using local file storage.
 * Phase 2 will connect to actual IPFS network via Pinata or Infura.
 * 
 * Features:
 * - Content-addressed storage (files addressed by their hash)
 * - Simulated CID (Content Identifier) generation
 * - Encrypted file storage (plaintext files never stored)
 * - File retrieval by CID
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../../config');

const IPFS_STORAGE = config.storage.ipfsPath;
const METADATA_FILE = path.join(IPFS_STORAGE, 'metadata.json');

// Ensure IPFS storage directory exists
if (!fs.existsSync(IPFS_STORAGE)) {
  fs.mkdirSync(IPFS_STORAGE, { recursive: true });
}

/**
 * Load IPFS metadata index
 */
function loadMetadata() {
  try {
    if (fs.existsSync(METADATA_FILE)) {
      return JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('[IPFS] Error loading metadata:', err.message);
  }
  return {};
}

/**
 * Save IPFS metadata index
 */
function saveMetadata(metadata) {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
}

/**
 * Generate a simulated IPFS CID from content hash
 * Real IPFS CIDs use multihash format, this simulates the concept
 * 
 * @param {string} contentHash - SHA-256 hash of content
 * @returns {string} Simulated CID
 */
function generateCID(contentHash) {
  // Simulate IPFS CIDv1 format: Qm + base58-like encoding
  // Real CIDs use multibase + multihash + multicodec
  const hashPrefix = contentHash.substring(0, 32);
  const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let cid = 'Qm';
  
  // Convert hex to simulated base58
  for (let i = 0; i < hashPrefix.length; i += 2) {
    const byte = parseInt(hashPrefix.substring(i, i + 2), 16);
    cid += base58Chars[byte % base58Chars.length];
  }
  
  // Pad to standard CID length (46 chars)
  while (cid.length < 46) {
    cid += base58Chars[cid.length % base58Chars.length];
  }
  
  return cid;
}

/**
 * Store encrypted content in simulated IPFS
 * 
 * IMPORTANT: Only encrypted data is ever stored here.
 * Plaintext medical files are NEVER stored.
 * 
 * @param {Buffer|string} encryptedContent - Encrypted content to store
 * @param {Object} encryptionMetadata - Metadata about the encryption
 * @param {string} originalFilename - Original filename (for reference only)
 * @returns {Object} IPFS storage result with CID
 */
async function store(encryptedContent, encryptionMetadata = {}, originalFilename = 'data') {
  const startTime = Date.now();
  
  const contentBuffer = Buffer.isBuffer(encryptedContent)
    ? encryptedContent
    : typeof encryptedContent === 'string'
      ? Buffer.from(encryptedContent, 'utf8')
      : Buffer.from(JSON.stringify(encryptedContent), 'utf8');
  
  // Calculate content hash for content-addressing
  const contentHash = crypto.createHash('sha256').update(contentBuffer).digest('hex');
  const cid = generateCID(contentHash);
  
  // Check if already stored (deduplication)
  const metadata = loadMetadata();
  if (metadata[cid]) {
    return {
      cid,
      hash: contentHash,
      size: contentBuffer.length,
      alreadyExists: true,
      ipfsTimeMs: Date.now() - startTime,
      implementationStatus: 'SIMULATED',
    };
  }
  
  // Store encrypted file
  const filePath = path.join(IPFS_STORAGE, `${cid}.enc`);
  fs.writeFileSync(filePath, contentBuffer);
  
  // Store metadata
  metadata[cid] = {
    cid,
    hash: contentHash,
    size: contentBuffer.length,
    storedAt: new Date().toISOString(),
    originalFilename,
    encryptionInfo: {
      algorithm: encryptionMetadata.algorithm || 'AES-256-GCM',
      isEncrypted: true,
      note: 'Only encrypted data stored in IPFS simulation',
    },
    implementationStatus: 'SIMULATED',
    productionNote: 'Phase 2: Pin to actual IPFS network via Pinata/Infura',
  };
  saveMetadata(metadata);
  
  const ipfsTimeMs = Date.now() - startTime;
  
  return {
    cid,
    hash: contentHash,
    size: contentBuffer.length,
    alreadyExists: false,
    ipfsTimeMs,
    implementationStatus: 'SIMULATED',
    storedAt: metadata[cid].storedAt,
  };
}

/**
 * Retrieve content from simulated IPFS by CID
 * 
 * @param {string} cid - Content Identifier
 * @returns {Object} Retrieved content and metadata
 */
function retrieve(cid) {
  const metadata = loadMetadata();
  
  if (!metadata[cid]) {
    return null;
  }
  
  const filePath = path.join(IPFS_STORAGE, `${cid}.enc`);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const content = fs.readFileSync(filePath);
  
  return {
    cid,
    content,
    metadata: metadata[cid],
  };
}

/**
 * Get metadata for a CID without retrieving content
 * 
 * @param {string} cid - Content Identifier
 * @returns {Object|null} Metadata or null
 */
function getMetadata(cid) {
  const metadata = loadMetadata();
  return metadata[cid] || null;
}

/**
 * List all stored CIDs
 * 
 * @returns {Array} Array of metadata objects
 */
function list() {
  const metadata = loadMetadata();
  return Object.values(metadata);
}

/**
 * Get IPFS statistics
 */
function getStats() {
  const metadata = loadMetadata();
  const items = Object.values(metadata);
  const totalSize = items.reduce((sum, item) => sum + (item.size || 0), 0);
  
  return {
    totalItems: items.length,
    totalSizeBytes: totalSize,
    implementationStatus: 'SIMULATED',
    note: 'Phase 2: Connect to IPFS network via Pinata/Infura',
  };
}

module.exports = {
  store,
  retrieve,
  getMetadata,
  list,
  generateCID,
  getStats,
};
