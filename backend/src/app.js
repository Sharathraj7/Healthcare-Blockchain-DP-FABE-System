/**
 * Express Application Setup
 * Healthcare Blockchain Data Management System - Phase 1
 */

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');

const config = require('./config');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const blockchainRoutes = require('./routes/blockchainRoutes');
const metricsRoutes = require('./routes/metricsRoutes');
const metricsController = require('./controllers/metricsController');
const { authenticate } = require('./middleware/auth');

// Ensure storage directories exist
const storageDirs = [
  config.storage.ipfsPath,
  config.storage.blockchainPath,
  config.storage.dataPath,
];
storageDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const app = express();

// === SECURITY MIDDLEWARE ===

// HTTP security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: config.cors.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMax,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
});
app.use('/api/', limiter);

// === PARSING MIDDLEWARE ===
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// File upload middleware
app.use(fileUpload({
  limits: { fileSize: config.upload.maxFileSize },
  abortOnLimit: true,
  safeFileNames: true,
  preserveExtension: true,
  useTempFiles: false,
}));

// === LOGGING ===
if (config.server.isDevelopment) {
  app.use(morgan('dev'));
}

// === HEALTH CHECK ===
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      system: 'Healthcare Blockchain System',
      phase: 'Phase 1',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      services: {
        encryption: 'AES-256-GCM (REAL)',
        dpfabe: 'SIMULATED_PROTOTYPE',
        blockchain: 'SIMULATED',
        ipfs: 'SIMULATED',
        auditLog: 'ACTIVE',
      },
    },
  });
});

// === API ROUTES ===
app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/metrics', metricsRoutes);

// IPFS metadata endpoint
app.get('/api/ipfs/:cid', authenticate, metricsController.getIpfsMetadata);

// === ERROR HANDLING ===
app.use(notFound);
app.use(errorHandler);

module.exports = app;
