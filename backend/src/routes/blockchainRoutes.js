/**
 * Blockchain Routes
 */

const express = require('express');
const router = express.Router();
const blockchainController = require('../controllers/blockchainController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/blocks', blockchainController.getBlocks);
router.get('/transactions', blockchainController.getTransactions);
router.get('/validate', blockchainController.validateBlockchain);
router.get('/stats', blockchainController.getStats);

module.exports = router;
