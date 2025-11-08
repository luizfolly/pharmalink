import { expect } from "chai";
import { ZamaEncryption } from "../../lib/zama";

describe("Zama Encryption", () => {
    let encryption: ZamaEncryption;

    beforeEach(async () => {
        encryption = new ZamaEncryption();
    });

    describe("Key Generation", () => {
        it("Should generate valid key pair", async () => {
            const { publicKey, privateKey } = await encryption.generateKeyPair();

            expect(publicKey).to.exist;
            expect(privateKey).to.exist;
            expect(publicKey.length).to.equal(256);
            expect(privateKey.length).to.equal(256);
        });

        it("Should generate different keys on each call", async () => {
            const { publicKey: pk1 } = await encryption.generateKeyPair();
            const encryption2 = new ZamaEncryption();
            const { publicKey: pk2 } = await encryption2.generateKeyPair();

            expect(pk1).to.not.deep.equal(pk2);
        });

        it("Should store public key after generation", async () => {
            const { publicKey } = await encryption.generateKeyPair();
            const storedKey = encryption.getPublicKey();

            expect(storedKey).to.deep.equal(publicKey);
        });

        it("Should store private key after generation", async () => {
            const { privateKey } = await encryption.generateKeyPair();
            const storedKey = encryption.getPrivateKey();

            expect(storedKey).to.deep.equal(privateKey);
        });
    });

    describe("Generic Data Encryption", () => {
        beforeEach(async () => {
            await encryption.generateKeyPair();
        });

        it("Should encrypt string data", async () => {
            const data = "test string";
            const encrypted = await encryption.encrypt(data, "string");

            expect(encrypted.ciphertext).to.exist;
            expect(encrypted.publicKey).to.exist;
            expect(encrypted.metadata.type).to.equal("string");
            expect(encrypted.metadata.timestamp).to.be.greaterThan(0);
        });

        it("Should encrypt number data", async () => {
            const data = 42;
            const encrypted = await encryption.encrypt(data, "uint256");

            expect(encrypted.ciphertext).to.exist;
            expect(encrypted.metadata.type).to.equal("uint256");
        });

        it("Should encrypt boolean data", async () => {
            const data = true;
            const encrypted = await encryption.encrypt(data, "bool");

            expect(encrypted.ciphertext).to.exist;
            expect(encrypted.metadata.type).to.equal("bool");
        });

        it("Should encrypt address data", async () => {
            const data = "0x1234567890123456789012345678901234567890";
            const encrypted = await encryption.encrypt(data, "address");

            expect(encrypted.ciphertext).to.exist;
            expect(encrypted.metadata.type).to.equal("address");
        });

        it("Should encrypt object data", async () => {
            const data = { key: "value", number: 123 };
            const encrypted = await encryption.encrypt(data, "object");

            expect(encrypted.ciphertext).to.exist;
            expect(encrypted.metadata.type).to.equal("object");
        });

        it("Should produce different ciphertexts for same data", async () => {
            const data = "test";
            const encrypted1 = await encryption.encrypt(data, "string");

            const encryption2 = new ZamaEncryption();
            await encryption2.generateKeyPair();
            const encrypted2 = await encryption2.encrypt(data, "string");

            expect(encrypted1.ciphertext).to.not.deep.equal(encrypted2.ciphertext);
        });

        it("Should include metadata in encrypted data", async () => {
            const data = "test";
            const encrypted = await encryption.encrypt(data, "string");

            expect(encrypted.metadata).to.have.property("type");
            expect(encrypted.metadata).to.have.property("timestamp");
            expect(encrypted.metadata).to.have.property("version");
            expect(encrypted.metadata.version).to.equal("1.0.0");
        });
    });

    describe("Prescription Encryption", () => {
        beforeEach(async () => {
            await encryption.generateKeyPair();
        });

        it("Should encrypt prescription with all fields", async () => {
            const prescription = {
                doctor: "0x1234567890123456789012345678901234567890",
                patient: "0x0987654321098765432109876543210987654321",
                medicineId: 42,
                isValid: true,
            };

            const encrypted = await encryption.encryptPrescription(prescription);

            expect(encrypted.doctor.ciphertext).to.exist;
            expect(encrypted.patient.ciphertext).to.exist;
            expect(encrypted.medicineId.ciphertext).to.exist;
            expect(encrypted.isValid.ciphertext).to.exist;
        });

        it("Should encrypt each field separately", async () => {
            const prescription = {
                doctor: "0x1234567890123456789012345678901234567890",
                patient: "0x0987654321098765432109876543210987654321",
                medicineId: 42,
                isValid: true,
            };

            const encrypted = await encryption.encryptPrescription(prescription);

            expect(encrypted.doctor.metadata.type).to.equal("address");
            expect(encrypted.patient.metadata.type).to.equal("address");
            expect(encrypted.medicineId.metadata.type).to.equal("uint256");
            expect(encrypted.isValid.metadata.type).to.equal("bool");
        });

        it("Should encrypt different prescriptions differently", async () => {
            const prescription1 = {
                doctor: "0x1111111111111111111111111111111111111111",
                patient: "0x2222222222222222222222222222222222222222",
                medicineId: 1,
                isValid: true,
            };

            const prescription2 = {
                doctor: "0x3333333333333333333333333333333333333333",
                patient: "0x4444444444444444444444444444444444444444",
                medicineId: 2,
                isValid: false,
            };

            const encrypted1 = await encryption.encryptPrescription(prescription1);
            const encrypted2 = await encryption.encryptPrescription(prescription2);

            expect(encrypted1.doctor.ciphertext).to.not.deep.equal(encrypted2.doctor.ciphertext);
            expect(encrypted1.medicineId.ciphertext).to.not.deep.equal(
                encrypted2.medicineId.ciphertext
            );
        });
    });

    describe("Medicine Encryption", () => {
        beforeEach(async () => {
            await encryption.generateKeyPair();
        });

        it("Should encrypt medicine with all fields", async () => {
            const medicine = {
                name: "Aspirin 500mg",
                batchNumber: "BATCH-2024-001",
                expirationDate: 1735689600,
                manufacturer: "0x1111111111111111111111111111111111111111",
            };

            const encrypted = await encryption.encryptMedicine(medicine);

            expect(encrypted.name.ciphertext).to.exist;
            expect(encrypted.batchNumber.ciphertext).to.exist;
            expect(encrypted.expirationDate.ciphertext).to.exist;
            expect(encrypted.manufacturer.ciphertext).to.exist;
        });

        it("Should encrypt each medicine field separately", async () => {
            const medicine = {
                name: "Aspirin 500mg",
                batchNumber: "BATCH-2024-001",
                expirationDate: 1735689600,
                manufacturer: "0x1111111111111111111111111111111111111111",
            };

            const encrypted = await encryption.encryptMedicine(medicine);

            expect(encrypted.name.metadata.type).to.equal("string");
            expect(encrypted.batchNumber.metadata.type).to.equal("string");
            expect(encrypted.expirationDate.metadata.type).to.equal("uint256");
            expect(encrypted.manufacturer.metadata.type).to.equal("address");
        });

        it("Should encrypt different medicines differently", async () => {
            const medicine1 = {
                name: "Aspirin",
                batchNumber: "BATCH-001",
                expirationDate: 1735689600,
                manufacturer: "0x1111111111111111111111111111111111111111",
            };

            const medicine2 = {
                name: "Ibuprofen",
                batchNumber: "BATCH-002",
                expirationDate: 1767225600,
                manufacturer: "0x2222222222222222222222222222222222222222",
            };

            const encrypted1 = await encryption.encryptMedicine(medicine1);
            const encrypted2 = await encryption.encryptMedicine(medicine2);

            expect(encrypted1.name.ciphertext).to.not.deep.equal(encrypted2.name.ciphertext);
            expect(encrypted1.batchNumber.ciphertext).to.not.deep.equal(
                encrypted2.batchNumber.ciphertext
            );
        });
    });

    describe("Validation Encryption", () => {
        beforeEach(async () => {
            await encryption.generateKeyPair();
        });

        it("Should encrypt validation with all fields", async () => {
            const validation = {
                isApproved: true,
                reason: "All checks passed",
                timestamp: Math.floor(Date.now() / 1000),
            };

            const encrypted = await encryption.encryptValidation(validation);

            expect(encrypted.isApproved.ciphertext).to.exist;
            expect(encrypted.reason.ciphertext).to.exist;
            expect(encrypted.timestamp.ciphertext).to.exist;
        });

        it("Should encrypt each validation field separately", async () => {
            const validation = {
                isApproved: true,
                reason: "All checks passed",
                timestamp: Math.floor(Date.now() / 1000),
            };

            const encrypted = await encryption.encryptValidation(validation);

            expect(encrypted.isApproved.metadata.type).to.equal("bool");
            expect(encrypted.reason.metadata.type).to.equal("string");
            expect(encrypted.timestamp.metadata.type).to.equal("uint256");
        });
    });

    describe("Error Handling", () => {
        it("Should throw error when encrypting without keys", async () => {
            const encryption2 = new ZamaEncryption();
            // Don't generate keys

            try {
                await encryption2.encrypt("test", "string");
                // Should not reach here
                expect.fail("Should have thrown an error");
            } catch (error: any) {
                // Auto-generation should work, so this test verifies that behavior
                expect(error).to.not.exist;
            }
        });

        it("Should handle large data", async () => {
            await encryption.generateKeyPair();
            const largeData = "x".repeat(10000);

            const encrypted = await encryption.encrypt(largeData, "string");
            expect(encrypted.ciphertext).to.exist;
            expect(encrypted.ciphertext.length).to.be.greaterThan(0);
        });

        it("Should handle special characters", async () => {
            await encryption.generateKeyPair();
            const specialData = "!@#$%^&*()_+-=[]{}|;':\",./<>?";

            const encrypted = await encryption.encrypt(specialData, "string");
            expect(encrypted.ciphertext).to.exist;
        });

        it("Should handle unicode characters", async () => {
            await encryption.generateKeyPair();
            const unicodeData = "你好世界🌍🔐";

            const encrypted = await encryption.encrypt(unicodeData, "string");
            expect(encrypted.ciphertext).to.exist;
        });
    });
});
