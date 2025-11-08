/**
 * Tipos para Zama FHE Integration
 */

export interface EncryptedData {
    ciphertext: Uint8Array;
    publicKey: Uint8Array;
    metadata: {
        type: string;
        timestamp: number;
        version: string;
    };
}

export interface KeyPair {
    publicKey: Uint8Array;
    privateKey: Uint8Array;
}

export interface EncryptedPrescription {
    doctor: EncryptedData;
    patient: EncryptedData;
    medicineId: EncryptedData;
    isValid: EncryptedData;
}

export interface EncryptedMedicine {
    name: EncryptedData;
    batchNumber: EncryptedData;
    expirationDate: EncryptedData;
    manufacturer: EncryptedData;
}

export interface EncryptedValidation {
    isApproved: EncryptedData;
    reason: EncryptedData;
    timestamp: EncryptedData;
}

export interface Prescription {
    doctor: string;
    patient: string;
    medicineId: number;
    isValid: boolean;
}

export interface Medicine {
    name: string;
    batchNumber: string;
    expirationDate: number;
    manufacturer: string;
}

export interface Validation {
    isApproved: boolean;
    reason: string;
    timestamp: number;
}
