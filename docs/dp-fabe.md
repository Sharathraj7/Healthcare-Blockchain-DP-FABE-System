# DP-FABE Specification (Prototype)

## What is DP-FABE?
**Dual-Privilege Functional Attribute-Based Encryption (DP-FABE)** is a cryptographic scheme designed to allow fine-grained access control over encrypted data.

## Phase 1 Simulation Constraints
**CRITICAL**: This system implements a *functional simulation* of DP-FABE. True functional encryption requires advanced pairing-based cryptography (e.g., elliptic curve pairings). To maintain system stability and performance in this prototype phase, DP-FABE is simulated at the policy-enforcement layer, while actual data security is handled by `AES-256-GCM`.

We never make false claims that a mathematically secure functional-encryption scheme has been implemented if it has only been simulated.

## Architecture of DP-FABE
When a record is encrypted, a Dual Ciphertext is created containing two branches:

### Branch 1: FULL_READ (Phase 1)
- **Privilege**: Complete plaintext access to the medical record.
- **Audience**: Authorized human doctors.
- **Mechanism**: The underlying AES key is wrapped. When a doctor requests access, their attributes (e.g., `ROLE == DOCTOR AND SPECIALIZATION == CARDIOLOGIST`) are mathematically evaluated against the record's policy tree (AND/OR gates). If the equation evaluates to `true`, the AES key is released, and the record is decrypted.

### Branch 2: BLIND_INFERENCE (Reserved for Phase 2)
- **Privilege**: Partial, privacy-preserving mathematical computation on the encrypted data.
- **Audience**: AI/ML Disease Prediction Engine.
- **Mechanism (Future)**: The ML engine will evaluate the ciphertext to generate a disease prediction *without* ever decrypting the underlying medical data. This preserves patient privacy while still allowing AI analysis.
- **Current Status**: Marked as `RESERVED` and `NOT_IMPLEMENTED`. The backend explicitly skips this branch.

## Policy Engine Implementation
The policy engine supports simple boolean logic strings:
- `ROLE == DOCTOR`
- `SPECIALIZATION == CARDIOLOGIST`
- `ROLE == DOCTOR AND SPECIALIZATION == NEUROLOGIST`

The doctor's JWT provides the verified attributes, which are passed to the policy evaluator before decryption is permitted.
