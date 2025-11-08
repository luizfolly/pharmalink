import { expect } from "chai";
import { ethers } from "hardhat";
import { ZamaIntegration, PharmaLinkPrivacy } from "../../typechain-types";

describe("Zama Integration", () => {
    let zamaIntegration: ZamaIntegration;
    let privacyContract: PharmaLinkPrivacy;
    let owner: any;
    let doctor: any;
    let manufacturer: any;
    let patient: any;

    beforeEach(async () => {
        [owner, doctor, manufacturer, patient] = await ethers.getSigners();

        // Deploy PharmaLinkPrivacy
        const PrivacyFactory = await ethers.getContractFactory("PharmaLinkPrivacy");
        privacyContract = await PrivacyFactory.deploy();
        await privacyContract.waitForDeployment();

        // Deploy ZamaIntegration
        const ZamaFactory = await ethers.getContractFactory("ZamaIntegration");
        zamaIntegration = await ZamaFactory.deploy(
            ethers.ZeroAddress, // prescription contract (mock)
            ethers.ZeroAddress, // supply chain contract (mock)
            await privacyContract.getAddress()
        );
        await zamaIntegration.waitForDeployment();
    });

    describe("Deployment", () => {
        it("Should deploy successfully", async () => {
            expect(zamaIntegration.target).to.exist;
        });

        it("Should set correct contract addresses", async () => {
            const addresses = await zamaIntegration.getContractAddresses();
            expect(addresses.privacy).to.equal(await privacyContract.getAddress());
        });
    });

    describe("Prescription Encryption", () => {
        it("Should store encrypted prescription", async () => {
            const encryptedData = ethers.toBeHex("0x1234567890abcdef");

            const tx = await zamaIntegration
                .connect(doctor)
                .storePrescriptionEncrypted(1, encryptedData);
            await tx.wait();

            const retrieved = await zamaIntegration
                .connect(doctor)
                .getPrescriptionEncrypted(1);
            expect(retrieved).to.equal(encryptedData);
        });

        it("Should emit PrescriptionEncrypted event", async () => {
            const encryptedData = ethers.toBeHex("0x1234567890abcdef");

            const tx = await zamaIntegration
                .connect(doctor)
                .storePrescriptionEncrypted(1, encryptedData);
            const receipt = await tx.wait();

            expect(receipt?.logs.length).to.be.greaterThan(0);
        });

        it("Should authorize doctor to decrypt", async () => {
            const encryptedData = ethers.toBeHex("0x1234567890abcdef");

            await zamaIntegration.connect(doctor).storePrescriptionEncrypted(1, encryptedData);

            const isAuthorized = await zamaIntegration.isAuthorizedDecryptor(1, doctor.address);
            expect(isAuthorized).to.equal(true);
        });

        it("Should reject non-authorized user from decrypting", async () => {
            const encryptedData = ethers.toBeHex("0x1234567890abcdef");

            await zamaIntegration.connect(doctor).storePrescriptionEncrypted(1, encryptedData);

            await expect(
                zamaIntegration.connect(patient).getPrescriptionEncrypted(1)
            ).to.be.revertedWith("Not authorized to decrypt");
        });

        it("Should reject empty encrypted data", async () => {
            await expect(
                zamaIntegration.connect(doctor).storePrescriptionEncrypted(1, "0x")
            ).to.be.revertedWith("Empty encrypted data");
        });
    });

    describe("Medicine Encryption", () => {
        it("Should store encrypted medicine", async () => {
            const encryptedData = ethers.toBeHex("0xabcdef1234567890");

            const tx = await zamaIntegration
                .connect(manufacturer)
                .storeMedicineEncrypted(1, encryptedData);
            await tx.wait();

            const retrieved = await zamaIntegration
                .connect(manufacturer)
                .getMedicineEncrypted(1);
            expect(retrieved).to.equal(encryptedData);
        });

        it("Should authorize manufacturer to decrypt", async () => {
            const encryptedData = ethers.toBeHex("0xabcdef1234567890");

            await zamaIntegration
                .connect(manufacturer)
                .storeMedicineEncrypted(1, encryptedData);

            const isAuthorized = await zamaIntegration.isAuthorizedDecryptor(
                1,
                manufacturer.address
            );
            expect(isAuthorized).to.equal(true);
        });
    });

    describe("Validation Encryption", () => {
        it("Should store encrypted validation", async () => {
            const encryptedData = ethers.toBeHex("0xfedcba9876543210");
            const requestId = ethers.id("test-request");

            const tx = await zamaIntegration
                .connect(owner)
                .storeValidationEncrypted(1, requestId, encryptedData);
            await tx.wait();

            const retrieved = await zamaIntegration
                .connect(owner)
                .getValidationEncrypted(1);
            expect(retrieved).to.equal(encryptedData);
        });

        it("Should emit ValidationEncrypted event", async () => {
            const encryptedData = ethers.toBeHex("0xfedcba9876543210");
            const requestId = ethers.id("test-request");

            const tx = await zamaIntegration
                .connect(owner)
                .storeValidationEncrypted(1, requestId, encryptedData);
            const receipt = await tx.wait();

            expect(receipt?.logs.length).to.be.greaterThan(0);
        });
    });

    describe("Decryptor Management", () => {
        it("Should authorize decryptor", async () => {
            const encryptedData = ethers.toBeHex("0x1234567890abcdef");

            await zamaIntegration.connect(doctor).storePrescriptionEncrypted(1, encryptedData);

            // Authorize patient
            await zamaIntegration.authorizeDecryptor(1, patient.address);

            const isAuthorized = await zamaIntegration.isAuthorizedDecryptor(1, patient.address);
            expect(isAuthorized).to.equal(true);
        });

        it("Should revoke decryptor", async () => {
            const encryptedData = ethers.toBeHex("0x1234567890abcdef");

            await zamaIntegration.connect(doctor).storePrescriptionEncrypted(1, encryptedData);

            // Revoke doctor
            await zamaIntegration.revokeDecryptor(1, doctor.address);

            const isAuthorized = await zamaIntegration.isAuthorizedDecryptor(1, doctor.address);
            expect(isAuthorized).to.equal(false);
        });

        it("Should get list of authorized decryptors", async () => {
            const encryptedData = ethers.toBeHex("0x1234567890abcdef");

            await zamaIntegration.connect(doctor).storePrescriptionEncrypted(1, encryptedData);

            const decryptors = await zamaIntegration.getAuthorizedDecryptors(1);
            expect(decryptors.length).to.be.greaterThan(0);
            expect(decryptors).to.include(doctor.address);
        });

        it("Should not authorize same decryptor twice", async () => {
            const encryptedData = ethers.toBeHex("0x1234567890abcdef");

            await zamaIntegration.connect(doctor).storePrescriptionEncrypted(1, encryptedData);

            // Try to authorize again
            await zamaIntegration.authorizeDecryptor(1, doctor.address);

            const decryptors = await zamaIntegration.getAuthorizedDecryptors(1);
            // Should still be 1 (not duplicated)
            expect(decryptors.length).to.equal(1);
        });
    });

    describe("Public Key Management", () => {
        it("Should register public key", async () => {
            const publicKey = ethers.toBeHex("0x" + "a".repeat(512));

            const tx = await zamaIntegration.connect(doctor).registerPublicKey(publicKey);
            await tx.wait();

            const stored = await zamaIntegration.getPublicKey(doctor.address);
            expect(stored).to.equal(publicKey);
        });

        it("Should retrieve public key", async () => {
            const publicKey = ethers.toBeHex("0x" + "b".repeat(512));

            await zamaIntegration.connect(doctor).registerPublicKey(publicKey);

            const retrieved = await zamaIntegration.getPublicKey(doctor.address);
            expect(retrieved).to.equal(publicKey);
        });
    });

    describe("End-to-End Privacy Flow", () => {
        it("Should handle complete prescription privacy flow", async () => {
            // 1. Doctor stores encrypted prescription
            const encryptedPrescription = ethers.toBeHex("0x1111111111111111");
            await zamaIntegration
                .connect(doctor)
                .storePrescriptionEncrypted(1, encryptedPrescription);

            // 2. Doctor can retrieve it
            let retrieved = await zamaIntegration
                .connect(doctor)
                .getPrescriptionEncrypted(1);
            expect(retrieved).to.equal(encryptedPrescription);

            // 3. Patient cannot retrieve it initially
            await expect(
                zamaIntegration.connect(patient).getPrescriptionEncrypted(1)
            ).to.be.revertedWith("Not authorized to decrypt");

            // 4. Owner authorizes patient
            await zamaIntegration.authorizeDecryptor(1, patient.address);

            // 5. Patient can now retrieve it
            retrieved = await zamaIntegration
                .connect(patient)
                .getPrescriptionEncrypted(1);
            expect(retrieved).to.equal(encryptedPrescription);

            // 6. Owner revokes patient access
            await zamaIntegration.revokeDecryptor(1, patient.address);

            // 7. Patient cannot retrieve it anymore
            await expect(
                zamaIntegration.connect(patient).getPrescriptionEncrypted(1)
            ).to.be.revertedWith("Not authorized to decrypt");
        });

        it("Should handle multiple encrypted items", async () => {
            // Store multiple prescriptions
            const encData1 = ethers.toBeHex("0x1111111111111111");
            const encData2 = ethers.toBeHex("0x2222222222222222");
            const encData3 = ethers.toBeHex("0x3333333333333333");

            await zamaIntegration
                .connect(doctor)
                .storePrescriptionEncrypted(1, encData1);
            await zamaIntegration
                .connect(doctor)
                .storePrescriptionEncrypted(2, encData2);
            await zamaIntegration
                .connect(manufacturer)
                .storeMedicineEncrypted(1, encData3);

            // Verify each can be retrieved by authorized users
            expect(
                await zamaIntegration.connect(doctor).getPrescriptionEncrypted(1)
            ).to.equal(encData1);
            expect(
                await zamaIntegration.connect(doctor).getPrescriptionEncrypted(2)
            ).to.equal(encData2);
            expect(
                await zamaIntegration.connect(manufacturer).getMedicineEncrypted(1)
            ).to.equal(encData3);
        });
    });

    describe("Privacy Guarantees", () => {
        it("Should maintain data privacy", async () => {
            const sensitiveData = ethers.toBeHex("0xdeadbeefcafebabe");

            await zamaIntegration
                .connect(doctor)
                .storePrescriptionEncrypted(1, sensitiveData);

            // Only authorized users can access
            const isAuthorized = await zamaIntegration.isAuthorizedDecryptor(1, doctor.address);
            expect(isAuthorized).to.equal(true);

            // Unauthorized users cannot access
            const isNotAuthorized = await zamaIntegration.isAuthorizedDecryptor(
                1,
                patient.address
            );
            expect(isNotAuthorized).to.equal(false);
        });

        it("Should support granular access control", async () => {
            const encData = ethers.toBeHex("0x1234567890abcdef");

            await zamaIntegration.connect(doctor).storePrescriptionEncrypted(1, encData);

            // Initially only doctor has access
            expect(await zamaIntegration.isAuthorizedDecryptor(1, doctor.address)).to.equal(
                true
            );
            expect(await zamaIntegration.isAuthorizedDecryptor(1, patient.address)).to.equal(
                false
            );

            // Grant access to patient
            await zamaIntegration.authorizeDecryptor(1, patient.address);
            expect(await zamaIntegration.isAuthorizedDecryptor(1, patient.address)).to.equal(
                true
            );

            // Revoke access
            await zamaIntegration.revokeDecryptor(1, patient.address);
            expect(await zamaIntegration.isAuthorizedDecryptor(1, patient.address)).to.equal(
                false
            );
        });
    });
});
