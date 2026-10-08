/**
 * Authentication API Integration Tests
 */

const request = require('supertest');
const path = require('path');
const fs = require('fs');

// Set test environment before requiring app
process.env.NODE_ENV = 'test';
process.env.IPFS_STORAGE_PATH = path.join(__dirname, '../../storage/test-ipfs-int');
process.env.BLOCKCHAIN_STORAGE_PATH = path.join(__dirname, '../../storage/test-bc-int');

const app = require('../../src/app');
const db = require('../../src/services/database/db');

describe('Authentication API', () => {
  const testPatient = {
    name: 'Integration Test Patient',
    email: `testpatient_${Date.now()}@example.com`,
    password: 'TestPass@123',
    age: 30,
    gender: 'male',
    height: 175,
    weight: 70,
    address: 'Test Address',
    diseaseType: 'Diabetes',
    bloodGroup: 'A+',
    allergies: 'None',
    medicalHistory: 'None',
    medications: 'None',
  };
  
  describe('POST /api/auth/patient/register', () => {
    it('should register a new patient successfully', async () => {
      const res = await request(app)
        .post('/api/auth/patient/register')
        .send(testPatient)
        .expect(201);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.patient.email).toBe(testPatient.email);
      expect(res.body.data.patient.passwordHash).toBeUndefined();
    });
    
    it('should fail with duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/patient/register')
        .send(testPatient)
        .expect(409);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_EXISTS');
    });
    
    it('should fail with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/patient/register')
        .send({ ...testPatient, email: 'invalid-email', password: 'TestPass@123' })
        .expect(400);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
    
    it('should fail with weak password', async () => {
      const res = await request(app)
        .post('/api/auth/patient/register')
        .send({ ...testPatient, email: 'new@test.com', password: 'weak' })
        .expect(400);
      
      expect(res.body.success).toBe(false);
    });
  });
  
  describe('POST /api/auth/patient/login', () => {
    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/patient/login')
        .send({ email: testPatient.email, password: testPatient.password })
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });
    
    it('should fail with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/patient/login')
        .send({ email: testPatient.email, password: 'WrongPass@123' })
        .expect(401);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
    
    it('should fail with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/patient/login')
        .send({ email: 'nonexistent@example.com', password: 'TestPass@123' })
        .expect(401);
      
      expect(res.body.success).toBe(false);
    });
  });
  
  describe('POST /api/auth/doctor/login', () => {
    it('should login doctor with seeded credentials', async () => {
      // Ensure doctor is seeded
      const { seedIfEmpty } = require('../../src/utils/seed');
      await seedIfEmpty();
      
      const res = await request(app)
        .post('/api/auth/doctor/login')
        .send({ email: 'doctor@example.com', password: 'DemoDoctor@123' })
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.doctor.role).toBe('DOCTOR');
    });
    
    it('should fail with wrong doctor password', async () => {
      const res = await request(app)
        .post('/api/auth/doctor/login')
        .send({ email: 'doctor@example.com', password: 'WrongPassword123' })
        .expect(401);
      
      expect(res.body.success).toBe(false);
    });
  });
  
  describe('Route Protection', () => {
    it('should reject unauthenticated requests to patient routes', async () => {
      const res = await request(app)
        .get('/api/patient/profile')
        .expect(401);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
    
    it('should reject unauthenticated requests to doctor routes', async () => {
      const res = await request(app)
        .get('/api/doctor/dashboard')
        .expect(401);
      
      expect(res.body.success).toBe(false);
    });
    
    it('should reject patient token on doctor route', async () => {
      // Login as patient first
      const loginRes = await request(app)
        .post('/api/auth/patient/login')
        .send({ email: testPatient.email, password: testPatient.password });
      
      const patientToken = loginRes.body.data.token;
      
      // Try to access doctor route with patient token
      const res = await request(app)
        .get('/api/doctor/dashboard')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });
  
  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const res = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('healthy');
    });
  });
});
