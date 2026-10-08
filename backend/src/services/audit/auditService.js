/**
 * Audit Logging Service
 * 
 * Records all security-sensitive operations in the healthcare system.
 * Every access, modification, and security event is logged.
 */

const db = require('../database/db');

/**
 * Audit event types
 */
const AUDIT_EVENTS = {
  PATIENT_REGISTERED: 'PATIENT_REGISTERED',
  PATIENT_PROFILE_UPDATED: 'PATIENT_PROFILE_UPDATED',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  MEDICAL_RECORD_CREATED: 'MEDICAL_RECORD_CREATED',
  MEDICAL_RECORD_ACCESSED: 'MEDICAL_RECORD_ACCESSED',
  MEDICAL_RECORD_ACCESS_DENIED: 'MEDICAL_RECORD_ACCESS_DENIED',
  MEDICAL_RECORD_DECRYPTED: 'MEDICAL_RECORD_DECRYPTED',
  DOCTOR_AUTHORIZED: 'DOCTOR_AUTHORIZED',
  DOCTOR_ACCESS_DENIED: 'DOCTOR_ACCESS_DENIED',
  ENCRYPTION_COMPLETED: 'ENCRYPTION_COMPLETED',
  DECRYPTION_COMPLETED: 'DECRYPTION_COMPLETED',
  BLOCK_CREATED: 'BLOCK_CREATED',
  IPFS_UPLOAD_COMPLETED: 'IPFS_UPLOAD_COMPLETED',
  UNAUTHORIZED_ACCESS_ATTEMPT: 'UNAUTHORIZED_ACCESS_ATTEMPT',
  DOCTOR_REGISTERED: 'DOCTOR_REGISTERED',
  FILE_UPLOAD: 'FILE_UPLOAD',
};

/**
 * Create an audit log entry
 * 
 * @param {Object} params - Audit log parameters
 * @param {string} params.actorId - ID of the actor
 * @param {string} params.actorRole - Role of the actor (PATIENT/DOCTOR/SYSTEM)
 * @param {string} params.action - Action type from AUDIT_EVENTS
 * @param {string} [params.patientId] - Patient ID if applicable
 * @param {boolean} params.success - Whether the operation succeeded
 * @param {Object} [params.metadata] - Additional context
 * @returns {Object} Created audit log entry
 */
function log({
  actorId,
  actorRole,
  action,
  patientId = null,
  success = true,
  metadata = {},
}) {
  // Sanitize metadata - never log sensitive values
  const sanitizedMetadata = sanitizeMetadata(metadata);
  
  const auditEntry = {
    actorId,
    actorRole,
    action,
    patientId,
    success,
    metadata: sanitizedMetadata,
    ipAddress: metadata.ipAddress || null,
    userAgent: metadata.userAgent || null,
    timestamp: new Date().toISOString(),
  };
  
  try {
    return db.auditLogs.insert(auditEntry);
  } catch (err) {
    console.error('[Audit] Failed to write audit log:', err.message);
    return null;
  }
}

/**
 * Sanitize metadata to prevent sensitive data leakage in logs
 * Removes passwords, encryption keys, and other sensitive fields
 */
function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return {};
  
  const sensitiveKeys = [
    'password', 'passwordHash', 'key', 'encryptionKey',
    'privateKey', 'secret', 'token', 'authTag', 'iv',
    'ciphertext', 'rawKey', '_rawKey',
  ];
  
  const sanitized = {};
  for (const [key, value] of Object.entries(metadata)) {
    const isSensitive = sensitiveKeys.some(sk =>
      key.toLowerCase().includes(sk.toLowerCase())
    );
    
    if (!isSensitive) {
      sanitized[key] = value;
    } else {
      sanitized[key] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * Get audit logs with optional filtering
 * 
 * @param {Object} filters - Filter options
 * @returns {Array} Audit log entries
 */
function getLogs(filters = {}) {
  const all = db.auditLogs.findAll();
  
  let filtered = all;
  
  if (filters.actorId) {
    filtered = filtered.filter(log => log.actorId === filters.actorId);
  }
  if (filters.patientId) {
    filtered = filtered.filter(log => log.patientId === filters.patientId);
  }
  if (filters.action) {
    filtered = filtered.filter(log => log.action === filters.action);
  }
  if (filters.actorRole) {
    filtered = filtered.filter(log => log.actorRole === filters.actorRole);
  }
  
  // Sort by timestamp descending (most recent first)
  filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Apply limit
  if (filters.limit) {
    filtered = filtered.slice(0, filters.limit);
  }
  
  return filtered;
}

/**
 * Get recent security events
 * 
 * @param {number} limit - Max number of events to return
 * @returns {Array} Recent security events
 */
function getRecentSecurityEvents(limit = 20) {
  return getLogs({ limit });
}

module.exports = {
  log,
  getLogs,
  getRecentSecurityEvents,
  AUDIT_EVENTS,
};
