import { expect } from "chai";
import { ZamaEncryption, ZamaDecryption, FHEOperations } from "../../lib/zama";

describe("Zama FHE - Basic Tests", () => {
    let encryption: ZamaEncryption;
    let decryption: ZamaDecryption;
    let operations: FHEOperations;
    let privateKey: Uint8Array;

    before(async () => {
        encryption = new ZamaEncryption();
        operations = new FHEOperations();
        
        // Generate keys once for all tests
        const { privateKey: pk } = await encryption.generateKeyPair();
        privateKey = pk;
        decryption = new ZamaDecryption(privateKey);
    });

    describe("Encryption", () => {
        it("Should generate key pair", async () => {
            const { publicKey, privateKey } = await encryption.generateKeyPair();
            expect(publicKey).to.exist;
            expect(privateKey).to.exist;
            expect(publicKey.length).to.equal(256);
            expect(privateKey.length).to.equal(256);
        });

        it("Should encrypt generic data", async () => {
            const data = "test data";
            const encrypted = await encryption.encrypt(data, "string");
            expect(encrypted.ciphertext).to.exist;
            expect(encrypted.publicKey).to.exist;
            expect(encrypted.metadata.type).to.equal("string");
        });

        it("Should encrypt prescription", async () => {
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

        it("Should encrypt medicine", async () => {
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
    });

    describe("Decryption", () => {
        it("Should decrypt generic data", async () => {
            const testData = "test data";
            const encrypted = await encryption.encrypt(testData, "string");
            const decrypted = await decryption.decrypt(encrypted);
            expect(decrypted).to.equal(testData);
        });

        it("Should decrypt boolean", async () => {
            const testBool = true;
            const encrypted = await encryption.encrypt(testBool, "bool");
            const decrypted = await decryption.decrypt(encrypted);
            expect(decrypted).to.equal(testBool);
        });
    });

    describe("FHE Operations", () => {
        it("Should compare values privately (lessThan)", async () => {
            const a = 10;
            const b = 20;

            const encryptedA = await encryption.encrypt(a, "uint256");
            const encryptedB = await encryption.encrypt(b, "uint256");

            const result = await operations.lessThan(encryptedA, encryptedB);
            expect(result.ciphertext).to.exist;
        });

        it("Should perform AND operation privately", async () => {
            const a = true;
            const b = true;

            const encryptedA = await encryption.encrypt(a, "bool");
            const encryptedB = await encryption.encrypt(b, "bool");

            const result = await operations.and(encryptedA, encryptedB);
            expect(result.ciphertext).to.exist;
        });

        it("Should check expiration privately", async () => {
            const expirationDate = 1735689600; // 2025-01-01
            const currentTime = Math.floor(Date.now() / 1000);

            const encryptedExpDate = await encryption.encrypt(expirationDate, "uint256");
            const encryptedCurrTime = await encryption.encrypt(currentTime, "uint256");

            const result = await operations.isExpired(encryptedExpDate, encryptedCurrTime);
            expect(result.ciphertext).to.exist;
        });

        it("Should validate medicine privately", async () => {
            const isValid = true;
            const expirationDate = 1735689600;
            const currentTime = Math.floor(Date.now() / 1000);
            const isApproved = true;

            const encryptedIsValid = await encryption.encrypt(isValid, "bool");
            const encryptedExpDate = await encryption.encrypt(expirationDate, "uint256");
            const encryptedCurrTime = await encryption.encrypt(currentTime, "uint256");
            const encryptedIsApproved = await encryption.encrypt(isApproved, "bool");

            const result = await operations.isMedicineValid(
                encryptedIsValid,
                encryptedExpDate,
                encryptedCurrTime,
                encryptedIsApproved
            );
            expect(result.ciphertext).to.exist;
        });
    });

    describe("End-to-End Privacy", () => {
        it("Should maintain privacy throughout the flow", async () => {
            // 1. Encrypt prescription
            const prescription = {
                doctor: "0x1234567890123456789012345678901234567890",
                patient: "0x0987654321098765432109876543210987654321",
                medicineId: 42,
                isValid: true,
            };
            const encryptedPrescription = await encryption.encryptPrescription(prescription);

            // 2. Perform operations on encrypted data
            const isValidOp = await operations.isValid(encryptedPrescription.isValid);

            // 3. Decrypt result
            const decryptedResult = await decryption.decrypt(isValidOp);
            expect(decryptedResult).to.equal(true);

            // 4. Verify original data is still encrypted
            expect(encryptedPrescription.doctor.ciphertext).to.not.equal(
                Buffer.from(prescription.doctor)
            );
        });
    });
});
