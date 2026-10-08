/**
 * Patient Routes
 */

const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticate, requireRole } = require('../middleware/auth');

// All patient routes require authentication and PATIENT role
router.use(authenticate);
router.use(requireRole('PATIENT'));

router.get('/profile', patientController.getProfile);
router.put('/profile', patientController.updateProfile);
router.post('/records', patientController.createMedicalRecord);
router.get('/records', patientController.getRecords);
router.get('/records/:id', patientController.getRecordById);

module.exports = router;
