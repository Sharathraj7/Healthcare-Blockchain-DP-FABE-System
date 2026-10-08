# Application Programming Interface (API)

## Authentication API (`/api/auth`)
- `POST /patient/register`: Register a new patient.
- `POST /patient/login`: Authenticate patient. Returns JWT.
- `POST /doctor/login`: Authenticate doctor. Returns JWT.

## Patient API (`/api/patient`) - Requires PATIENT JWT
- `GET /profile`: Get patient profile.
- `PUT /profile`: Update patient profile.
- `POST /records`: Encrypt and store a new medical record (multipart/form-data supported for files).
- `GET /records`: Get a list of the patient's records (metadata only).
- `GET /records/:id`: Get detailed metadata for a specific record.

## Doctor API (`/api/doctor`) - Requires DOCTOR JWT
- `GET /dashboard`: Doctor statistics and recent activity.
- `GET /patients`: Directory of all patients.
- `GET /patients/:id`: Public profile and record metadata for a specific patient.
- `POST /records/:id/access`: Request DP-FABE authorization and decryption for a record.
- `GET /audit-logs`: View system security events.

## Blockchain API (`/api/blockchain`) - Requires Any Valid JWT
- `GET /blocks`: Retrieve the blockchain ledger.
- `GET /transactions`: Retrieve all blockchain transactions.
- `GET /validate`: Mathematically verify the integrity of the blockchain hashes.
- `GET /stats`: Blockchain statistics (e.g., total blocks).

## Metrics API (`/api/metrics`)
- `GET /`: Retrieve application performance metrics (encryption time, block mining time, etc).
