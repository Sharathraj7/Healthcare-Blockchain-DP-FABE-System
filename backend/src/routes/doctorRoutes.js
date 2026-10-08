/**
 * Doctor Routes
 */

const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticate, requireRole } = require('../middleware/auth');

// All doctor routes require authentication and DOCTOR role
router.use(authenticate);
router.use(requireRole('DOCTOR'));

router.get('/dashboard', doctorController.getDashboard);
router.get('/patients', doctorController.getPatients);
router.get('/patients/:id', doctorController.getPatientById);
router.post('/records/:id/access', doctorController.requestRecordAccess);
router.get('/audit-logs', doctorController.getAuditLogs);

module.exports = router;
