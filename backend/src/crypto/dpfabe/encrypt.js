/**
 * DP-FABE Encryption Module
 * 
 * Creates dual-privilege ciphertexts containing:
 * 1. FULL_READ branch: AES-encrypted medical data accessible to authorized doctors
 * 2. BLIND_INFERENCE branch: Reserved placeholder for Phase 2 AI inference
 * 
 * REAL CRYPTOGRAPHY: AES-256-GCM for actual data encryption
 * SIMULATED: Attribute-based policy binding (Phase 2: true CP-ABE)
 */

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const aesService = require('../../services/crypto/aesService');
const { createPolicy, STANDARD_POLICIES } = require('./policy');
const { PRIVILEGES, IMPLEMENTATION_STATUS } = require('./types');

/**
 * Create a DP-FABE dual-privilege ciphertext
 * 
 * @param {Object} medicalData - Structured medical data (JSON)
 * @param {Buffer|null} fileBuffer - Optional file to encrypt
 * @param {string} patientId - Patient identifier
 * @param {string} recordId - Medical record identifier
 * @param {Object} policy - Access policy for FULL_READ branch
 * @returns {Object} DP-FABE ciphertext with both branches
 */
function encrypt(medicalData, fileBuffer, patientId, recordId, policy = null) {
  const startTime = Date.now();
  const dualCiphertextId = uuidv4();
  
  // === FULL_READ BRANCH ===
  // REAL: AES-256-GCM encryption of medical data
  const fullReadResult = createFullReadBranch(medicalData, fileBuffer, policy);
  
  // === BLIND_INFERENCE BRANCH ===
  // RESERVED: Placeholder for Phase 2 IPFE-based inference
  const blindInferenceBranch = createBlindInferenceBranch(medicalData);
  
  const packagingTimeMs = Date.now() - startTime;
  
  return {
    dualCiphertextId,
    patientId,
    recordId,
    fullReadBranch: fullReadResult.branch,
    blindInferenceBranch,
    timestamp: new Date().toISOString(),
    metadata: {
      algorithm: 'DP-FABE-Prototype-v1',
      fullReadCrypto: 'AES-256-GCM (REAL)',
      policyEnforcement: 'Policy Simulation (SIMULATED)',
      packagingTimeMs,
      implementationStatus: IMPLEMENTATION_STATUS.SIMULATED,
      disclaimer: [
        'REAL: AES-256-GCM data encryption',
        'SIMULATED: Attribute-based policy binding',
        'PHASE 2: Will replace with formal CP-ABE + IPFE',
      ],
    },
    // Return key material separately for secure storage
    _keyMaterial: fullReadResult.keyMaterial,
  };
}

/**
 * Create the FULL_READ privilege branch
 * Encrypts medical data with AES-256-GCM and associates an access policy
 * 
 * REAL CRYPTOGRAPHY: AES-256-GCM
 * SIMULATED: Policy binding (Phase 2: CP-ABE will cryptographically enforce policy)
 */
function createFullReadBranch(medicalData, fileBuffer, policy) {
  const recordPolicy = policy || STANDARD_POLICIES.ANY_DOCTOR;
  
  // Encrypt structured medical data - REAL AES-256-GCM
  const encryptedData = aesService.encrypt(medicalData);
  const dataKey = encryptedData._rawKey;
  delete encryptedData._rawKey;
  
  // Encrypt file if provided
  let encryptedFile = null;
  let fileKey = null;
  if (fileBuffer) {
    const fileResult = aesService.encryptFile(fileBuffer);
    fileKey = fileResult._rawKey;
    delete fileResult._rawKey;
    encryptedFile = fileResult;
  }
  
  // Wrap the data encryption key (key wrapping)
  const wrappedDataKey = aesService.wrapKey(dataKey);
  const wrappedFileKey = fileKey ? aesService.wrapKey(fileKey) : null;
  
  return {
    branch: {
      privilege: PRIVILEGES.FULL_READ,
      encryptedData, // AES-256-GCM encrypted medical data
      encryptedFile, // AES-256-GCM encrypted file (if any)
      policy: recordPolicy,
      implementationStatus: IMPLEMENTATION_STATUS.SIMULATED,
      cryptographicNote: {
        encryption: 'AES-256-GCM (REAL CRYPTOGRAPHY)',
        policyBinding: 'SIMULATED_PROTOTYPE - Phase 2: CP-ABE cryptographic policy enforcement',
        keyWrapping: 'AES-256-GCM key wrapping (REAL CRYPTOGRAPHY)',
      },
    },
    keyMaterial: {
      wrappedDataKey,
      wrappedFileKey,
      hasFile: !!fileBuffer,
    },
  };
}

/**
 * Create the BLIND_INFERENCE privilege branch
 * 
 * RESERVED FOR PHASE 2
 * Phase 2 will implement IPFE-based inference where:
 * - Biomarkers are encrypted as feature vectors
 * - Functional key allows inner product computation
 * - ML model inference happens without decrypting patient data
 */
function createBlindInferenceBranch(medicalData) {
  // Extract numeric biomarkers for future IPFE encryption
  // Phase 2: These will be encrypted as a vector using IPFE
  const biomarkerKeys = ['age', 'height', 'weight'];
  const availableBiomarkers = {};
  biomarkerKeys.forEach(key => {
    if (medicalData[key] !== undefined) {
      availableBiomarkers[key] = true; // Only note presence, not values
    }
  });
  
  return {
    privilege: PRIVILEGES.BLIND_INFERENCE,
    encryptedFeatures: null, // Phase 2: IPFE-encrypted feature vector
    featureMetadata: {
      availableBiomarkers,
      featureCount: Object.keys(availableBiomarkers).length,
      note: 'Feature metadata noted for Phase 2 implementation',
    },
    status: IMPLEMENTATION_STATUS.RESERVED,
    phase: 'PHASE_2',
    message: 'Privacy-preserving disease prediction will be implemented in Phase 2 using IPFE',
    futureInterface: {
      input: 'Encrypted biomarker vector',
      operation: 'Inner product computation with model weights',
      output: 'Encrypted prediction score (no patient data revealed)',
      cryptoScheme: 'IPFE (Inner Product Functional Encryption)',
      reference: 'Abdalla et al. 2015, Chotard et al. 2018',
    },
  };
}

module.exports = {
  encrypt,
  createFullReadBranch,
  createBlindInferenceBranch,
};
