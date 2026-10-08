/**
 * Doctor Controller
 * Handles doctor dashboard, patient management, and authorized record access
 */

const db = require('../services/database/db');
const auditService = require('../services/audit/auditService');
const dpfabeDecrypt = require('../crypto/dpfabe/decrypt');
const ipfsService = require('../services/ipfs/ipfsService');
const { getBlockchain } = require('../services/blockchain/blockchainService');
const { canAccessRecord } = require('../crypto/dpfabe/policy');

/**
 * GET /api/doctor/dashboard
 * Doctor dashboard statistics
 */
function getDashboard(req, res, next) {
  try {
    const allPatients = db.patients.findAll();
    const allRecords = db.medicalRecords.findAll();
    const blockchain = getBlockchain();
    const recentAuditLogs = auditService.getLogs({ limit: 10 });
    const blockchainStats = blockchain.getStats();
    const recentBlocks = blockchain.getBlocks().slice(-5).reverse();
    
    res.json({
      success: true,
      data: {
        stats: {
          totalPatients: allPatients.length,
          totalRecords: allRecords.length,
          accessibleRecords: allRecords.length, // All records policy-accessible
          totalBlocks: blockchainStats.totalBlocks,
          totalTransactions: blockchainStats.totalTransactions,
        },
        recentActivity: recentAuditLogs.slice(0, 5),
        recentTransactions: blockchain.getAllTransactions().slice(-5).reverse(),
        securityStatus: {
          encryption: 'ACTIVE',
          blockchain: 'ACTIVE',
          ipfs: 'SIMULATED',
          dpfabe: 'PROTOTYPE',
          auditLog: 'ACTIVE',
        },
        doctorInfo: {
          id: req.user.id,
          name: req.user.name,
          specialization: req.user.specialization,
          hospital: req.user.hospital,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/doctor/patients
 * Get list of all patients
 */
function getPatients(req, res, next) {
  try {
    const patients = db.patients.findAll();
    const records = db.medicalRecords.findAll();
    
    const patientList = patients.map(p => {
      const patientRecords = records.filter(r => r.patientId === p.id);
      const { passwordHash, ...safePatient } = p;
      return {
        ...safePatient,
        recordCount: patientRecords.length,
        lastRecordDate: patientRecords.length > 0
          ? patientRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt
          : null,
      };
    });
    
    res.json({
      success: true,
      data: {
        patients: patientList,
        total: patientList.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/doctor/patients/:id
 * Get a specific patient's profile and record metadata
 */
function getPatientById(req, res, next) {
  try {
    const patient = db.patients.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Patient not found' },
      });
    }
    
    const records = db.medicalRecords.find({ patientId: patient.id });
    const { passwordHash, ...safePatient } = patient;
    
    res.json({
      success: true,
      data: {
        patient: safePatient,
        records: records.map(r => ({
          id: r.id,
          ipfsCid: r.ipfsCid,
          blockIndex: r.blockIndex,
          transactionId: r.transactionId,
          encryptionStatus: r.encryptionStatus,
          policyExpression: r.policyExpression,
          hasFile: r.hasFile,
          createdAt: r.createdAt,
        })),
        totalRecords: records.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/doctor/records/:id/access
 * Request authorized access to a medical record
 * Performs policy check then decrypts using DP-FABE FULL_READ branch
 */
async function requestRecordAccess(req, res, next) {
  try {
    const doctorId = req.user.id;
    const recordId = req.params.id;
    
    // Get doctor attributes from JWT
    const doctorAttributes = {
      role: req.user.role,
      specialization: req.user.specialization || 'GENERAL',
      hospital: req.user.hospital || 'Unknown',
    };
    
    // Find the record
    const record = db.medicalRecords.findById(recordId);
    if (!record) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Medical record not found' },
      });
    }
    
    // Pre-check policy before attempting decryption
    const recordPolicy = {
      expression: record.policyExpression || 'ROLE == DOCTOR',
      description: 'Medical record access policy',
    };
    
    const policyCheck = canAccessRecord(doctorAttributes, recordPolicy);
    
    if (!policyCheck.satisfied) {
      auditService.log({
        actorId: doctorId,
        actorRole: 'DOCTOR',
        action: auditService.AUDIT_EVENTS.DOCTOR_ACCESS_DENIED,
        patientId: record.patientId,
        success: false,
        metadata: {
          recordId,
          reason: policyCheck.reason,
          policyExpression: recordPolicy.expression,
          doctorSpecialization: doctorAttributes.specialization,
        },
      });
      
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: `Access denied: ${policyCheck.reason}`,
          policyExpression: recordPolicy.expression,
          yourAttributes: {
            role: doctorAttributes.role,
            specialization: doctorAttributes.specialization,
          },
        },
      });
    }
    
    // Retrieve encrypted ciphertext from IPFS
    const ipfsData = ipfsService.retrieve(record.ipfsCid);
    if (!ipfsData) {
      return res.status(500).json({
        success: false,
        error: { code: 'IPFS_ERROR', message: 'Failed to retrieve encrypted record from IPFS' },
      });
    }
    
    // Parse the DP-FABE ciphertext
    let dpfabeCiphertext;
    try {
      dpfabeCiphertext = JSON.parse(ipfsData.content.toString('utf8'));
    } catch {
      return res.status(500).json({
        success: false,
        error: { code: 'PARSE_ERROR', message: 'Failed to parse encrypted record' },
      });
    }
    
    // Retrieve key material
    const keyRecord = db.encryptedKeys.findOne({ recordId });
    if (!keyRecord) {
      return res.status(500).json({
        success: false,
        error: { code: 'KEY_ERROR', message: 'Encryption key not found' },
      });
    }
    
    // Decrypt using DP-FABE FULL_READ branch
    const decryptResult = dpfabeDecrypt.decrypt(
      dpfabeCiphertext,
      keyRecord.keyMaterial,
      doctorAttributes
    );
    
    if (!decryptResult.success) {
      auditService.log({
        actorId: doctorId,
        actorRole: 'DOCTOR',
        action: auditService.AUDIT_EVENTS.MEDICAL_RECORD_ACCESS_DENIED,
        patientId: record.patientId,
        success: false,
        metadata: { recordId, reason: decryptResult.reason },
      });
      return res.status(403).json({
        success: false,
        error: { code: 'DECRYPTION_DENIED', message: decryptResult.reason },
      });
    }
    
    // Log successful access
    auditService.log({
      actorId: doctorId,
      actorRole: 'DOCTOR',
      action: auditService.AUDIT_EVENTS.DOCTOR_AUTHORIZED,
      patientId: record.patientId,
      success: true,
      metadata: { recordId, decryptionTimeMs: decryptResult.decryptionTimeMs },
    });
    
    auditService.log({
      actorId: doctorId,
      actorRole: 'DOCTOR',
      action: auditService.AUDIT_EVENTS.MEDICAL_RECORD_ACCESSED,
      patientId: record.patientId,
      success: true,
      metadata: { recordId },
    });
    
    auditService.log({
      actorId: doctorId,
      actorRole: 'DOCTOR',
      action: auditService.AUDIT_EVENTS.DECRYPTION_COMPLETED,
      patientId: record.patientId,
      success: true,
      metadata: { recordId, privilege: 'FULL_READ' },
    });
    
    // Prepare file data if present (base64 for transport)
    let fileData = null;
    if (decryptResult.file) {
      fileData = {
        data: decryptResult.file.toString('base64'),
        mimetype: record.fileMetadata?.mimetype,
        originalName: record.fileMetadata?.originalName,
      };
    }
    
    res.json({
      success: true,
      data: {
        accessGranted: true,
        privilege: 'FULL_READ',
        medicalData: decryptResult.data,
        file: fileData,
        recordMetadata: {
          id: record.id,
          ipfsCid: record.ipfsCid,
          blockIndex: record.blockIndex,
          transactionId: record.transactionId,
          blockHash: record.blockHash,
          encryptionStatus: record.encryptionStatus,
          policyExpression: record.policyExpression,
          createdAt: record.createdAt,
        },
        accessInfo: {
          accessedBy: req.user.name,
          doctorId,
          accessedAt: new Date().toISOString(),
          policyCheck: decryptResult.accessResult,
          decryptionTimeMs: decryptResult.decryptionTimeMs,
          implementationNote: decryptResult.implementationNote,
        },
        blindInference: {
          status: 'NOT_IMPLEMENTED',
          phase: 'PHASE_2',
          message: 'Privacy-preserving AI prediction will be available in Phase 2',
        },
      },
      message: 'Medical record access authorized and decrypted',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/doctor/audit-logs
 * Get audit logs (doctors can view all audit logs)
 */
function getAuditLogs(req, res, next) {
  try {
    const filters = {};
    if (req.query.patientId) filters.patientId = req.query.patientId;
    if (req.query.action) filters.action = req.query.action;
    if (req.query.limit) filters.limit = parseInt(req.query.limit, 10);
    
    const logs = auditService.getLogs(filters);
    
    res.json({
      success: true,
      data: {
        logs,
        total: logs.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard,
  getPatients,
  getPatientById,
  requestRecordAccess,
  getAuditLogs,
};
