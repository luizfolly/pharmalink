import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import {
  PharmaLinkDataValidator,
  PharmaLinkPrescriptionV2,
  PharmaLinkSupplyChainV2,
} from "../typechain-types";

describe("Chainlink Functions Integration", function () {
  let validator: PharmaLinkDataValidator;
  let prescriptionV2: PharmaLinkPrescriptionV2;
  let supplyChainV2: PharmaLinkSupplyChainV2;

  let owner: SignerWithAddress;
  let doctor: SignerWithAddress;
  let patient: SignerWithAddress;
  let manufacturer: SignerWithAddress;
  let distributor: SignerWithAddress;
  let pharmacy: SignerWithAddress;

  // Configuração mock para localhost
  const MOCK_ROUTER = "0x0000000000000000000000000000000000000001";
  const MOCK_SUBSCRIPTION_ID = 1;
  const MOCK_GAS_LIMIT = 300000;
  const MOCK_DON_ID = "0x0000000000000000000000000000000000000000000000000000000000000001";

  before(async function () {
    // Obter signers
    [owner, doctor, patient, manufacturer, distributor, pharmacy] = await ethers.getSigners();

    // Deploy de PharmaLinkPrescriptionV2
    const PrescriptionV2Factory = await ethers.getContractFactory("PharmaLinkPrescriptionV2");
    prescriptionV2 = await PrescriptionV2Factory.deploy();
    await prescriptionV2.waitForDeployment();

    // Deploy de PharmaLinkSupplyChainV2
    const SupplyChainV2Factory = await ethers.getContractFactory("PharmaLinkSupplyChainV2");
    supplyChainV2 = await SupplyChainV2Factory.deploy();
    await supplyChainV2.waitForDeployment();

    // Deploy de PharmaLinkDataValidator
    const ValidatorFactory = await ethers.getContractFactory("PharmaLinkDataValidator");
    validator = await ValidatorFactory.deploy(
      MOCK_ROUTER,
      MOCK_SUBSCRIPTION_ID,
      MOCK_GAS_LIMIT,
      MOCK_DON_ID,
      await prescriptionV2.getAddress(),
      await supplyChainV2.getAddress()
    );
    await validator.waitForDeployment();

    // Configurar validador nos contratos V2
    // Para testes, usar owner como validador
    await prescriptionV2.setValidatorContract(owner.address);
    await supplyChainV2.setValidatorContract(owner.address);
  });

  describe("PharmaLinkDataValidator", function () {
    it("Should deploy with correct configuration", async function () {
      const config = await validator.getFunctionConfig();
      expect(config.subscriptionId).to.equal(MOCK_SUBSCRIPTION_ID);
      expect(config.gasLimit).to.equal(MOCK_GAS_LIMIT);
    });

    it("Should update function configuration", async function () {
      const newSubscriptionId = 2;
      const newGasLimit = 400000;

      await validator.updateFunctionConfig(
        newSubscriptionId,
        newGasLimit,
        MOCK_DON_ID,
        ""
      );

      const config = await validator.getFunctionConfig();
      expect(config.subscriptionId).to.equal(newSubscriptionId);
      expect(config.gasLimit).to.equal(newGasLimit);
    });

    it("Should set contract addresses", async function () {
      await validator.setPrescriptionContract(await prescriptionV2.getAddress());
      await validator.setSupplyChainContract(await supplyChainV2.getAddress());

      // Verificar que os endereços foram atualizados
      // (não há getter público, mas os eventos devem ter sido emitidos)
    });
  });

  describe("PharmaLinkPrescriptionV2", function () {
    it("Should register doctor profile", async function () {
      const licenseNumber = "CRM123456";
      await prescriptionV2.registerDoctorProfile(doctor.address, licenseNumber);

      const profile = await prescriptionV2.getDoctorProfile(doctor.address);
      expect(profile.doctorAddress).to.equal(doctor.address);
      expect(profile.licenseNumber).to.equal(licenseNumber);
    });

    it("Should authorize doctor", async function () {
      const licenseNumber = "CRM789012";
      await prescriptionV2.registerDoctorProfile(doctor.address, licenseNumber);

      // Desabilitar validação de credenciais para teste
      await prescriptionV2.setValidationRequirements(false, false);

      await prescriptionV2.authorizeDoctor(doctor.address, true);
      expect(await prescriptionV2.isDoctorAuthorized(doctor.address)).to.be.true;
    });

    it("Should create prescription", async function () {
      const licenseNumber = "CRM345678";
      const tokenURI = "ipfs://QmExample";

      await prescriptionV2.registerDoctorProfile(doctor.address, licenseNumber);
      await prescriptionV2.setValidationRequirements(false, false);
      await prescriptionV2.authorizeDoctor(doctor.address, true);

      const tx = await prescriptionV2
        .connect(doctor)
        .createPrescription(patient.address, tokenURI);

      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      const prescription = await prescriptionV2.getPrescription(1);
      expect(prescription.doctor).to.equal(doctor.address);
      expect(prescription.patient).to.equal(patient.address);
      expect(prescription.metadataURI).to.equal(tokenURI);
    });

    it("Should burn prescription", async function () {
      const licenseNumber = "CRM901234";
      const tokenURI = "ipfs://QmExample2";

      await prescriptionV2.registerDoctorProfile(doctor.address, licenseNumber);
      await prescriptionV2.setValidationRequirements(false, false);
      await prescriptionV2.authorizeDoctor(doctor.address, true);

      await prescriptionV2.connect(doctor).createPrescription(patient.address, tokenURI);

      const prescriptionId = 2;
      await prescriptionV2.connect(patient).burnPrescription(prescriptionId);

      const prescription = await prescriptionV2.getPrescription(prescriptionId);
      expect(prescription.isValid).to.be.false;
    });

    it("Should handle prescription validation result", async function () {
      const licenseNumber = "CRM345678";
      const tokenURI = "ipfs://QmExample3";

      await prescriptionV2.registerDoctorProfile(doctor.address, licenseNumber);
      await prescriptionV2.setValidationRequirements(true, false);
      await prescriptionV2.authorizeDoctor(doctor.address, true);

      await prescriptionV2.connect(doctor).createPrescription(patient.address, tokenURI);

      const prescriptionId = 3;
      const mockRequestId = ethers.id("mock-request-1");

      // Simular callback de validação bem-sucedida (chamado pelo validador)
      await prescriptionV2.connect(owner).onPrescriptionValidationResult(mockRequestId, prescriptionId, true);

      const prescription = await prescriptionV2.getPrescription(prescriptionId);
      expect(prescription.validationStatus).to.equal(2); // Approved
    });

    it("Should handle doctor credentials validation result", async function () {
      const licenseNumber = "CRM234567";

      await prescriptionV2.registerDoctorProfile(doctor.address, licenseNumber);
      await prescriptionV2.setValidationRequirements(false, true);

      const mockRequestId = ethers.id("mock-request-2");

      // Simular callback de validação de credenciais (chamado pelo validador)
      await prescriptionV2.connect(owner).onDoctorCredentialsValidationResult(
        mockRequestId,
        doctor.address,
        true
      );

      const profile = await prescriptionV2.getDoctorProfile(doctor.address);
      expect(profile.credentialsStatus).to.equal(2); // Approved
    });
  });

  describe("PharmaLinkSupplyChainV2", function () {
    before(async function () {
      // Autorizar participantes
      await supplyChainV2.authorizePharmaceutical(manufacturer.address);
      await supplyChainV2.authorizeDistributor(distributor.address);
      await supplyChainV2.authorizePharmacy(pharmacy.address);
    });

    it("Should create medicine", async function () {
      const name = "Aspirin";
      const batchNumber = "BATCH001";
      const metadataURI = "ipfs://QmMedicine1";
      const producerName = "Pharma Corp";
      const expirationDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 ano

      await supplyChainV2.setValidationRequirements(false, false, false);

      const tx = await supplyChainV2
        .connect(manufacturer)
        .createMedicine(name, batchNumber, metadataURI, producerName, expirationDate);

      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      const medicine = await supplyChainV2.getMedicine(1);
      expect(medicine.name).to.equal(name);
      expect(medicine.batchNumber).to.equal(batchNumber);
    });

    it("Should create pharmacy order", async function () {
      const medicineId = 1;
      const quantity = 100;

      const tx = await supplyChainV2
        .connect(pharmacy)
        .createPharmacyOrder(medicineId, quantity, distributor.address);

      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      const order = await supplyChainV2.getOrder(1);
      expect(order.medicineId).to.equal(medicineId);
      expect(order.quantity).to.equal(quantity);
      expect(order.requester).to.equal(pharmacy.address);
    });

    it("Should transfer medicine to distributor", async function () {
      const medicineId = 1;

      const tx = await supplyChainV2
        .connect(manufacturer)
        .transferToDistributor(medicineId, distributor.address);

      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      const medicine = await supplyChainV2.getMedicine(medicineId);
      expect(medicine.distributor).to.equal(distributor.address);
      expect(medicine.status).to.equal(1); // InTransit
    });

    it("Should handle medicine validation result", async function () {
      const medicineId = 1;
      const mockRequestId = ethers.id("mock-request-3");

      await supplyChainV2.connect(owner).onMedicineValidationResult(mockRequestId, medicineId, true);

      const medicine = await supplyChainV2.getMedicine(medicineId);
      expect(medicine.validationStatus).to.equal(2); // Approved
    });

    it("Should handle order validation result", async function () {
      const orderId = 1;
      const mockRequestId = ethers.id("mock-request-4");

      await supplyChainV2.connect(owner).onOrderValidationResult(mockRequestId, orderId, true);

      const order = await supplyChainV2.getOrder(orderId);
      expect(order.validationStatus).to.equal(2); // Approved
    });

    it("Should add tracking event", async function () {
      const medicineId = 1;
      const location = "São Paulo, SP";
      const temperature = "25°C";
      const humidity = "60%";
      const remarks = "Transport in progress";

      const tx = await supplyChainV2
        .connect(distributor)
        .addTrackingEvent(medicineId, location, temperature, humidity, remarks, 1); // Status.InTransit

      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      const history = await supplyChainV2.getTrackingHistory(medicineId);
      expect(history.length).to.be.greaterThan(0);
      expect(history[0].location).to.equal(location);
    });
  });

  describe("Integration Scenarios", function () {
    it("Should complete full prescription flow with validation", async function () {
      // 1. Registrar médico
      const licenseNumber = "CRM999999";
      await prescriptionV2.registerDoctorProfile(doctor.address, licenseNumber);

      // 2. Validar credenciais
      const credentialsRequestId = ethers.id("full-flow-credentials");
      await prescriptionV2.connect(owner).onDoctorCredentialsValidationResult(
        credentialsRequestId,
        doctor.address,
        true
      );

      // 3. Autorizar médico
      await prescriptionV2.authorizeDoctor(doctor.address, true);

      // 4. Criar prescrição
      const tokenURI = "ipfs://QmFullFlow";
      const tx = await prescriptionV2
        .connect(doctor)
        .createPrescription(patient.address, tokenURI);

      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      // 5. Validar prescrição
      const prescriptionId = await prescriptionV2.getPrescriptionCounter();
      const prescriptionRequestId = ethers.id("full-flow-prescription");
      await prescriptionV2.connect(owner).onPrescriptionValidationResult(
        prescriptionRequestId,
        prescriptionId,
        true
      );

      // 6. Verificar estado final
      const prescription = await prescriptionV2.getPrescription(prescriptionId);
      expect(prescription.validationStatus).to.equal(2); // Approved
    });

    it("Should complete full supply chain flow with validation", async function () {
      // Setup
      await supplyChainV2.authorizePharmaceutical(manufacturer.address);
      await supplyChainV2.authorizeDistributor(distributor.address);
      await supplyChainV2.authorizePharmacy(pharmacy.address);
      await supplyChainV2.setValidationRequirements(true, true, false);

      // 1. Criar medicamento
      const name = "Ibuprofen";
      const batchNumber = "BATCH999";
      const metadataURI = "ipfs://QmSupplyFlow";
      const producerName = "Pharma Inc";
      const expirationDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

      await supplyChainV2
        .connect(manufacturer)
        .createMedicine(name, batchNumber, metadataURI, producerName, expirationDate);

      const medicineId = await supplyChainV2.medicineCounter();

      // 2. Validar medicamento
      const medicineRequestId = ethers.id("supply-flow-medicine");
      await supplyChainV2.connect(owner).onMedicineValidationResult(medicineRequestId, medicineId, true);

      // 3. Criar pedido
      const quantity = 500;
      await supplyChainV2
        .connect(pharmacy)
        .createPharmacyOrder(medicineId, quantity, distributor.address);

      const orderId = await supplyChainV2.orderCounter();

      // 4. Validar pedido
      const orderRequestId = ethers.id("supply-flow-order");
      await supplyChainV2.connect(owner).onOrderValidationResult(orderRequestId, orderId, true);

      // 5. Transferir para distribuidor
      await supplyChainV2.connect(manufacturer).transferToDistributor(medicineId, distributor.address);

      // 6. Adicionar rastreamento
      await supplyChainV2
        .connect(distributor)
        .addTrackingEvent(medicineId, "Rio de Janeiro, RJ", "22°C", "55%", "In transit", 1);

      // 7. Transferir para farmácia
      await supplyChainV2.connect(distributor).transferToPharmacy(medicineId, pharmacy.address);

      // 8. Marcar como vendido
      await supplyChainV2.connect(pharmacy).markAsSold(medicineId);

      // Verificar estado final
      const medicine = await supplyChainV2.getMedicine(medicineId);
      expect(medicine.status).to.equal(3); // Sold
      expect(medicine.validationStatus).to.equal(2); // Approved
    });
  });
});
