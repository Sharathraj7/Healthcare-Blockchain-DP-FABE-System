/**
 * Application Configuration
 * Centralized configuration management for the healthcare blockchain system
 */

require('dotenv').config();

const config = {
  server: {
    port: parseInt(process.env.PORT, 10) || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_change_in_production',
    expire: process.env.JWT_EXPIRE || '24h',
  },
  encryption: {
    masterKey: process.env.ENCRYPTION_MASTER_KEY || 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    algorithm: 'aes-256-gcm',
  },
  cors: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf'],
  },
  storage: {
    ipfsPath: process.env.IPFS_STORAGE_PATH || './storage/ipfs',
    blockchainPath: process.env.BLOCKCHAIN_STORAGE_PATH || './storage/blockchain',
    dataPath: './storage/data',
  },
  security: {
    bcryptRounds: 12,
    rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 100,
  },
};

module.exports = config;
