/**
 * Metrics Controller
 * Performance benchmarking for report generation
 */

const aesService = require('../services/crypto/aesService');
const dpfabeEncrypt = require('../crypto/dpfabe/encrypt');
const ipfsService = require('../services/ipfs/ipfsService');
const { getBlockchain, TRANSACTION_TYPES } = require('../services/blockchain/blockchainService');

/**
 * GET /api/metrics
 * Run benchmarks and return timing metrics
 */
async function getMetrics(req, res, next) {
  try {
    const testData = {
      name: 'Test Patient',
      age: 30,
      diseaseType: 'Diabetes',
      bloodGroup: 'A+',
    };
    
    // Benchmark AES encryption
    const encStart = Date.now();
    const encrypted = aesService.encrypt(testData);
    const encEnd = Date.now();
    const encryptionTimeMs = encEnd - encStart;
    
    // Benchmark AES decryption
    const decStart = Date.now();
    aesService.decrypt(encrypted, encrypted._rawKey);
    const decEnd = Date.now();
    const decryptionTimeMs = decEnd - decStart;
    
    // Benchmark DP-FABE packaging
    const dpfStart = Date.now();
    dpfabeEncrypt.encrypt(testData, null, 'test-patient', 'test-record');
    const dpfEnd = Date.now();
    const dpfabePackagingTimeMs = dpfEnd - dpfStart;
    
    // Benchmark IPFS storage
    const ipfsStart = Date.now();
    const ipfsResult = await ipfsService.store(
      JSON.stringify({ test: 'benchmark', timestamp: Date.now() }),
      { algorithm: 'AES-256-GCM' },
      'benchmark.enc'
    );
    const ipfsEnd = Date.now();
    const ipfsTimeMs = ipfsEnd - ipfsStart;
    
    // Benchmark blockchain transaction
    const bcStart = Date.now();
    const blockchain = getBlockchain();
    blockchain.addTransaction(
      TRANSACTION_TYPES.MEDICAL_RECORD_CREATED,
      'benchmark-actor',
      'benchmark-patient',
      { benchmark: true, ipfsCid: ipfsResult.cid }
    );
    const bcEnd = Date.now();
    const blockchainTimeMs = bcEnd - bcStart;
    
    const totalProcessingTimeMs = encryptionTimeMs + dpfabePackagingTimeMs + ipfsTimeMs + blockchainTimeMs;
    
    res.json({
      success: true,
      data: {
        metrics: {
          encryptionTimeMs,
          decryptionTimeMs,
          dpfabePackagingTimeMs,
          ipfsTimeMs,
          blockchainTimeMs,
          totalProcessingTimeMs,
        },
        description: {
          encryptionTimeMs: 'AES-256-GCM data encryption time',
          decryptionTimeMs: 'AES-256-GCM data decryption time',
          dpfabePackagingTimeMs: 'DP-FABE dual-privilege packaging time',
          ipfsTimeMs: 'Simulated IPFS storage time',
          blockchainTimeMs: 'Blockchain transaction + block mining time',
          totalProcessingTimeMs: 'Total processing time (without decryption)',
        },
        implementationStatus: {
          encryption: 'REAL (AES-256-GCM)',
          dpfabe: 'SIMULATED_PROTOTYPE',
          ipfs: 'SIMULATED',
          blockchain: 'SIMULATED',
        },
        note: 'Phase 1 benchmarks. Phase 2 will add IPFE encryption timing.',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/ipfs/:cid
 * Get IPFS metadata for a CID
 */
function getIpfsMetadata(req, res, next) {
  try {
    const ipfsService = require('../services/ipfs/ipfsService');
    const metadata = ipfsService.getMetadata(req.params.cid);
    
    if (!metadata) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'CID not found in IPFS' },
      });
    }
    
    res.json({
      success: true,
      data: {
        cid: metadata.cid,
        hash: metadata.hash,
        size: metadata.size,
        storedAt: metadata.storedAt,
        encryptionInfo: metadata.encryptionInfo,
        implementationStatus: metadata.implementationStatus,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMetrics,
  getIpfsMetadata,
};
