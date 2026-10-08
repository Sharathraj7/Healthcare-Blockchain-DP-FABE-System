/**
 * Metrics and IPFS Routes
 */

const express = require('express');
const router = express.Router();
const metricsController = require('../controllers/metricsController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', metricsController.getMetrics);

module.exports = router;
