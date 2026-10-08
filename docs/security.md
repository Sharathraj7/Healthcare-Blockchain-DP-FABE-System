# Security Specifications

## End-to-End Encryption (E2EE)
- **Algorithm**: `AES-256-GCM` (Advanced Encryption Standard in Galois/Counter Mode)
- **Key Length**: 256 bits
- **Integrity**: GCM provides both data confidentiality and authenticity (via an Authentication Tag).
- **Scope**: All medical records and uploaded reports (PDF/JPG/PNG) are encrypted **before** being passed to the IPFS storage layer.
- **Rule**: Plaintext medical data is NEVER stored on disk or on the simulated blockchain.

## Immutable Audit Trail
- **System**: Simulated Proof-of-Work Blockchain.
- **Hashing**: `SHA-256`.
- **Integrity**: Any tampering with a block's transaction data invalidates the cryptographic hash chain. The `/api/blockchain/validate` endpoint recalculates all hashes to ensure chain integrity.
- **Audited Events**:
  - `PATIENT_REGISTERED`
  - `DOCTOR_REGISTERED`
  - `MEDICAL_RECORD_CREATED`
  - `DOCTOR_AUTHORIZED` (Access Granted)
  - `DOCTOR_ACCESS_DENIED` (Policy Failed)
  - `DECRYPTION_COMPLETED`

## Role-Based Access Control (RBAC)
- **Mechanism**: JSON Web Tokens (JWT) signed using a secret.
- **Roles**: `PATIENT` vs `DOCTOR`.
- **Enforcement**:
  - Middleware explicitly restricts endpoints based on role.
  - A patient cannot access doctor endpoints.
  - A doctor cannot create records on behalf of a patient (Phase 1).
  - A patient can only view their own records (enforced by `patientId` check).
