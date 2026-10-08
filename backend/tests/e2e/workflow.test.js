/**
 * End-to-End Test
 * Complete healthcare workflow: Patient registration → Record creation → Doctor access
 */

const request = require('supertest');
const path = require('path');
const fs = require('fs');

process.env.NODE_ENV = 'test';
process.env.IPFS_STORAGE_PATH = path.join(__dirname, '../../storage/test-ipfs-e2e');
process.env.BLOCKCHAIN_STORAGE_PATH = path.join(__dirname, '../../storage/test-bc-e2e');

const app = require('../../src/app');

describe('End-to-End Healthcare Workflow', () => {
  const timestamp = Date.now();
  let patientToken;
  let doctorToken;
  let patientId;
  let recordId;
  let transactionId;
  let blockNumber;
  let ipfsCid;
  
  const testPatientData = {
    name: 'E2E Test Patient',
    email: `e2e_patient_${timestamp}@example.com`,
    password: 'E2ETest@123',
    age: 40,
    gender: 'female',
    height: 165,
    weight: 65,
    address: '789 E2E Street, Test City',
    diseaseType: 'Hypertension',
    bloodGroup: 'O-',
    allergies: 'Aspirin',
    medicalHistory: 'Hypertension diagnosed 2020',
    medications: 'Amlodipine 5mg',
  };
  
  // STEP 1: Patient Registration
  it('Step 1: Should register a new patient', async () => {
    const res = await request(app)
      .post('/api/auth/patient/register')
      .send(testPatientData)
      .expect(201);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    patientToken = res.body.data.token;
    patientId = res.body.data.patient.id;
    
    console.log('✓ Step 1: Patient registered:', patientId);
  });
  
  // STEP 2: Patient Login
  it('Step 2: Should login as patient', async () => {
    const res = await request(app)
      .post('/api/auth/patient/login')
      .send({ email: testPatientData.email, password: testPatientData.password })
      .expect(200);
    
    expect(res.body.success).toBe(true);
    patientToken = res.body.data.token;
    
    console.log('✓ Step 2: Patient logged in');
  });
  
  // STEP 3: Create Medical Record (Encrypt + IPFS + Blockchain)
  it('Step 3: Should create an encrypted medical record', async () => {
    const medicalData = {
      age: testPatientData.age,
      gender: testPatientData.gender,
      height: testPatientData.height,
      weight: testPatientData.weight,
      address: testPatientData.address,
      diseaseType: testPatientData.diseaseType,
      bloodGroup: testPatientData.bloodGroup,
      allergies: testPatientData.allergies,
      medicalHistory: testPatientData.medicalHistory,
      medications: testPatientData.medications,
      accessPolicy: 'ANY_DOCTOR',
    };
    
    const res = await request(app)
      .post('/api/patient/records')
      .set('Authorization', `Bearer ${patientToken}`)
      .send(medicalData)
      .expect(201);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data.recordId).toBeDefined();
    expect(res.body.data.transactionId).toBeDefined();
    expect(res.body.data.ipfsCid).toBeDefined();
    expect(res.body.data.encryptionStatus).toBe('ENCRYPTED');
    expect(res.body.data.blockNumber).toBeGreaterThan(0);
    
    recordId = res.body.data.recordId;
    transactionId = res.body.data.transactionId;
    blockNumber = res.body.data.blockNumber;
    ipfsCid = res.body.data.ipfsCid;
    
    console.log('✓ Step 3: Medical record created');
    console.log('  Record ID:', recordId);
    console.log('  Transaction ID:', transactionId);
    console.log('  Block Number:', blockNumber);
    console.log('  IPFS CID:', ipfsCid);
  });
  
  // STEP 4: Verify Blockchain
  it('Step 4: Should verify blockchain integrity', async () => {
    const res = await request(app)
      .get('/api/blockchain/validate')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(200);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data.isValid).toBe(true);
    
    console.log('✓ Step 4: Blockchain integrity verified');
    console.log('  Total blocks:', res.body.data.blockCount);
  });
  
  // STEP 5: View Patient Records
  it('Step 5: Should retrieve patient records', async () => {
    const res = await request(app)
      .get('/api/patient/records')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(200);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data.records.length).toBeGreaterThan(0);
    
    const found = res.body.data.records.find(r => r.id === recordId);
    expect(found).toBeDefined();
    expect(found.encryptionStatus).toBe('ENCRYPTED');
    
    console.log('✓ Step 5: Patient records retrieved');
  });
  
  // STEP 6: Doctor Login
  it('Step 6: Should login as doctor', async () => {
    const { seedIfEmpty } = require('../../src/utils/seed');
    await seedIfEmpty();
    
    const res = await request(app)
      .post('/api/auth/doctor/login')
      .send({ email: 'doctor@example.com', password: 'DemoDoctor@123' })
      .expect(200);
    
    expect(res.body.success).toBe(true);
    doctorToken = res.body.data.token;
    
    console.log('✓ Step 6: Doctor logged in:', res.body.data.doctor.name);
  });
  
  // STEP 7: Doctor Searches Patient
  it('Step 7: Should search for patient', async () => {
    const res = await request(app)
      .get('/api/doctor/patients')
      .set('Authorization', `Bearer ${doctorToken}`)
      .expect(200);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data.patients.length).toBeGreaterThan(0);
    
    const found = res.body.data.patients.find(p => p.id === patientId);
    expect(found).toBeDefined();
    
    console.log('✓ Step 7: Patient found by doctor');
  });
  
  // STEP 8: Doctor Requests Record Access (Policy Check + Decrypt)
  it('Step 8: Should authorize doctor access and decrypt record', async () => {
    const res = await request(app)
      .post(`/api/doctor/records/${recordId}/access`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .expect(200);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessGranted).toBe(true);
    expect(res.body.data.medicalData).toBeDefined();
    expect(res.body.data.medicalData.diseaseType).toBe(testPatientData.diseaseType);
    expect(res.body.data.medicalData.bloodGroup).toBe(testPatientData.bloodGroup);
    expect(res.body.data.privilege).toBe('FULL_READ');
    
    console.log('✓ Step 8: Doctor access authorized and record decrypted');
    console.log('  Disease:', res.body.data.medicalData.diseaseType);
    console.log('  Privilege:', res.body.data.privilege);
  });
  
  // STEP 9: Verify Audit Logs
  it('Step 9: Should verify audit logs were created', async () => {
    const res = await request(app)
      .get('/api/doctor/audit-logs')
      .set('Authorization', `Bearer ${doctorToken}`)
      .expect(200);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data.logs.length).toBeGreaterThan(0);
    
    const accessLog = res.body.data.logs.find(l => l.action === 'MEDICAL_RECORD_ACCESSED');
    expect(accessLog).toBeDefined();
    
    console.log('✓ Step 9: Audit logs verified');
    console.log('  Total audit events:', res.body.data.logs.length);
  });
  
  // STEP 10: Verify Unauthorized Access is Blocked
  it('Step 10: Should block patient from accessing another patient data', async () => {
    // Try to access another patient's record
    const otherRes = await request(app)
      .get(`/api/patient/records/${recordId}`)
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(200); // own record - should work
    
    // Now try with a fresh patient token accessing the record directly
    const newPatient = {
      name: 'Another Patient',
      email: `another_${timestamp}@example.com`,
      password: 'AnotherTest@123',
      age: 25,
      gender: 'male',
      height: 170,
      weight: 68,
    };
    
    const regRes = await request(app)
      .post('/api/auth/patient/register')
      .send(newPatient);
    
    const otherPatientToken = regRes.body.data.token;
    
    const deniedRes = await request(app)
      .get(`/api/patient/records/${recordId}`)
      .set('Authorization', `Bearer ${otherPatientToken}`)
      .expect(403);
    
    expect(deniedRes.body.success).toBe(false);
    
    console.log('✓ Step 10: Unauthorized access properly blocked');
  });
  
  // STEP 11: View Blockchain Explorer
  it('Step 11: Should view blockchain blocks', async () => {
    const res = await request(app)
      .get('/api/blockchain/blocks')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(200);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data.blocks.length).toBeGreaterThan(0);
    
    console.log('✓ Step 11: Blockchain explorer working');
    console.log('  Total blocks:', res.body.data.total);
  });
  
  // STEP 12: Collect Metrics
  it('Step 12: Should collect performance metrics', async () => {
    const res = await request(app)
      .get('/api/metrics')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(200);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data.metrics.encryptionTimeMs).toBeGreaterThanOrEqual(0);
    expect(res.body.data.metrics.blockchainTimeMs).toBeGreaterThanOrEqual(0);
    
    console.log('✓ Step 12: Metrics collected');
    console.log('  Metrics:', JSON.stringify(res.body.data.metrics, null, 2));
    console.log('\n=== END-TO-END TEST COMPLETE ===');
  });
  
  afterAll(() => {
    // Clean up test storage
    ['test-ipfs-e2e', 'test-bc-e2e'].forEach(dir => {
      const p = path.join(__dirname, '../../storage', dir);
      if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
    });
  });
});
