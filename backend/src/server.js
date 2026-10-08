/**
 * Server Entry Point
 * Healthcare Blockchain System - Phase 1
 */

const app = require('./app');
const config = require('./config');
const { getBlockchain } = require('./services/blockchain/blockchainService');
const seed = require('../src/utils/seed');

const PORT = config.server.port;

async function startServer() {
  try {
    // Initialize blockchain (creates genesis block if needed)
    const blockchain = getBlockchain();
    console.log('[Blockchain] Initialized -', blockchain.getBlocks().length, 'blocks');
    
    // Seed development data
    await seed.seedIfEmpty();
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log('\n=================================================');
      console.log('  Healthcare Blockchain System - Phase 1');
      console.log('=================================================');
      console.log(`  Server running on port ${PORT}`);
      console.log(`  Environment: ${config.server.nodeEnv}`);
      console.log(`  API URL: http://localhost:${PORT}/api`);
      console.log('  Status: http://localhost:${PORT}/api/health');
      console.log('');
      console.log('  Services:');
      console.log('    Encryption: AES-256-GCM (REAL)');
      console.log('    DP-FABE: SIMULATED_PROTOTYPE');
      console.log('    Blockchain: SIMULATED');
      console.log('    IPFS: SIMULATED');
      console.log('    Audit Log: ACTIVE');
      console.log('');
      console.log('  Demo Credentials:');
      console.log('    Doctor: doctor@example.com / DemoDoctor@123');
      console.log('    Doctor: cardiologist@example.com / DemoDoctor@123');
      console.log('=================================================\n');
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('[Server] SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('[Server] Server closed');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('\n[Server] SIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('[Server] Server closed');
        process.exit(0);
      });
    });
    
    return server;
  } catch (err) {
    console.error('[Server] Failed to start:', err.message);
    process.exit(1);
  }
}

// Only start if this is the main module
if (require.main === module) {
  startServer();
}

module.exports = { startServer };
