/**
 * Authentication Controller
 * Handles patient registration, patient login, and doctor login
 */

const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { generateToken } = require('../middleware/auth');
const db = require('../services/database/db');
const auditService = require('../services/audit/auditService');
const { validationErrorHandler } = require('../middleware/errorHandler');
const config = require('../config');

/**
 * POST /api/auth/patient/register
 * Register a new patient
 */
async function registerPatient(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(validationErrorHandler(errors));
    }
    
    const {
      name, email, password, age, gender, height, weight, address,
      diseaseType, bloodGroup, allergies, medicalHistory, medications,
    } = req.body;
    
    // Check if email already exists
    const existingPatient = db.patients.findOne({ email: email.toLowerCase() });
    if (existingPatient) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'An account with this email already exists',
        },
      });
    }
    
    // Hash password - REAL bcrypt hashing
    const passwordHash = await bcrypt.hash(password, config.security.bcryptRounds);
    
    const patientId = uuidv4();
    const patient = db.patients.insert({
      id: patientId,
      name,
      email: email.toLowerCase(),
      passwordHash, // Never store plaintext password
      role: 'PATIENT',
      age: parseInt(age, 10),
      gender,
      height: parseFloat(height),
      weight: parseFloat(weight),
      address,
      diseaseType,
      bloodGroup,
      allergies: allergies || '',
      medicalHistory: medicalHistory || '',
      medications: medications || '',
    });
    
    // Generate JWT
    const token = generateToken({
      id: patient.id,
      email: patient.email,
      role: 'PATIENT',
      name: patient.name,
    });
    
    // Audit log
    auditService.log({
      actorId: patient.id,
      actorRole: 'PATIENT',
      action: auditService.AUDIT_EVENTS.PATIENT_REGISTERED,
      patientId: patient.id,
      success: true,
      metadata: { name: patient.name, email: patient.email },
    });
    
    // Return patient without sensitive fields
    const { passwordHash: _, ...safePatient } = patient;
    
    res.status(201).json({
      success: true,
      data: {
        patient: safePatient,
        token,
      },
      message: 'Patient registered successfully',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/patient/login
 * Authenticate a patient
 */
async function loginPatient(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(validationErrorHandler(errors));
    }
    
    const { email, password } = req.body;
    
    const patient = db.patients.findOne({ email: email.toLowerCase() });
    
    if (!patient) {
      auditService.log({
        actorId: 'unknown',
        actorRole: 'PATIENT',
        action: auditService.AUDIT_EVENTS.LOGIN_FAILED,
        success: false,
        metadata: { reason: 'Email not found', attemptedEmail: email },
      });
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }
    
    const isPasswordValid = await bcrypt.compare(password, patient.passwordHash);
    
    if (!isPasswordValid) {
      auditService.log({
        actorId: patient.id,
        actorRole: 'PATIENT',
        action: auditService.AUDIT_EVENTS.LOGIN_FAILED,
        patientId: patient.id,
        success: false,
        metadata: { reason: 'Invalid password' },
      });
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }
    
    const token = generateToken({
      id: patient.id,
      email: patient.email,
      role: 'PATIENT',
      name: patient.name,
    });
    
    auditService.log({
      actorId: patient.id,
      actorRole: 'PATIENT',
      action: auditService.AUDIT_EVENTS.LOGIN_SUCCESS,
      patientId: patient.id,
      success: true,
      metadata: { name: patient.name },
    });
    
    const { passwordHash: _, ...safePatient } = patient;
    
    res.json({
      success: true,
      data: {
        patient: safePatient,
        token,
      },
      message: 'Login successful',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/doctor/login
 * Authenticate a doctor
 */
async function loginDoctor(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(validationErrorHandler(errors));
    }
    
    const { email, password } = req.body;
    
    const doctor = db.doctors.findOne({ email: email.toLowerCase() });
    
    if (!doctor) {
      auditService.log({
        actorId: 'unknown',
        actorRole: 'DOCTOR',
        action: auditService.AUDIT_EVENTS.LOGIN_FAILED,
        success: false,
        metadata: { reason: 'Doctor not found', attemptedEmail: email },
      });
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }
    
    const isPasswordValid = await bcrypt.compare(password, doctor.passwordHash);
    
    if (!isPasswordValid) {
      auditService.log({
        actorId: doctor.id,
        actorRole: 'DOCTOR',
        action: auditService.AUDIT_EVENTS.LOGIN_FAILED,
        success: false,
        metadata: { reason: 'Invalid password' },
      });
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }
    
    const token = generateToken({
      id: doctor.id,
      email: doctor.email,
      role: 'DOCTOR',
      name: doctor.name,
      specialization: doctor.specialization,
      hospital: doctor.hospital,
    });
    
    auditService.log({
      actorId: doctor.id,
      actorRole: 'DOCTOR',
      action: auditService.AUDIT_EVENTS.LOGIN_SUCCESS,
      success: true,
      metadata: { name: doctor.name },
    });
    
    const { passwordHash: _, ...safeDoctor } = doctor;
    
    res.json({
      success: true,
      data: {
        doctor: safeDoctor,
        token,
      },
      message: 'Doctor login successful',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  registerPatient,
  loginPatient,
  loginDoctor,
};
