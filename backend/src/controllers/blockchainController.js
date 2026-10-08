/**
 * Blockchain Controller
 * Handles blockchain explorer endpoints
 */

const { getBlockchain } = require('../services/blockchain/blockchainService');

/**
 * GET /api/blockchain/blocks
 */
function getBlocks(req, res, next) {
  try {
    const blockchain = getBlockchain();
    const blocks = blockchain.getBlocks();
    
    res.json({
      success: true,
      data: {
        blocks: blocks.map(b => ({
          index: b.index,
          timestamp: b.timestamp,
          previousHash: b.previousHash,
          hash: b.hash,
          nonce: b.nonce,
          transactionCount: (b.transactions || []).length,
          transactions: b.transactions || [],
        })).reverse(),
        total: blocks.length,
        implementationStatus: 'SIMULATED',
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/blockchain/transactions
 */
function getTransactions(req, res, next) {
  try {
    const blockchain = getBlockchain();
    const transactions = blockchain.getAllTransactions();
    
    res.json({
      success: true,
      data: {
        transactions: transactions.reverse(),
        total: transactions.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/blockchain/validate
 */
function validateBlockchain(req, res, next) {
  try {
    const blockchain = getBlockchain();
    const result = blockchain.validateChain();
    
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/blockchain/stats
 */
function getStats(req, res, next) {
  try {
    const blockchain = getBlockchain();
    const stats = blockchain.getStats();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getBlocks,
  getTransactions,
  validateBlockchain,
  getStats,
};
