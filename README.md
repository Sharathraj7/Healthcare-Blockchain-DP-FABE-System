# Healthcare Blockchain DP-FABE System

> **Blockchain-Based Secure Healthcare Data Management System with Dual-Policy Functional Attribute-Based Encryption (DP-FABE) and Content-Addressed Storage**

---

## 📌 Overview

The **Healthcare Blockchain DP-FABE System** is a privacy-first, secure healthcare data management platform designed to protect sensitive patient electronic health records (EHR) while enabling fine-grained, policy-driven access control for medical professionals.

By combining **Dual-Policy Functional Attribute-Based Encryption (DP-FABE)**, **AES-256-GCM authenticated encryption**, an **immutable Proof-of-Work Blockchain ledger**, and **content-addressed storage (IPFS simulation)**, the platform guarantees:
- **Zero Plaintext Leakage**: Medical records and uploaded clinical files (PDF/Images) are encrypted before reaching persistent storage.
- **Dual-Branch Decryption**: Supports both `FULL_READ` access for primary care physicians and `BLIND_INFERENCE` for diagnostic models or emergency verification.
- **Immutable Audit Trail**: Every registration, record creation, authorization attempt, and access denial is cryptographically signed and mined into a tamper-evident blockchain.

---

## 🌟 Key Features

- 🔐 **End-to-End Encryption (AES-256-GCM)**: All medical records and attachments are encrypted with individual dynamic AES keys and authenticated using Galois/Counter Mode.
- 📜 **Dual-Policy FABE Engine**: Attribute-based evaluation against cryptographic policies (e.g. `ROLE == DOCTOR AND SPECIALIZATION == CARDIOLOGIST`).
- ⛓️ **Proof-of-Work Blockchain**: Local SHA-256 blockchain with cryptographic hash chaining, transaction validation, and consensus difficulty mining.
- 📦 **Simulated IPFS Storage**: Content-addressed storage engine addressing encrypted blobs by cryptographic Content Identifiers (CIDs).
- 👥 **Role-Based Access Control (RBAC)**: Secure JWT-authenticated portals tailored for **Patients** and **Doctors**.
- 🔍 **Interactive Blockchain Explorer**: Inspect blocks, verify ledger integrity, track transaction history, and visualize hash linkages in real time.
- 📊 **Security & Performance Metrics**: Real-time monitoring of encryption timings, mining benchmarks, and audit log tracking.

---

## 🏗️ Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                          React + Ant Design UI                         │
│             [ Patient Portal ]           [ Doctor Portal ]             │
│                     │                             │                    │
│                     └──────────────┬──────────────┘                    │
└────────────────────────────────────┼───────────────────────────────────┘
                                     │ HTTPS / REST API
┌────────────────────────────────────▼───────────────────────────────────┐
│                     Node.js / Express Backend Layer                    │
│                                                                        │
│  ┌───────────────────────┐                  ┌──────────────────────┐  │
│  │   Auth & RBAC (JWT)   │                  │ Audit Logger Service │  │
│  └───────────┬───────────┘                  └──────────▲───────────┘  │
│              ▼                                         │              │
│  ┌───────────────────────┐                  ┌──────────┴───────────┐  │
│  │ AES-256-GCM Encryption│                  │  Blockchain Service  │  │
│  └───────────┬───────────┘                  │  (Proof-of-Work PoW) │  │
│              ▼                                         ▲              │
│  ┌───────────────────────┐                             │              │
│  │  DP-FABE Policy Engine├─────────────────────────────┘              │
│  │ (Full Read / Inference)│                             │              │
│  └───────────┬───────────┘                             │              │
│              ▼                                         │              │
│  ┌───────────────────────┐                             │              │
│  │ Simulated IPFS Engine ├────────── CIDs ─────────────┘              │
│  │  (Content Addressed)  │                                            │
│  └───────────────────────┘                                            │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. Record Creation & Encryption
1. **Patient Action**: Enters medical details and uploads optional clinical attachments (PDF, PNG, JPG).
2. **AES Encryption**: Backend generates unique symmetric data & file keys and executes `AES-256-GCM` encryption.
3. **DP-FABE Key Encapsulation**: AES keys are bound to a policy expression and encapsulated into a dual-branch ciphertext.
4. **IPFS Storage**: Ciphertext and encrypted blobs are stored and assigned unique SHA-256-based CIDs.
5. **Blockchain Mining**: A `MEDICAL_RECORD_CREATED` transaction containing CIDs and policy metadata is broadcasted and mined into a block.

