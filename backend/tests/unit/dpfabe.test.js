/**
 * DP-FABE Tests
 */

const dpfabeEncrypt = require('../../src/crypto/dpfabe/encrypt');
const dpfabeDecrypt = require('../../src/crypto/dpfabe/decrypt');
const { canAccessRecord, evaluatePolicy, createPolicy, STANDARD_POLICIES } = require('../../src/crypto/dpfabe/policy');
const { generateAttributeKey } = require('../../src/crypto/dpfabe/keygen');
const { getSystemParams } = require('../../src/crypto/dpfabe/setup');
const { PRIVILEGES, IMPLEMENTATION_STATUS, ACCESS_RESULT } = require('../../src/crypto/dpfabe/types');

describe('DP-FABE Module', () => {
  const testMedicalData = {
    name: 'Test Patient',
    age: 45,
    diseaseType: 'Diabetes',
    bloodGroup: 'B+',
    allergies: 'Penicillin',
  };
  
  const doctorAttributes = {
    role: 'DOCTOR',
    specialization: 'CARDIOLOGIST',
    hospital: 'Demo Hospital',
  };
  
  const unauthorizedAttributes = {
    role: 'NURSE',
    specialization: 'GENERAL',
    hospital: 'Demo Hospital',
  };
  
  describe('encrypt()', () => {
    it('should create a dual ciphertext', () => {
      const result = dpfabeEncrypt.encrypt(
        testMedicalData, null, 'patient-1', 'record-1'
      );
      
      expect(result).toBeDefined();
      expect(result.dualCiphertextId).toBeDefined();
    });
    
    it('should contain a fullReadBranch', () => {
      const result = dpfabeEncrypt.encrypt(
        testMedicalData, null, 'patient-1', 'record-1'
      );
      
      expect(result.fullReadBranch).toBeDefined();
      expect(result.fullReadBranch.privilege).toBe(PRIVILEGES.FULL_READ);
      expect(result.fullReadBranch.encryptedData).toBeDefined();
    });
    
    it('should contain a blindInferenceBranch placeholder', () => {
      const result = dpfabeEncrypt.encrypt(
        testMedicalData, null, 'patient-1', 'record-1'
      );
      
      expect(result.blindInferenceBranch).toBeDefined();
      expect(result.blindInferenceBranch.privilege).toBe(PRIVILEGES.BLIND_INFERENCE);
      expect(result.blindInferenceBranch.status).toBe(IMPLEMENTATION_STATUS.RESERVED);
      expect(result.blindInferenceBranch.phase).toBe('PHASE_2');
    });
    
    it('should include key material', () => {
      const result = dpfabeEncrypt.encrypt(
        testMedicalData, null, 'patient-1', 'record-1'
      );
      
      expect(result._keyMaterial).toBeDefined();
      expect(result._keyMaterial.wrappedDataKey).toBeDefined();
    });
    
    it('should encrypt a file when buffer provided', () => {
      const fileBuffer = Buffer.from('test medical report content');
      const result = dpfabeEncrypt.encrypt(
        testMedicalData, fileBuffer, 'patient-1', 'record-1'
      );
      
      expect(result.fullReadBranch.encryptedFile).toBeDefined();
      expect(result._keyMaterial.hasFile).toBe(true);
      expect(result._keyMaterial.wrappedFileKey).toBeDefined();
    });
    
    it('should include implementation status metadata', () => {
      const result = dpfabeEncrypt.encrypt(
        testMedicalData, null, 'patient-1', 'record-1'
      );
      
      expect(result.metadata.implementationStatus).toBe(IMPLEMENTATION_STATUS.SIMULATED);
    });
  });
  
  describe('decrypt() - FULL_READ branch', () => {
    let ciphertext, keyMaterial;
    
    beforeEach(() => {
      const encrypted = dpfabeEncrypt.encrypt(
        testMedicalData, null, 'patient-1', 'record-1', STANDARD_POLICIES.ANY_DOCTOR
      );
      ciphertext = encrypted;
      keyMaterial = encrypted._keyMaterial;
    });
    
    it('should decrypt with authorized doctor attributes', () => {
      const result = dpfabeDecrypt.decrypt(ciphertext, keyMaterial, doctorAttributes);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe(ACCESS_RESULT.GRANTED);
      expect(result.data).toBeDefined();
    });
    
    it('should restore original medical data', () => {
      const result = dpfabeDecrypt.decrypt(ciphertext, keyMaterial, doctorAttributes);
      
      expect(result.data.name).toBe(testMedicalData.name);
      expect(result.data.age).toBe(testMedicalData.age);
      expect(result.data.diseaseType).toBe(testMedicalData.diseaseType);
    });
    
    it('should deny access to unauthorized attributes', () => {
      const result = dpfabeDecrypt.decrypt(ciphertext, keyMaterial, unauthorizedAttributes);
      
      expect(result.success).toBe(false);
      expect(result.result).toBe(ACCESS_RESULT.DENIED);
    });
  });
  
  describe('Policy Engine', () => {
    it('should grant access with ROLE == DOCTOR', () => {
      const policy = createPolicy('ROLE == DOCTOR');
      const result = canAccessRecord(doctorAttributes, policy);
      
      expect(result.satisfied).toBe(true);
      expect(result.result).toBe(ACCESS_RESULT.GRANTED);
    });
    
    it('should deny access with wrong role', () => {
      const policy = createPolicy('ROLE == DOCTOR');
      const result = canAccessRecord(unauthorizedAttributes, policy);
      
      expect(result.satisfied).toBe(false);
      expect(result.result).toBe(ACCESS_RESULT.DENIED);
    });
    
    it('should evaluate AND conditions correctly', () => {
      const policy = createPolicy('ROLE == DOCTOR AND SPECIALIZATION == CARDIOLOGIST');
      
      const validResult = canAccessRecord(doctorAttributes, policy);
      expect(validResult.satisfied).toBe(true);
      
      const invalidResult = canAccessRecord({
        role: 'DOCTOR',
        specialization: 'NEUROLOGIST',
      }, policy);
      expect(invalidResult.satisfied).toBe(false);
    });
    
    it('should evaluate OR conditions correctly', () => {
      const policy = createPolicy('SPECIALIZATION == GENERAL OR SPECIALIZATION == CARDIOLOGIST');
      
      const result1 = evaluatePolicy(policy.expression, { specialization: 'GENERAL' });
      const result2 = evaluatePolicy(policy.expression, { specialization: 'CARDIOLOGIST' });
      const result3 = evaluatePolicy(policy.expression, { specialization: 'NEUROLOGIST' });
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(false);
    });
  });
  
  describe('Key Generation', () => {
    it('should generate an attribute key for a doctor', () => {
      const key = generateAttributeKey(doctorAttributes, 'doctor-1');
      
      expect(key.keyId).toBeDefined();
      expect(key.doctorId).toBe('doctor-1');
      expect(key.attributes).toEqual(doctorAttributes);
      expect(key.privilege).toBe('FULL_READ');
    });
  });
  
  describe('System Setup', () => {
    it('should return system parameters', () => {
      const params = getSystemParams();
      
      expect(params.version).toBeDefined();
      expect(params.branches.fullRead).toBeDefined();
      expect(params.branches.blindInference).toBeDefined();
    });
  });
});
