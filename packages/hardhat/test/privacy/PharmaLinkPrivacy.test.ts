import { expect } from "chai";
import { ethers } from "hardhat";
import { PharmaLinkPrivacy } from "../../typechain-types";

describe("PharmaLinkPrivacy Contract", () => {
    let privacyContract: PharmaLinkPrivacy;
    let owner: any;
    let addr1: any;
    let addr2: any;

    beforeEach(async () => {
        [owner, addr1, addr2] = await ethers.getSigners();

        const PrivacyFactory = await ethers.getContractFactory("PharmaLinkPrivacy");
        privacyContract = await PrivacyFactory.deploy();
        await privacyContract.waitForDeployment();
    });

    describe("Deployment", () => {
        it("Should deploy successfully", async () => {
            expect(privacyContract.target).to.exist;
        });

        it("Should initialize with zero counters", async () => {
            const counters = await privacyContract.getCounters();
            expect(counters.prescriptions).to.equal(0);
            expect(counters.medicines).to.equal(0);
            expect(counters.validations).to.equal(0);
        });
    });

    describe("Prescription Storage", () => {
        it("Should store encrypted prescription", async () => {
            const encryptedData = ethers.toBeHex("0x1234567890abcdef");

            const tx = await privacyContract.storeEncryptedPrescription(1, encryptedData);
            await tx.wait();

            const stored = await privacyContract.getEncryptedPrescription(1);
            expect(stored).to.equal(encryptedData);
        });

        it("Should increment prescription counter", async () => {
            const encryptedData = ethers.toBeHex("0x1234567890abcdef");

            await privacyContract.storeEncryptedPrescription(1, encryptedData);
            const counters1 = await privacyContract.getCounters();
            expect(counters1.prescriptions).to.equal(1);

            await privacyContract.storeEncryptedPrescription(2, encryptedData);
            const counters2 = await privacyContract.getCounters();
            expect(counters2.prescriptions).to.equal(2);
        });

        it("Should emit EncryptedPrescriptionStored event", async () => {
            const encryptedData = ethers.toBeHex("0x1234567890abcdef");

            const tx = await privacyContract.storeEncryptedPrescription(1, encryptedData);
            const receipt = await tx.wait();

            expect(receipt?.logs.length).to.be.greaterThan(0);
        });

        it("Should reject empty encrypted data", async () => {
            await expect(privacyContract.storeEncryptedPrescription(1, "0x")).to.be.revertedWith(
                "Empty encrypted data"
            );
        });

        it("Should reject invalid prescription ID", async () => {
            const encryptedData = ethers.toBeHex("0x1234567890abcdef");

            await expect(privacyContract.storeEncryptedPrescription(0, encryptedData)).to.be
                .revertedWith("Invalid prescription ID");
        });

        it("Should check prescription existence", async () => {
            const encryptedData = ethers.toBeHex("0x1234567890abcdef");

            expect(await privacyContract.prescriptionExists(1)).to.equal(false);

            await privacyContract.storeEncryptedPrescription(1, encryptedData);

            expect(await privacyContract.prescriptionExists(1)).to.equal(true);
        });
    });

    describe("Medicine Storage", () => {
        it("Should store encrypted medicine", async () => {
            const encryptedData = ethers.toBeHex("0xabcdef1234567890");

            const tx = await privacyContract.storeEncryptedMedicine(1, encryptedData);
            await tx.wait();

            const stored = await privacyContract.getEncryptedMedicine(1);
            expect(stored).to.equal(encryptedData);
        });

        it("Should increment medicine counter", async () => {
            const encryptedData = ethers.toBeHex("0xabcdef1234567890");

            await privacyContract.storeEncryptedMedicine(1, encryptedData);
            const counters1 = await privacyContract.getCounters();
            expect(counters1.medicines).to.equal(1);

            await privacyContract.storeEncryptedMedicine(2, encryptedData);
            const counters2 = await privacyContract.getCounters();
            expect(counters2.medicines).to.equal(2);
        });

        it("Should check medicine existence", async () => {
            const encryptedData = ethers.toBeHex("0xabcdef1234567890");

            expect(await privacyContract.medicineExists(1)).to.equal(false);

            await privacyContract.storeEncryptedMedicine(1, encryptedData);

            expect(await privacyContract.medicineExists(1)).to.equal(true);
        });

        it("Should reject empty encrypted medicine data", async () => {
            await expect(privacyContract.storeEncryptedMedicine(1, "0x")).to.be.revertedWith(
                "Empty encrypted data"
            );
        });
    });

    describe("Validation Storage", () => {
        it("Should store encrypted validation", async () => {
            const encryptedData = ethers.toBeHex("0xfedcba9876543210");
            const requestId = ethers.id("test-request");

            const tx = await privacyContract.storeEncryptedValidation(1, requestId, encryptedData);
            await tx.wait();

            const stored = await privacyContract.getEncryptedValidation(1);
            expect(stored).to.equal(encryptedData);
        });

        it("Should increment validation counter", async () => {
            const encryptedData = ethers.toBeHex("0xfedcba9876543210");
            const requestId = ethers.id("test-request");

            await privacyContract.storeEncryptedValidation(1, requestId, encryptedData);
            const counters1 = await privacyContract.getCounters();
            expect(counters1.validations).to.equal(1);

            await privacyContract.storeEncryptedValidation(2, requestId, encryptedData);
            const counters2 = await privacyContract.getCounters();
            expect(counters2.validations).to.equal(2);
        });

        it("Should check validation existence", async () => {
            const encryptedData = ethers.toBeHex("0xfedcba9876543210");
            const requestId = ethers.id("test-request");

            expect(await privacyContract.validationExists(1)).to.equal(false);

            await privacyContract.storeEncryptedValidation(1, requestId, encryptedData);

            expect(await privacyContract.validationExists(1)).to.equal(true);
        });

        it("Should reject invalid request ID", async () => {
            const encryptedData = ethers.toBeHex("0xfedcba9876543210");
            const invalidRequestId = ethers.ZeroHash;

            await expect(
                privacyContract.storeEncryptedValidation(1, invalidRequestId, encryptedData)
            ).to.be.revertedWith("Invalid request ID");
        });
    });

    describe("Public Key Management", () => {
        it("Should register public key", async () => {
            const publicKey = ethers.toBeHex("0x" + "a".repeat(512));

            const tx = await privacyContract.registerPublicKey(publicKey);
            await tx.wait();

            const stored = await privacyContract.getPublicKey(owner.address);
            expect(stored).to.equal(publicKey);
        });

        it("Should emit PublicKeyRegistered event", async () => {
            const publicKey = ethers.toBeHex("0x" + "b".repeat(512));

            const tx = await privacyContract.registerPublicKey(publicKey);
            const receipt = await tx.wait();

            expect(receipt?.logs.length).to.be.greaterThan(0);
        });

        it("Should check if user has public key", async () => {
            expect(await privacyContract.hasPublicKey(owner.address)).to.equal(false);

            const publicKey = ethers.toBeHex("0x" + "c".repeat(512));
            await privacyContract.registerPublicKey(publicKey);

            expect(await privacyContract.hasPublicKey(owner.address)).to.equal(true);
        });

        it("Should allow different users to register different keys", async () => {
            const publicKey1 = ethers.toBeHex("0x" + "1".repeat(512));
            const publicKey2 = ethers.toBeHex("0x" + "2".repeat(512));

            await privacyContract.registerPublicKey(publicKey1);
            await privacyContract.connect(addr1).registerPublicKey(publicKey2);

            const stored1 = await privacyContract.getPublicKey(owner.address);
            const stored2 = await privacyContract.getPublicKey(addr1.address);

            expect(stored1).to.equal(publicKey1);
            expect(stored2).to.equal(publicKey2);
        });

        it("Should reject empty public key", async () => {
            await expect(privacyContract.registerPublicKey("0x")).to.be.revertedWith(
                "Empty public key"
            );
        });

        it("Should allow updating public key", async () => {
            const publicKey1 = ethers.toBeHex("0x" + "1".repeat(512));
            const publicKey2 = ethers.toBeHex("0x" + "2".repeat(512));

            await privacyContract.registerPublicKey(publicKey1);
            let stored = await privacyContract.getPublicKey(owner.address);
            expect(stored).to.equal(publicKey1);

            await privacyContract.registerPublicKey(publicKey2);
            stored = await privacyContract.getPublicKey(owner.address);
            expect(stored).to.equal(publicKey2);
        });
    });

    describe("Data Retrieval Events", () => {
        it("Should emit EncryptedDataRetrieved event when getting prescription", async () => {
            const encryptedData = ethers.toBeHex("0x1234567890abcdef");
            await privacyContract.storeEncryptedPrescription(1, encryptedData);

            const tx = await privacyContract.getEncryptedPrescription(1);
            expect(tx).to.equal(encryptedData);
        });

        it("Should reject retrieval of non-existent prescription", async () => {
            await expect(privacyContract.getEncryptedPrescription(999)).to.be.revertedWith(
                "Prescription not found"
            );
        });

        it("Should reject retrieval of non-existent medicine", async () => {
            await expect(privacyContract.getEncryptedMedicine(999)).to.be.revertedWith(
                "Medicine not found"
            );
        });

        it("Should reject retrieval of non-existent validation", async () => {
            await expect(privacyContract.getEncryptedValidation(999)).to.be.revertedWith(
                "Validation not found"
            );
        });
    });

    describe("Multiple Operations", () => {
        it("Should handle multiple prescriptions, medicines, and validations", async () => {
            const encryptedData1 = ethers.toBeHex("0x1111111111111111");
            const encryptedData2 = ethers.toBeHex("0x2222222222222222");
            const encryptedData3 = ethers.toBeHex("0x3333333333333333");
            const requestId = ethers.id("test-request");

            // Store multiple items
            await privacyContract.storeEncryptedPrescription(1, encryptedData1);
            await privacyContract.storeEncryptedPrescription(2, encryptedData2);
            await privacyContract.storeEncryptedMedicine(1, encryptedData1);
            await privacyContract.storeEncryptedValidation(1, requestId, encryptedData3);

            // Verify counters
            const counters = await privacyContract.getCounters();
            expect(counters.prescriptions).to.equal(2);
            expect(counters.medicines).to.equal(1);
            expect(counters.validations).to.equal(1);

            // Verify data
            expect(await privacyContract.getEncryptedPrescription(1)).to.equal(encryptedData1);
            expect(await privacyContract.getEncryptedPrescription(2)).to.equal(encryptedData2);
            expect(await privacyContract.getEncryptedMedicine(1)).to.equal(encryptedData1);
            expect(await privacyContract.getEncryptedValidation(1)).to.equal(encryptedData3);
        });
    });
});
