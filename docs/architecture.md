# Architecture Overview

## System Components
The Healthcare Blockchain System is a service-oriented architecture (SOA) divided into two main layers:

### 1. Frontend (React + Vite + Ant Design)
- **Role**: Provides the user interface for patients and doctors.
- **Key Modules**:
  - `Patient Portal`: Dashboard, profile management, secure medical record upload.
  - `Doctor Portal`: Patient directory, record decryption, and audit log monitoring.
  - `Blockchain Explorer`: Shared view to observe the state of the simulated blockchain ledger.
  - `API Service`: Axios-based client for communicating with the backend.

### 2. Backend (Node.js + Express)
- **Role**: Core application logic, security, and integration with simulated decentralized networks.
- **Core Services**:
  - `Crypto Service`: Handles real AES-256-GCM encryption/decryption of medical records and files.
  - `DP-FABE Simulation`: Provides policy creation, attribute evaluation, and dual-branch ciphertext structuring (FULL_READ, BLIND_INFERENCE).
  - `Blockchain Service`: Simulates a Proof-of-Work blockchain (Difficulty = 2) for immutable logging of transactions and access requests.
  - `IPFS Service`: Simulates content-addressed storage. Encrypted data is stored locally but addressed by its SHA-256 hash.
  - `Audit Service`: Captures detailed security events for monitoring and compliance.
  - `Auth/RBAC`: Manages JSON Web Tokens (JWT) and Role-Based Access Control.

## Data Flow: Encrypting a Medical Record
1. **Patient Action**: Enters medical info and uploads an optional file in the frontend.
2. **Encryption**: Backend receives plaintext. It generates a unique data key and file key. Medical data and files are encrypted using `AES-256-GCM`.
3. **DP-FABE Binding**: The AES keys are wrapped in a simulated DP-FABE ciphertext, bound to a specific access policy (e.g., `ROLE == DOCTOR AND SPECIALIZATION == CARDIOLOGIST`).
4. **IPFS Storage**: The dual-branch DP-FABE ciphertext and encrypted file are pushed to the IPFS Service. CIDs are returned.
5. **Blockchain Transaction**: A `MEDICAL_RECORD_CREATED` transaction is broadcasted to the Blockchain Service, containing the IPFS CIDs and policy metadata. A block is mined.

## Data Flow: Decrypting a Medical Record
1. **Doctor Action**: Requests access to a specific patient's record.
2. **Policy Evaluation**: The DP-FABE engine mathematically evaluates the doctor's attributes (role, specialization) against the record's policy.
3. **Audit Logging**: If denied, an `ACCESS_DENIED` event is written to the blockchain.
4. **Decryption**: If authorized, the DP-FABE engine "unwraps" the `FULL_READ` branch, exposing the AES keys. The `AES-256-GCM` service decrypts the actual data and file.
5. **Audit Logging**: A successful `RECORD_ACCESSED` and `DECRYPTION_COMPLETED` transaction is added to the blockchain.
