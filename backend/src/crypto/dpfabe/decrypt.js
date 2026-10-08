/**
 * DP-FABE Decryption Module
 * 
 * Decrypts data from the FULL_READ branch after policy verification.
 * 
 * REAL CRYPTOGRAPHY: AES-256-GCM decryption
 * SIMULATED: Attribute-based policy verification (Phase 2: CP-ABE decryption)
 */

const aesService = require('../../services/crypto/aesService');
const { canAccessRecord } = require('./policy');
const { PRIVILEGES, ACCESS_RESULT, IMPLEMENTATION_STATUS } = require('./types');

/**
 * Decrypt medical data from DP-FABE ciphertext using FULL_READ privilege
 * 
 * @param {Object} dpfabeCiphertext - The DP-FABE ciphertext
 * @param {Object} keyMaterial - Key material (wrapped keys)
 * @param {Object} doctorAttributes - Doctor's attributes for policy check
 * @returns {Object} Decrypted data or access denied error
 */
function decrypt(dpfabeCiphertext, keyMaterial, doctorAttributes) {
  const { fullReadBranch } = dpfabeCiphertext;
  
  if (!fullReadBranch) {
    throw new Error('Invalid DP-FABE ciphertext: missing fullReadBranch');
  }
  
  // Policy verification (SIMULATED - Phase 2: CP-ABE cryptographic check)
  const accessResult = canAccessRecord(doctorAttributes, fullReadBranch.policy);
  
  if (!accessResult.satisfied) {
    return {
      success: false,
      result: ACCESS_RESULT.DENIED,
      reason: accessResult.reason,
      policyExpression: fullReadBranch.policy?.expression,
      implementationNote: 'SIMULATED policy check - Phase 2: Cryptographic CP-ABE enforcement',
    };
  }
  
  // Decrypt data (REAL AES-256-GCM)
  const unwrappedDataKey = aesService.unwrapKey(keyMaterial.wrappedDataKey);
  const decryptResult = aesService.decrypt(fullReadBranch.encryptedData, unwrappedDataKey);
  
  let decryptedData;
  try {
    decryptedData = JSON.parse(decryptResult.data.toString('utf8'));
  } catch {
    decryptedData = decryptResult.data.toString('utf8');
  }
  
  // Decrypt file if present
  let decryptedFile = null;
  if (keyMaterial.hasFile && keyMaterial.wrappedFileKey && fullReadBranch.encryptedFile) {
    const unwrappedFileKey = aesService.unwrapKey(keyMaterial.wrappedFileKey);
    decryptedFile = aesService.decryptFile(fullReadBranch.encryptedFile, unwrappedFileKey);
  }
  
  return {
    success: true,
    result: ACCESS_RESULT.GRANTED,
    privilege: PRIVILEGES.FULL_READ,
    data: decryptedData,
    file: decryptedFile,
    decryptionTimeMs: decryptResult.decryptionTimeMs,
    accessResult,
    implementationNote: {
      decryption: 'AES-256-GCM (REAL CRYPTOGRAPHY)',
      policyVerification: 'SIMULATED_PROTOTYPE - Phase 2: CP-ABE decryption',
    },
  };
}

/**
 * Attempt BLIND_INFERENCE branch decryption
 * Currently returns NOT_IMPLEMENTED as this is reserved for Phase 2
 * 
 * @param {Object} dpfabeCiphertext - The DP-FABE ciphertext
 * @param {Object} functionalKey - Functional key for inference [Phase 2]
 * @returns {Object} Phase 2 placeholder response
 */
function decryptForInference(dpfabeCiphertext, functionalKey) {
  return {
    success: false,
    status: 'NOT_IMPLEMENTED',
    phase: 'PHASE_2',
    privilege: PRIVILEGES.BLIND_INFERENCE,
    message: 'Privacy-preserving inference not yet implemented. Coming in Phase 2.',
    blindInferenceBranch: dpfabeCiphertext.blindInferenceBranch,
    futureInterface: {
      description: 'Evaluate encrypted model on encrypted features without decrypting patient data',
      cryptoScheme: 'IPFE (Inner Product Functional Encryption)',
      steps: [
        '1. Encrypt patient biomarkers as feature vector using IPFE',
        '2. AI authority issues functional key for model weights',
        '3. Evaluate inner product: <weights, features> on ciphertext',
        '4. Compute sigmoid of result to get prediction probability',
        '5. No patient data is ever decrypted during inference',
      ],
    },
    implementationStatus: IMPLEMENTATION_STATUS.RESERVED,
  };
}

module.exports = {
  decrypt,
  decryptForInference,
};
