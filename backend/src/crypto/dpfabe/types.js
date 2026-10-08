/**
 * DP-FABE Type Definitions
 * Dual-Privilege Functional Attribute-Based Encryption
 * 
 * IMPORTANT DISCLAIMER:
 * This module implements a SIMULATED / PROTOTYPE version of DP-FABE.
 * The actual cryptographic construction uses AES-256-GCM for encryption
 * and a policy-based access control simulation.
 * 
 * A formally secure DP-FABE would require:
 * - CP-ABE (Ciphertext-Policy Attribute-Based Encryption) for the FULL_READ branch
 * - IPFE (Inner Product Functional Encryption) for the BLIND_INFERENCE branch
 * - Pairing-based cryptography (e.g., BLS12-381 curves)
 * 
 * Phase 2 will replace this simulation with a formally secure implementation.
 */

/**
 * Privilege levels in DP-FABE
 */
const PRIVILEGES = {
  FULL_READ: 'FULL_READ',
  BLIND_INFERENCE: 'BLIND_INFERENCE',
};

/**
 * Implementation status flags
 */
const IMPLEMENTATION_STATUS = {
  REAL: 'REAL_CRYPTOGRAPHY',
  SIMULATED: 'SIMULATED_PROTOTYPE',
  RESERVED: 'RESERVED_FOR_PHASE_2',
};

/**
 * Doctor attribute types
 */
const ATTRIBUTE_TYPES = {
  ROLE: 'role',
  SPECIALIZATION: 'specialization',
  HOSPITAL: 'hospital',
  DEPARTMENT: 'department',
};

/**
 * Policy operators
 */
const POLICY_OPERATORS = {
  AND: 'AND',
  OR: 'OR',
  EQUALS: '==',
};

/**
 * Access result codes
 */
const ACCESS_RESULT = {
  GRANTED: 'GRANTED',
  DENIED: 'DENIED',
  PENDING: 'PENDING',
};

/**
 * @typedef {Object} DoctorAttributes
 * @property {string} role - Doctor role (always 'DOCTOR')
 * @property {string} specialization - Medical specialization
 * @property {string} hospital - Hospital affiliation
 * @property {string} [department] - Optional department
 */

/**
 * @typedef {Object} AccessPolicy
 * @property {string} expression - Policy expression string
 * @property {string} description - Human-readable policy description
 */

/**
 * @typedef {Object} FullReadBranch
 * @property {string} encryptedData - AES-encrypted medical data (base64)
 * @property {string} encryptedKey - Key encrypted under policy
 * @property {Object} policy - Access policy
 * @property {string} status - Implementation status
 * @property {string} implementationNote - Clarification about cryptographic security
 */

/**
 * @typedef {Object} BlindInferenceBranch
 * @property {string} status - RESERVED_FOR_PHASE_2
 * @property {string} phase - Phase indicator
 * @property {string} message - Description of future functionality
 * @property {Object} futureInterface - Interface specification for Phase 2
 */

/**
 * @typedef {Object} DPFABECiphertext
 * @property {string} dualCiphertextId - Unique identifier
 * @property {string} patientId - Patient identifier
 * @property {string} recordId - Medical record identifier
 * @property {FullReadBranch} fullReadBranch - FULL_READ privilege branch
 * @property {BlindInferenceBranch} blindInferenceBranch - BLIND_INFERENCE placeholder
 * @property {string} timestamp - Creation timestamp
 * @property {Object} metadata - Additional metadata
 */

module.exports = {
  PRIVILEGES,
  IMPLEMENTATION_STATUS,
  ATTRIBUTE_TYPES,
  POLICY_OPERATORS,
  ACCESS_RESULT,
};
