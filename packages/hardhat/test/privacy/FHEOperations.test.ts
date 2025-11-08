import { expect } from "chai";
import { ZamaEncryption, ZamaDecryption, FHEOperations } from "../../lib/zama";

describe("FHE Operations", () => {
    let encryption: ZamaEncryption;
    let decryption: ZamaDecryption;
    let operations: FHEOperations;

    beforeEach(async () => {
        encryption = new ZamaEncryption();
        operations = new FHEOperations();
        const { privateKey } = await encryption.generateKeyPair();
        decryption = new ZamaDecryption(privateKey);
    });

    describe("Comparison Operations", () => {
        it("Should perform lessThan operation", async () => {
            const a = 10;
            const b = 20;

            const encryptedA = await encryption.encrypt(a, "uint256");
            const encryptedB = await encryption.encrypt(b, "uint256");

            const result = await operations.lessThan(encryptedA, encryptedB);
            const decrypted = await decryption.decrypt(result);

            expect(decrypted).to.equal(true);
        });

        it("Should perform lessThan with false result", async () => {
            const a = 30;
            const b = 20;

            const encryptedA = await encryption.encrypt(a, "uint256");
            const encryptedB = await encryption.encrypt(b, "uint256");

            const result = await operations.lessThan(encryptedA, encryptedB);
            const decrypted = await decryption.decrypt(result);

            expect(decrypted).to.equal(false);
        });

        it("Should perform equal operation", async () => {
            const a = 42;
            const b = 42;

            const encryptedA = await encryption.encrypt(a, "uint256");
            const encryptedB = await encryption.encrypt(b, "uint256");

            const result = await operations.equal(encryptedA, encryptedB);
            const decrypted = await decryption.decrypt(result);

            expect(decrypted).to.equal(true);
        });

        it("Should perform equal with false result", async () => {
            const a = 10;
            const b = 20;

            const encryptedA = await encryption.encrypt(a, "uint256");
            const encryptedB = await encryption.encrypt(b, "uint256");

            const result = await operations.equal(encryptedA, encryptedB);
            const decrypted = await decryption.decrypt(result);

            expect(decrypted).to.equal(false);
        });

        it("Should perform greaterThan operation", async () => {
            const a = 30;
            const b = 20;

            const encryptedA = await encryption.encrypt(a, "uint256");
            const encryptedB = await encryption.encrypt(b, "uint256");

            const result = await operations.greaterThan(encryptedA, encryptedB);
            const decrypted = await decryption.decrypt(result);

            expect(decrypted).to.equal(true);
        });
    });

    describe("Logical Operations", () => {
        it("Should perform AND operation (true AND true)", async () => {
            const a = true;
            const b = true;

            const encryptedA = await encryption.encrypt(a, "bool");
            const encryptedB = await encryption.encrypt(b, "bool");

            const result = await operations.and(encryptedA, encryptedB);
            const decrypted = await decryption.decrypt(result);

            expect(decrypted).to.equal(true);
        });

        it("Should perform AND operation (true AND false)", async () => {
            const a = true;
            const b = false;

            const encryptedA = await encryption.encrypt(a, "bool");
            const encryptedB = await encryption.encrypt(b, "bool");

            const result = await operations.and(encryptedA, encryptedB);
            const decrypted = await decryption.decrypt(result);

            expect(decrypted).to.equal(false);
        });

        it("Should perform OR operation (true OR false)", async () => {
            const a = true;
            const b = false;

            const encryptedA = await encryption.encrypt(a, "bool");
            const encryptedB = await encryption.encrypt(b, "bool");

            const result = await operations.or(encryptedA, encryptedB);
            const decrypted = await decryption.decrypt(result);

            expect(decrypted).to.equal(true);
        });

        it("Should perform OR operation (false OR false)", async () => {
            const a = false;
            const b = false;

            const encryptedA = await encryption.encrypt(a, "bool");
            const encryptedB = await encryption.encrypt(b, "bool");

            const result = await operations.or(encryptedA, encryptedB);
            const decrypted = await decryption.decrypt(result);

            expect(decrypted).to.equal(false);
        });

        it("Should perform NOT operation", async () => {
            const a = true;

            const encryptedA = await encryption.encrypt(a, "bool");

            const result = await operations.not(encryptedA);
            const decrypted = await decryption.decrypt(result);

            expect(decrypted).to.equal(false);
        });

        it("Should perform NOT operation on false", async () => {
            const a = false;

            const encryptedA = await encryption.encrypt(a, "bool");

            const result = await operations.not(encryptedA);
            const decrypted = await decryption.decrypt(result);

            expect(decrypted).to.equal(true);
        });
    });

    describe("Arithmetic Operations", () => {
        it("Should perform addition", async () => {
            const a = 10;
            const b = 20;

            const encryptedA = await encryption.encrypt(a, "uint256");
            const encryptedB = await encryption.encrypt(b, "uint256");

            const result = await operations.add(encryptedA, encryptedB);
            const decrypted = await decryption.decrypt(result);

            expect(decrypted).to.equal(30);
        });

        it("Should perform subtraction", async () => {
            const a = 30;
            const b = 10;

            const encryptedA = await encryption.encrypt(a, "uint256");
            const encryptedB = await encryption.encrypt(b, "uint256");

            const result = await operations.subtract(encryptedA, encryptedB);
            const decrypted = await decryption.decrypt(result);

            expect(decrypted).to.equal(20);
        });

        it("Should perform multiplication", async () => {
            const a = 5;
            const b = 6;

            const encryptedA = await encryption.encrypt(a, "uint256");
            const encryptedB = await encryption.encrypt(b, "uint256");

            const result = await operations.multiply(encryptedA, encryptedB);
            const decrypted = await decryption.decrypt(result);

            expect(decrypted).to.equal(30);
        });
    });

    describe("Domain-Specific Operations", () => {
        it("Should check expiration (expired)", async () => {
            const expirationDate = Math.floor(Date.now() / 1000) - 86400; // 1 day ago
            const currentTime = Math.floor(Date.now() / 1000);

            const encryptedExpDate = await encryption.encrypt(expirationDate, "uint256");
            const encryptedCurrTime = await encryption.encrypt(currentTime, "uint256");

            const result = await operations.isExpired(encryptedExpDate, encryptedCurrTime);
            const decrypted = await decryption.decrypt(result);

            expect(decrypted).to.equal(true);
        });

        it("Should check expiration (not expired)", async () => {
            const expirationDate = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
            const currentTime = Math.floor(Date.now() / 1000);

            const encryptedExpDate = await encryption.encrypt(expirationDate, "uint256");
            const encryptedCurrTime = await encryption.encrypt(currentTime, "uint256");

            const result = await operations.isExpired(encryptedExpDate, encryptedCurrTime);
            const decrypted = await decryption.decrypt(result);

            expect(decrypted).to.equal(false);
        });

        it("Should validate medicine (valid)", async () => {
            const isValid = true;
            const expirationDate = Math.floor(Date.now() / 1000) + 86400;
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
            const decrypted = await decryption.decrypt(result);

            expect(decrypted).to.equal(true);
        });

        it("Should validate medicine (expired)", async () => {
            const isValid = true;
            const expirationDate = Math.floor(Date.now() / 1000) - 86400; // expired
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
            const decrypted = await decryption.decrypt(result);

            expect(decrypted).to.equal(false);
        });

        it("Should validate prescription (valid)", async () => {
            const prescriptionValid = true;
            const doctorAuthorized = true;

            const encryptedPrescValid = await encryption.encrypt(prescriptionValid, "bool");
            const encryptedDoctorAuth = await encryption.encrypt(doctorAuthorized, "bool");

            const result = await operations.isPrescriptionValid(
                encryptedPrescValid,
                encryptedDoctorAuth
            );
            const decrypted = await decryption.decrypt(result);

            expect(decrypted).to.equal(true);
        });

        it("Should validate prescription (doctor not authorized)", async () => {
            const prescriptionValid = true;
            const doctorAuthorized = false;

            const encryptedPrescValid = await encryption.encrypt(prescriptionValid, "bool");
            const encryptedDoctorAuth = await encryption.encrypt(doctorAuthorized, "bool");

            const result = await operations.isPrescriptionValid(
                encryptedPrescValid,
                encryptedDoctorAuth
            );
            const decrypted = await decryption.decrypt(result);

            expect(decrypted).to.equal(false);
        });
    });

    describe("Complex Operations", () => {
        it("Should perform isValidAndNotExpired", async () => {
            const isValid = true;
            const expirationDate = Math.floor(Date.now() / 1000) + 86400;
            const currentTime = Math.floor(Date.now() / 1000);

            const encryptedIsValid = await encryption.encrypt(isValid, "bool");
            const encryptedExpDate = await encryption.encrypt(expirationDate, "uint256");
            const encryptedCurrTime = await encryption.encrypt(currentTime, "uint256");

            const result = await operations.isValidAndNotExpired(
                encryptedIsValid,
                encryptedExpDate,
                encryptedCurrTime
            );
            const decrypted = await decryption.decrypt(result);

            expect(decrypted).to.equal(true);
        });

        it("Should chain multiple operations", async () => {
            const a = true;
            const b = true;
            const c = false;

            const encryptedA = await encryption.encrypt(a, "bool");
            const encryptedB = await encryption.encrypt(b, "bool");
            const encryptedC = await encryption.encrypt(c, "bool");

            // (a AND b) OR c
            const andResult = await operations.and(encryptedA, encryptedB);
            const orResult = await operations.or(andResult, encryptedC);
            const decrypted = await decryption.decrypt(orResult);

            expect(decrypted).to.equal(true);
        });
    });

    describe("Privacy Guarantees", () => {
        it("Should not leak operands in operations", async () => {
            const a = 42;
            const b = 58;

            const encryptedA = await encryption.encrypt(a, "uint256");
            const encryptedB = await encryption.encrypt(b, "uint256");

            const result = await operations.add(encryptedA, encryptedB);

            // Result should be encrypted
            expect(result.ciphertext).to.exist;
            expect(result.ciphertext.length).to.be.greaterThan(0);
        });

        it("Should produce different results with different keys", async () => {
            const a = 10;
            const b = 20;

            const encryptedA1 = await encryption.encrypt(a, "uint256");
            const encryptedB1 = await encryption.encrypt(b, "uint256");

            const encryption2 = new ZamaEncryption();
            const { privateKey: pk2 } = await encryption2.generateKeyPair();
            const encryptedA2 = await encryption2.encrypt(a, "uint256");
            const encryptedB2 = await encryption2.encrypt(b, "uint256");

            const result1 = await operations.add(encryptedA1, encryptedB1);
            const result2 = await operations.add(encryptedA2, encryptedB2);

            expect(result1.ciphertext).to.not.deep.equal(result2.ciphertext);
        });
    });
});
