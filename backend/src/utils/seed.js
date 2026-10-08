/**
 * Seed Script - Development Demo Data
 * 
 * Creates demo doctors and patients for testing.
 * These are DEVELOPMENT DEMO credentials only.
 * 
 * DEMO DOCTORS:
 * - doctor@example.com / DemoDoctor@123 (Cardiologist)
 * - cardiologist@example.com / DemoDoctor@123 (Cardiologist)
 * 
 * DEMO PATIENTS:
 * - patient@example.com / DemoPatient@123
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const db = require('../services/database/db');
const { getBlockchain, TRANSACTION_TYPES } = require('../services/blockchain/blockchainService');
const auditService = require('../services/audit/auditService');
const config = require('../config');

const DEMO_DOCTORS = [
  {
    name: 'Dr. Ravi Kumar',
    email: 'doctor@example.com',
    password: 'DemoDoctor@123',
    role: 'DOCTOR',
    specialization: 'CARDIOLOGIST',
    hospital: 'Demo Hospital',
    department: 'Cardiology',
    licenseNumber: 'MCI-2024-001',
    isDemo: true,
  },
  {
    name: 'Dr. Meena Sharma',
    email: 'cardiologist@example.com',
    password: 'DemoDoctor@123',
    role: 'DOCTOR',
    specialization: 'CARDIOLOGIST',
    hospital: 'City Medical Center',
    department: 'Cardiology',
    licenseNumber: 'MCI-2024-002',
    isDemo: true,
  },
];

const DEMO_PATIENTS = [
  {
    name: 'Arun Kumar',
    email: 'patient@example.com',
    password: 'DemoPatient@123',
    role: 'PATIENT',
    age: 45,
    gender: 'male',
    height: 172,
    weight: 78,
    address: '123 Gandhi Street, Chennai, Tamil Nadu',
    diseaseType: 'Diabetes',
    bloodGroup: 'B+',
    allergies: 'Penicillin',
    medicalHistory: 'Diagnosed with Type 2 Diabetes in 2018',
    medications: 'Metformin 500mg',
    isDemo: true,
  },
  {
    name: 'Priya Devi',
    email: 'priya@example.com',
    password: 'DemoPatient@123',
    role: 'PATIENT',
    age: 52,
    gender: 'female',
    height: 160,
    weight: 72,
    address: '456 Nehru Road, Bangalore, Karnataka',
    diseaseType: 'Hypertension',
    bloodGroup: 'O+',
    allergies: 'Sulfa drugs',
    medicalHistory: 'Hypertension since 2015, controlled with medication',
    medications: 'Amlodipine 5mg, Losartan 50mg',
    isDemo: true,
  },
];

async function seedIfEmpty() {
  const existingDoctors = db.doctors.findAll();
  const existingPatients = db.patients.findAll();
  
  if (existingDoctors.length > 0 && existingPatients.length > 0) {
    console.log('[Seed] Data already seeded, skipping...');
    return;
  }
  
  console.log('[Seed] Seeding development data...');
  
  const blockchain = getBlockchain();
  
  // Seed doctors
  for (const doctor of DEMO_DOCTORS) {
    const exists = db.doctors.findOne({ email: doctor.email });
    if (!exists) {
      const passwordHash = await bcrypt.hash(doctor.password, config.security.bcryptRounds);
      const { password, ...doctorData } = doctor;
      
      const seededDoctor = db.doctors.insert({
        ...doctorData,
        passwordHash,
        demoCredentials: {
          note: 'DEVELOPMENT DEMO ONLY',
          email: doctor.email,
          password: doctor.password,
        },
      });
      
      blockchain.addTransaction(
        TRANSACTION_TYPES.DOCTOR_REGISTERED,
        seededDoctor.id,
        null,
        { name: seededDoctor.name, specialization: seededDoctor.specialization }
      );
      
      auditService.log({
        actorId: seededDoctor.id,
        actorRole: 'SYSTEM',
        action: auditService.AUDIT_EVENTS.DOCTOR_REGISTERED,
        success: true,
        metadata: { name: seededDoctor.name, isDemo: true },
      });
      
      console.log(`[Seed] Doctor created: ${doctor.name} (${doctor.email})`);
    }
  }
  
  // Seed patients
  for (const patient of DEMO_PATIENTS) {
    const exists = db.patients.findOne({ email: patient.email });
    if (!exists) {
      const passwordHash = await bcrypt.hash(patient.password, config.security.bcryptRounds);
      const { password, ...patientData } = patient;
      
      const seededPatient = db.patients.insert({
        ...patientData,
        passwordHash,
      });
      
      blockchain.addTransaction(
        TRANSACTION_TYPES.PATIENT_REGISTERED,
        seededPatient.id,
        seededPatient.id,
        { name: seededPatient.name }
      );
      
      auditService.log({
        actorId: seededPatient.id,
        actorRole: 'SYSTEM',
        action: auditService.AUDIT_EVENTS.PATIENT_REGISTERED,
        patientId: seededPatient.id,
        success: true,
        metadata: { name: seededPatient.name, isDemo: true },
      });
      
      console.log(`[Seed] Patient created: ${patient.name} (${patient.email})`);
    }
  }
  
  console.log('[Seed] Development data seeded successfully');
  console.log('\n[DEMO CREDENTIALS - DEVELOPMENT ONLY]');
  console.log('Doctors:');
  DEMO_DOCTORS.forEach(d => console.log(`  ${d.email} / ${d.password}`));
  console.log('Patients:');
  DEMO_PATIENTS.forEach(p => console.log(`  ${p.email} / ${p.password}`));
}

async function clearAndReseed() {
  console.log('[Seed] Clearing all data and reseeding...');
  db.patients.clear();
  db.doctors.clear();
  db.medicalRecords.clear();
  db.auditLogs.clear();
  db.encryptedKeys.clear();
  await seedIfEmpty();
}

// Run if called directly
if (require.main === module) {
  seedIfEmpty()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('[Seed] Error:', err.message);
      process.exit(1);
    });
}

module.exports = { seedIfEmpty, clearAndReseed };
