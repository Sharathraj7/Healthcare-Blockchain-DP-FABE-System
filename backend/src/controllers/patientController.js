/**
 * Patient Controller
 * Handles patient profile management and medical record operations
 */

const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db = require('../services/database/db');
const auditService = require('../services/audit/auditService');
const aesService = require('../services/crypto/aesService');
const dpfabeEncrypt = require('../crypto/dpfabe/encrypt');
const ipfsService = require('../services/ipfs/ipfsService');
const { getBlockchain, TRANSACTION_TYPES } = require('../services/blockchain/blockchainService');
const { validationErrorHandler } = require('../middleware/errorHandler');
const { STANDARD_POLICIES } = require('../crypto/dpfabe/policy');

/**
 * GET /api/patient/profile
 */
function getProfile(req, res, next) {
  try {
    const patient = db.patients.findById(req.user.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Patient not found' },
      });
    }
    
    const { passwordHash, ...safePatient } = patient;
    res.json({ success: true, data: safePatient });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/patient/profile
 */
async function updateProfile(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(validationErrorHandler(errors));
    }
    
    const allowedFields = ['name', 'age', 'gender', 'height', 'weight', 'address',
      'diseaseType', 'bloodGroup', 'allergies', 'medicalHistory', 'medications'];
    
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    
    const updated = db.patients.updateById(req.user.id, updates);
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Patient not found' },
      });
    }
    
    auditService.log({
      actorId: req.user.id,
      actorRole: 'PATIENT',
      action: auditService.AUDIT_EVENTS.PATIENT_PROFILE_UPDATED,
      patientId: req.user.id,
      success: true,
    });
    
    const { passwordHash, ...safePatient } = updated;
    res.json({ success: true, data: safePatient, message: 'Profile updated' });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/patient/records
 * Create a new medical record with encryption
 */
