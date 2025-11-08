import { expect } from "chai";
import { ZamaEncryption, ZamaDecryption } from "../../lib/zama";

describe("Zama Decryption", () => {
    let encryption: ZamaEncryption;
    let decryption: ZamaDecryption;

    beforeEach(async () => {
        encryption = new ZamaEncryption();
        const { privateKey } = await encryption.generateKeyPair();
        decryption = new ZamaDecryption(privateKey);
    });

    describe("Generic Data Decryption", () => {
        it("Should decrypt string data", async () => {
            const originalData = "test string";
            const encrypted = await encryption.encrypt(originalData, "string");
            const decrypted = await decryption.decrypt(encrypted);

            expect(decrypted).to.equal(originalData);
        });

        it("Should decrypt number data", async () => {
            const originalData = 42;
            const encrypted = await encryption.encrypt(originalData, "uint256");
            const decrypted = await decryption.decrypt(encrypted);

            expect(decrypted).to.equal(originalData);
        });

        it("Should decrypt boolean data", async () => {
            const originalData = true;
            const encrypted = await encryption.encrypt(originalData, "bool");
            const decrypted = await decryption.decrypt(encrypted);

            expect(decrypted).to.equal(originalData);
        });

        it("Should decrypt address data", async () => {
            const originalData = "0x1234567890123456789012345678901234567890";
            const encrypted = await encryption.encrypt(originalData, "address");
            const decrypted = await decryption.decrypt(encrypted);

            expect(decrypted).to.equal(originalData);
        });

        it("Should decrypt object data", async () => {
            const originalData = { key: "value", number: 123 };
            const encrypted = await encryption.encrypt(originalData, "object");
            const decrypted = await decryption.decrypt(encrypted);

            expect(decrypted).to.deep.equal(originalData);
        });

        it("Should decrypt array data", async () => {
            const originalData = [1, 2, 3, 4, 5];
            const encrypted = await encryption.encrypt(originalData, "array");
            const decrypted = await decryption.decrypt(encrypted);

            expect(decrypted).to.deep.equal(originalData);
        });
    });

    describe("Prescription Decryption", () => {
        it("Should decrypt prescription with all fields", async () => {
            const originalPrescription = {
                doctor: "0x1234567890123456789012345678901234567890",
                patient: "0x0987654321098765432109876543210987654321",
                medicineId: 42,
                isValid: true,
            };

            const encrypted = await encryption.encryptPrescription(originalPrescription);
            const decrypted = await decryption.decryptPrescription(encrypted);

            expect(decrypted.doctor).to.equal(originalPrescription.doctor);
            expect(decrypted.patient).to.equal(originalPrescription.patient);
            expect(decrypted.medicineId).to.equal(originalPrescription.medicineId);
            expect(decrypted.isValid).to.equal(originalPrescription.isValid);
        });

        it("Should decrypt prescription with different values", async () => {
            const originalPrescription = {
                doctor: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                patient: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                medicineId: 999,
                isValid: false,
            };

            const encrypted = await encryption.encryptPrescription(originalPrescription);
            const decrypted = await decryption.decryptPrescription(encrypted);

            expect(decrypted.doctor).to.equal(originalPrescription.doctor);
            expect(decrypted.patient).to.equal(originalPrescription.patient);
            expect(decrypted.medicineId).to.equal(originalPrescription.medicineId);
            expect(decrypted.isValid).to.equal(originalPrescription.isValid);
        });
    });

    describe("Medicine Decryption", () => {
        it("Should decrypt medicine with all fields", async () => {
            const originalMedicine = {
                name: "Aspirin 500mg",
                batchNumber: "BATCH-2024-001",
                expirationDate: 1735689600,
                manufacturer: "0x1111111111111111111111111111111111111111",
            };

            const encrypted = await encryption.encryptMedicine(originalMedicine);
            const decrypted = await decryption.decryptMedicine(encrypted);

            expect(decrypted.name).to.equal(originalMedicine.name);
            expect(decrypted.batchNumber).to.equal(originalMedicine.batchNumber);
            expect(decrypted.expirationDate).to.equal(originalMedicine.expirationDate);
            expect(decrypted.manufacturer).to.equal(originalMedicine.manufacturer);
        });

        it("Should decrypt medicine with different values", async () => {
            const originalMedicine = {
                name: "Ibuprofen 200mg",
                batchNumber: "BATCH-2024-999",
                expirationDate: 1767225600,
                manufacturer: "0x2222222222222222222222222222222222222222",
            };

            const encrypted = await encryption.encryptMedicine(originalMedicine);
            const decrypted = await decryption.decryptMedicine(encrypted);

            expect(decrypted.name).to.equal(originalMedicine.name);
            expect(decrypted.batchNumber).to.equal(originalMedicine.batchNumber);
            expect(decrypted.expirationDate).to.equal(originalMedicine.expirationDate);
            expect(decrypted.manufacturer).to.equal(originalMedicine.manufacturer);
        });
    });

    describe("Validation Decryption", () => {
        it("Should decrypt validation with all fields", async () => {
            const timestamp = Math.floor(Date.now() / 1000);
            const originalValidation = {
                isApproved: true,
                reason: "All checks passed",
                timestamp,
            };

            const encrypted = await encryption.encryptValidation(originalValidation);
            const decrypted = await decryption.decryptValidation(encrypted);

            expect(decrypted.isApproved).to.equal(originalValidation.isApproved);
            expect(decrypted.reason).to.equal(originalValidation.reason);
            expect(decrypted.timestamp).to.equal(originalValidation.timestamp);
        });

        it("Should decrypt validation with rejection", async () => {
            const timestamp = Math.floor(Date.now() / 1000);
            const originalValidation = {
                isApproved: false,
                reason: "Expired batch",
                timestamp,
            };

            const encrypted = await encryption.encryptValidation(originalValidation);
            const decrypted = await decryption.decryptValidation(encrypted);

            expect(decrypted.isApproved).to.equal(false);
            expect(decrypted.reason).to.equal("Expired batch");
        });
    });

    describe("Round-trip Encryption/Decryption", () => {
        it("Should maintain data integrity through encryption/decryption cycle", async () => {
            const testData = "sensitive information";
            const encrypted = await encryption.encrypt(testData, "string");
            const decrypted = await decryption.decrypt(encrypted);

            expect(decrypted).to.equal(testData);
        });

        it("Should handle multiple round-trips", async () => {
            const originalData = "test data";

            for (let i = 0; i < 5; i++) {
                const encrypted = await encryption.encrypt(originalData, "string");
                const decrypted = await decryption.decrypt(encrypted);
                expect(decrypted).to.equal(originalData);
            }
        });

        it("Should preserve complex object structure", async () => {
            const complexObject = {
                nested: {
                    deep: {
                        value: "test",
                        number: 123,
                        bool: true,
                    },
                },
                array: [1, 2, 3],
                mixed: [{ a: 1 }, { b: 2 }],
            };

            const encrypted = await encryption.encrypt(complexObject, "object");
            const decrypted = await decryption.decrypt(encrypted);

            expect(decrypted).to.deep.equal(complexObject);
        });
    });

    describe("Error Handling", () => {
        it("Should handle decryption of large data", async () => {
            const largeData = "x".repeat(10000);
            const encrypted = await encryption.encrypt(largeData, "string");
            const decrypted = await decryption.decrypt(encrypted);

            expect(decrypted).to.equal(largeData);
        });

        it("Should handle special characters in decryption", async () => {
            const specialData = "!@#$%^&*()_+-=[]{}|;':\",./<>?";
            const encrypted = await encryption.encrypt(specialData, "string");
            const decrypted = await decryption.decrypt(encrypted);

            expect(decrypted).to.equal(specialData);
        });

        it("Should handle unicode characters in decryption", async () => {
            const unicodeData = "你好世界🌍🔐";
            const encrypted = await encryption.encrypt(unicodeData, "string");
            const decrypted = await decryption.decrypt(encrypted);

            expect(decrypted).to.equal(unicodeData);
        });

        it("Should handle null and undefined", async () => {
            const nullData = null;
            const encrypted = await encryption.encrypt(nullData, "null");
            const decrypted = await decryption.decrypt(encrypted);

            expect(decrypted).to.equal(null);
        });
    });

    describe("Privacy Guarantees", () => {
        it("Should not leak plaintext in ciphertext", async () => {
            const sensitiveData = "secret password";
            const encrypted = await encryption.encrypt(sensitiveData, "string");

            // Convert ciphertext to string to check it doesn't contain plaintext
            const ciphertextStr = Buffer.from(encrypted.ciphertext).toString("utf8", 0, 100);
            expect(ciphertextStr).to.not.include(sensitiveData);
        });

        it("Should produce different ciphertexts for same plaintext with different keys", async () => {
            const data = "test";

            const encrypted1 = await encryption.encrypt(data, "string");

            const encryption2 = new ZamaEncryption();
            const { privateKey: pk2 } = await encryption2.generateKeyPair();
            const encrypted2 = await encryption2.encrypt(data, "string");

            expect(encrypted1.ciphertext).to.not.deep.equal(encrypted2.ciphertext);
        });

        it("Should only decrypt with correct private key", async () => {
            const data = "sensitive";
            const encrypted = await encryption.encrypt(data, "string");

            // Create different decryption with different key
            const encryption2 = new ZamaEncryption();
            const { privateKey: wrongKey } = await encryption2.generateKeyPair();
            const wrongDecryption = new ZamaDecryption(wrongKey);

            const decrypted = await wrongDecryption.decrypt(encrypted);
            // With wrong key, decryption will produce garbage
            expect(decrypted).to.not.equal(data);
        });
    });
});