### 2. Access Request & Decryption
1. **Doctor Action**: Requests access to a patient record.
2. **Policy Evaluation**: The DP-FABE engine evaluates doctor attributes (e.g. specialization, department, hospital) against the record's policy.
3. **Access Enforcement**:
   - **Authorized**: The `FULL_READ` branch is decrypted, recovering AES keys to return decrypted clinical records.
   - **Denied**: An `ACCESS_DENIED` security transaction is written to the blockchain.
4. **Audit Log**: Access events and cryptographic validations are permanently stored in the audit trail.

---

## 📁 Repository Structure

```
Healthcare-Blockchain-DP-FABE-System/
├── backend/
│   ├── src/
│   │   ├── config/              # Centralized environment & app settings
│   │   ├── controllers/         # Route controllers (Auth, Patient, Doctor, Blockchain, Metrics)
│   │   ├── crypto/              # DP-FABE encryption & policy evaluation
│   │   ├── middleware/          # JWT authentication & RBAC middleware
│   │   ├── routes/              # Express API endpoints
│   │   ├── services/            # AES-256-GCM, Blockchain, IPFS, Audit, Database
│   │   ├── storage/data/        # Seed datasets (Doctors, Patients, Records)
│   │   ├── utils/               # Database seeding and helper utilities
│   │   ├── app.js               # Express application initialization
│   │   └── server.js            # Server entry point
│   ├── storage/                 # Local simulated blockchain & IPFS storage
│   ├── tests/                   # Unit, integration, and E2E test suites
│   ├── .env.example             # Example environment configuration
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── context/             # Authentication & session context
│   │   ├── layouts/             # Patient & Doctor dashboard layouts
│   │   ├── pages/
│   │   │   ├── doctor/          # Doctor dashboard, patient records, audit logs
│   │   │   ├── patient/         # Patient dashboard, medical uploads, profile
│   │   │   ├── BlockchainExplorer.jsx  # Interactive ledger explorer
│   │   │   ├── LoginPage.jsx           # Unified authentication
│   │   │   └── PatientRegisterPage.jsx # Patient registration
│   │   ├── services/            # Axios API client integrations
│   │   ├── App.jsx              # Main routing & layout configuration
│   │   └── index.css            # Modern design system & styles
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── docs/                        # Technical documentation
│   ├── api.md                   # Complete REST API reference
│   ├── architecture.md          # In-depth system architecture
│   ├── dp-fabe.md               # DP-FABE cryptographic model specification
│   └── security.md              # Threat model & security guarantees
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

---

### Backend Setup

1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your environment configuration file:
   ```bash
   cp .env.example .env
   ```
   *(On Windows PowerShell: `Copy-Item .env.example .env`)*
4. (Optional) Run the seed script to populate development demo accounts:
   ```bash
   npm run seed
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend server will run on `http://localhost:5000`.*

---

### Frontend Setup

1. Open a second terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend application will run on `http://localhost:5173`.*

---

## 🔑 Demo Credentials

The system includes pre-configured demo credentials for testing all workflows out of the box:

| Role | Email | Password | Specialization / Notes |
|---|---|---|---|
| **Doctor (Cardiologist)** | `doctor@example.com` | `DemoDoctor@123` | Cardiologist, Demo Hospital |
| **Doctor (Cardiologist)** | `cardiologist@example.com` | `DemoDoctor@123` | Cardiologist, City Medical Center |
| **Patient** | `patient@example.com` | `DemoPatient@123` | Arun Kumar (Type 2 Diabetes) |
| **Patient** | `priya@example.com` | `DemoPatient@123` | Priya Devi (Hypertension) |

---

## 🧪 Testing

### Backend Test Suite
Run unit, integration, and end-to-end tests:
```bash
cd backend
npm test
```
Run coverage report:
```bash
npm run test:coverage
```

### Frontend Test Suite
Run Vitest component tests:
```bash
cd frontend
npm test
```

---

## 📚 Documentation

For in-depth explanations, consult the technical documents in [`docs/`](./docs):
- [Architecture Overview](./docs/architecture.md): Deep dive into system layers and cryptographic workflows.
- [DP-FABE Specification](./docs/dp-fabe.md): Dual-Policy Functional Attribute-Based Encryption scheme details.
- [Security Guidelines](./docs/security.md): Threat modeling, key management, and cryptographic standards.
- [API Documentation](./docs/api.md): Endpoints, payloads, and response formats.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