async function createMedicalRecord(req, res, next) {
  try {
    const timings = { start: Date.now() };
    const patientId = req.user.id;
    
    // Extract medical data from request
    const medicalData = {
      name: req.body.name || req.user.name,
      age: req.body.age,
      gender: req.body.gender,
      height: req.body.height,
      weight: req.body.weight,
      address: req.body.address,
      diseaseType: req.body.diseaseType,
      bloodGroup: req.body.bloodGroup,
      allergies: req.body.allergies,
      medicalHistory: req.body.medicalHistory,
      medications: req.body.medications,
      recordedAt: new Date().toISOString(),
    };
    
    // Handle uploaded file
    let fileBuffer = null;
    let fileMetadata = null;
    if (req.files && req.files.medicalReport) {
      const file = req.files.medicalReport;
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: 'Only PDF, JPG, JPEG, and PNG files are allowed',
          },
        });
      }
      
      if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: { code: 'FILE_TOO_LARGE', message: 'File size must not exceed 10MB' },
        });
      }
      
      fileBuffer = file.data;
      fileMetadata = {
        originalName: file.name,
        mimetype: file.mimetype,
        size: file.size,
      };
    }
    
    const recordId = uuidv4();
    
    // === ENCRYPTION PHASE ===
    timings.encryptStart = Date.now();
    
    // Select access policy
    const policyKey = req.body.accessPolicy || 'ANY_DOCTOR';
    const policy = STANDARD_POLICIES[policyKey] || STANDARD_POLICIES.ANY_DOCTOR;
    
    // Create DP-FABE dual-privilege ciphertext
    timings.dpfabeStart = Date.now();
    const dpfabeResult = dpfabeEncrypt.encrypt(
      medicalData,
      fileBuffer,
      patientId,
      recordId,
      policy
    );
    timings.dpfabeEnd = Date.now();
    
    // Store key material securely (separated from blockchain)
    const keyRecord = db.encryptedKeys.insert({
      recordId,
      patientId,
      dualCiphertextId: dpfabeResult.dualCiphertextId,
      keyMaterial: dpfabeResult._keyMaterial,
      createdAt: new Date().toISOString(),
    });
    
    // Clean sensitive key material from the ciphertext
    const { _keyMaterial, ...safeDpfabeCiphertext } = dpfabeResult;
    timings.encryptEnd = Date.now();
    
    // === IPFS STORAGE PHASE ===
    timings.ipfsStart = Date.now();
    
    // Store encrypted medical data in simulated IPFS
    const encryptedPayload = JSON.stringify(safeDpfabeCiphertext);
    const ipfsResult = await ipfsService.store(
      encryptedPayload,
      { algorithm: 'DP-FABE-AES-256-GCM', isEncrypted: true },
      `medical_record_${recordId}.enc`
    );
    
    // Store encrypted file separately if present
    let fileIpfsResult = null;
    if (fileBuffer) {
      const encryptedFilePayload = JSON.stringify(safeDpfabeCiphertext.fullReadBranch.encryptedFile);
      fileIpfsResult = await ipfsService.store(
        encryptedFilePayload,
        { algorithm: 'AES-256-GCM', isEncrypted: true },
        fileMetadata?.originalName || 'medical_report.enc'
      );
    }
    timings.ipfsEnd = Date.now();
    
    auditService.log({
      actorId: patientId,
      actorRole: 'PATIENT',
      action: auditService.AUDIT_EVENTS.IPFS_UPLOAD_COMPLETED,
      patientId,
      success: true,
      metadata: { cid: ipfsResult.cid, size: ipfsResult.size },
    });
    
    // === BLOCKCHAIN TRANSACTION PHASE ===
    timings.blockchainStart = Date.now();
    
    const blockchain = getBlockchain();
    const blockResult = blockchain.addTransaction(
      TRANSACTION_TYPES.MEDICAL_RECORD_CREATED,
      patientId,
      patientId,
      {
        recordId,
        dualCiphertextId: dpfabeResult.dualCiphertextId,
        ipfsCid: ipfsResult.cid,
        ipfsHash: ipfsResult.hash,
        fileIpfsCid: fileIpfsResult?.cid || null,
        policyExpression: policy.expression,
        hasFile: !!fileBuffer,
        dataHash: aesService.calculateHash(encryptedPayload),
        encryptionAlgorithm: 'DP-FABE-AES-256-GCM',
        // NOT storing medical data - only references and hashes
      }
    );
    timings.blockchainEnd = Date.now();
    
    // === PERSIST MEDICAL RECORD METADATA ===
    const record = db.medicalRecords.insert({
      id: recordId,
      patientId,
      dualCiphertextId: dpfabeResult.dualCiphertextId,
      ipfsCid: ipfsResult.cid,
      fileIpfsCid: fileIpfsResult?.cid || null,
      blockIndex: blockResult.block.index,
      transactionId: blockResult.transaction.transactionId,
      blockHash: blockResult.block.hash,
      policyExpression: policy.expression,
      hasFile: !!fileBuffer,
      fileMetadata: fileMetadata ? {
        originalName: fileMetadata.originalName,
        mimetype: fileMetadata.mimetype,
        size: fileMetadata.size,
      } : null,
      encryptionStatus: 'ENCRYPTED',
      status: 'CONFIRMED',
    });
    
    timings.end = Date.now();
    
    // Audit log
    auditService.log({
      actorId: patientId,
      actorRole: 'PATIENT',
      action: auditService.AUDIT_EVENTS.MEDICAL_RECORD_CREATED,
      patientId,
      success: true,
      metadata: {
        recordId,
        transactionId: blockResult.transaction.transactionId,
        ipfsCid: ipfsResult.cid,
        blockIndex: blockResult.block.index,
      },
    });
    
    auditService.log({
      actorId: patientId,
      actorRole: 'PATIENT',
      action: auditService.AUDIT_EVENTS.ENCRYPTION_COMPLETED,
      patientId,
      success: true,
      metadata: { algorithm: 'DP-FABE-AES-256-GCM', recordId },
    });
    
    auditService.log({
      actorId: patientId,
      actorRole: 'PATIENT',
      action: auditService.AUDIT_EVENTS.BLOCK_CREATED,
      patientId,
      success: true,
      metadata: { blockIndex: blockResult.block.index, blockHash: blockResult.block.hash },
    });
    
    res.status(201).json({
      success: true,
      data: {
        recordId: record.id,
        transactionId: blockResult.transaction.transactionId,
        blockNumber: blockResult.block.index,
        blockHash: blockResult.block.hash,
        ipfsCid: ipfsResult.cid,
        fileIpfsCid: fileIpfsResult?.cid || null,
        encryptionStatus: 'ENCRYPTED',
        dpfabeStatus: 'PACKAGED',
        policyExpression: policy.expression,
        metrics: {
          encryptionTimeMs: timings.encryptEnd - timings.encryptStart,
          dpfabePackagingTimeMs: timings.dpfabeEnd - timings.dpfabeStart,
          ipfsTimeMs: timings.ipfsEnd - timings.ipfsStart,
          blockchainTimeMs: timings.blockchainEnd - timings.blockchainStart,
          totalProcessingTimeMs: timings.end - timings.start,
        },
        steps: [
          { step: 'Medical data encrypted', status: 'COMPLETED', icon: '✓' },
          { step: fileBuffer ? 'Medical report encrypted' : 'No file uploaded', status: fileBuffer ? 'COMPLETED' : 'SKIPPED', icon: fileBuffer ? '✓' : '-' },
          { step: 'DP-FABE dual-privilege packaging', status: 'COMPLETED', icon: '✓' },
          { step: 'IPFS storage completed', status: 'COMPLETED', icon: '✓' },
          { step: 'Blockchain transaction created', status: 'COMPLETED', icon: '✓' },
          { step: 'Audit log created', status: 'COMPLETED', icon: '✓' },
        ],
      },
      message: 'Medical record encrypted and stored on blockchain',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/patient/records
 * Get all records for authenticated patient
 */
function getRecords(req, res, next) {
  try {
    const records = db.medicalRecords.find({ patientId: req.user.id });
    records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      data: {
        records: records.map(r => ({
          id: r.id,
          ipfsCid: r.ipfsCid,
          blockIndex: r.blockIndex,
          transactionId: r.transactionId,
          encryptionStatus: r.encryptionStatus,
          status: r.status,
          policyExpression: r.policyExpression,
          hasFile: r.hasFile,
          createdAt: r.createdAt,
        })),
        total: records.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/patient/records/:id
 * Get a specific record (patient can only see metadata, not decrypt other's records)
 */
function getRecordById(req, res, next) {
  try {
    const record = db.medicalRecords.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Medical record not found' },
      });
    }
    
    // Patients can only view their own records
    if (record.patientId !== req.user.id) {
      auditService.log({
        actorId: req.user.id,
        actorRole: 'PATIENT',
        action: auditService.AUDIT_EVENTS.UNAUTHORIZED_ACCESS_ATTEMPT,
        patientId: record.patientId,
        success: false,
        metadata: { recordId: req.params.id, reason: 'Unauthorized patient access' },
      });
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
    }
    
    res.json({
      success: true,
      data: {
        id: record.id,
        patientId: record.patientId,
        ipfsCid: record.ipfsCid,
        fileIpfsCid: record.fileIpfsCid,
        blockIndex: record.blockIndex,
        transactionId: record.transactionId,
        blockHash: record.blockHash,
        encryptionStatus: record.encryptionStatus,
        status: record.status,
        policyExpression: record.policyExpression,
        hasFile: record.hasFile,
        fileMetadata: record.fileMetadata,
        createdAt: record.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  createMedicalRecord,
  getRecords,
  getRecordById,
};
