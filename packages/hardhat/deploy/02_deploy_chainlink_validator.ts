import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploy dos contratos de validação Chainlink Functions
 * 
 * IMPORTANTE: Antes de fazer deploy em rede real, configure:
 * 1. CHAINLINK_ROUTER_ADDRESS - Endereço do router Chainlink Functions
 * 2. CHAINLINK_SUBSCRIPTION_ID - ID da subscrição Chainlink
 * 3. CHAINLINK_GAS_LIMIT - Limite de gas (padrão: 300000)
 * 4. CHAINLINK_DON_ID - ID do DON (Decentralized Oracle Network)
 * 
 * Para Sepolia testnet:
 * - Router: 0xb83E47C2bC239B7BF3119d3d12d3B3Be5C8c0df6
 * - DON ID: 0x66756e2d657468657265756d2d7365706f6c69612d31000000000000000000
 */

const deployChainlinkValidator: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;
  const network = hre.network.name;

  console.log(`\n🔗 Deploying Chainlink Functions contracts on ${network}...`);

  // ================================================
  // CONFIGURAÇÃO POR REDE
  // ================================================

  let routerAddress: string;
  let subscriptionId: number;
  let gasLimit: number;
  let donId: string;

  if (network === "localhost" || network === "hardhat") {
    // Para testes locais, usar valores padrão
    routerAddress = "0x0000000000000000000000000000000000000001";
    subscriptionId = 1;
    gasLimit = 300000;
    donId = "0x0000000000000000000000000000000000000000000000000000000000000001";
    console.log("⚠️  Using mock configuration for localhost");
  } else if (network === "sepolia") {
    routerAddress = process.env.CHAINLINK_ROUTER_ADDRESS || "0xb83E47C2bC239B7BF3119d3d12d3B3Be5C8c0df6";
    subscriptionId = parseInt(process.env.CHAINLINK_SUBSCRIPTION_ID || "1");
    gasLimit = parseInt(process.env.CHAINLINK_GAS_LIMIT || "300000");
    donId = process.env.CHAINLINK_DON_ID || "0x66756e2d657468657265756d2d7365706f6c69612d31000000000000000000";
  } else if (network === "arbitrumSepolia") {
    routerAddress = process.env.CHAINLINK_ROUTER_ADDRESS || "0x234ee2c389aE4315CE9A27B5CCED3Ca122b394EF";
    subscriptionId = parseInt(process.env.CHAINLINK_SUBSCRIPTION_ID || "1");
    gasLimit = parseInt(process.env.CHAINLINK_GAS_LIMIT || "300000");
    donId = process.env.CHAINLINK_DON_ID || "0x6672756e2d617262697472756d2d7365706f6c69612d3100000000000000000000";
  } else if (network === "polygonAmoy") {
    routerAddress = process.env.CHAINLINK_ROUTER_ADDRESS || "0xC22a79eBA640940ABB6dF0f6f59E3130426e539C";
    subscriptionId = parseInt(process.env.CHAINLINK_SUBSCRIPTION_ID || "1");
    gasLimit = parseInt(process.env.CHAINLINK_GAS_LIMIT || "300000");
    donId = process.env.CHAINLINK_DON_ID || "0x6672756e2d706f6c79676f6e2d616d6f792d31000000000000000000000000000000";
  } else {
    throw new Error(`Network ${network} not supported. Please add configuration.`);
  }

  console.log(`📋 Configuration:`);
  console.log(`   Router: ${routerAddress}`);
  console.log(`   Subscription ID: ${subscriptionId}`);
  console.log(`   Gas Limit: ${gasLimit}`);
  console.log(`   DON ID: ${donId}`);

  // ================================================
  // NOTA: ChainlinkFunctionsConsumer é um contrato abstrato
  // e não é deployado diretamente. É usado como base para
  // PharmaLinkDataValidator
  // ================================================

  // ================================================
  // DEPLOY DO CONTRATO DE VALIDAÇÃO PHARMALINK
  // ================================================

  // Obter endereços dos contratos de prescrição e supply chain
  let prescriptionAddress: string;
  let supplyChainAddress: string;

  try {
    const prescriptionDeployment = await get("PharmaLinkPrescription");
    prescriptionAddress = prescriptionDeployment.address;
  } catch {
    console.warn("⚠️  PharmaLinkPrescription not found, using zero address");
    prescriptionAddress = "0x0000000000000000000000000000000000000000";
  }

  try {
    const supplyChainDeployment = await get("PharmaLinkSupplyChain");
    supplyChainAddress = supplyChainDeployment.address;
  } catch {
    console.warn("⚠️  PharmaLinkSupplyChain not found, using zero address");
    supplyChainAddress = "0x0000000000000000000000000000000000000000";
  }

  console.log("\n📦 Deploying PharmaLinkDataValidator...");
  const validator = await deploy("PharmaLinkDataValidator", {
    from: deployer,
    args: [
      routerAddress,
      subscriptionId,
      gasLimit,
      donId,
      prescriptionAddress,
      supplyChainAddress,
    ],
    log: true,
    autoMine: true,
  });

  console.log(`✅ PharmaLinkDataValidator deployed at: ${validator.address}`);

  // ================================================
  // DEPLOY DAS VERSÕES V2 COM INTEGRAÇÃO
  // ================================================

  console.log("\n📦 Deploying PharmaLinkPrescriptionV2...");
  const prescriptionV2 = await deploy("PharmaLinkPrescriptionV2", {
    from: deployer,
    log: true,
    autoMine: true,
  });

  console.log(`✅ PharmaLinkPrescriptionV2 deployed at: ${prescriptionV2.address}`);

  console.log("\n📦 Deploying PharmaLinkSupplyChainV2...");
  const supplyChainV2 = await deploy("PharmaLinkSupplyChainV2", {
    from: deployer,
    log: true,
    autoMine: true,
  });

  console.log(`✅ PharmaLinkSupplyChainV2 deployed at: ${supplyChainV2.address}`);

  // ================================================
  // CONFIGURAÇÃO PÓS-DEPLOY
  // ================================================

  console.log("\n⚙️  Configuring contracts...");

  // Conectar validador aos contratos V2
  if (prescriptionV2.newlyDeployed) {
    const prescriptionV2Contract = await hre.ethers.getContractAt(
      "PharmaLinkPrescriptionV2",
      prescriptionV2.address
    );
    await prescriptionV2Contract.setValidatorContract(validator.address);
    console.log("✅ PharmaLinkPrescriptionV2 configured with validator");
  }

  if (supplyChainV2.newlyDeployed) {
    const supplyChainV2Contract = await hre.ethers.getContractAt(
      "PharmaLinkSupplyChainV2",
      supplyChainV2.address
    );
    await supplyChainV2Contract.setValidatorContract(validator.address);
    console.log("✅ PharmaLinkSupplyChainV2 configured with validator");
  }

  // ================================================
  // RESUMO
  // ================================================

  console.log("\n📊 Deployment Summary:");
  console.log("═".repeat(60));
  console.log(`PharmaLinkDataValidator:    ${validator.address}`);
  console.log(`PharmaLinkPrescriptionV2:   ${prescriptionV2.address}`);
  console.log(`PharmaLinkSupplyChainV2:    ${supplyChainV2.address}`);
  console.log("═".repeat(60));

  console.log("\n📝 Next steps:");
  console.log("1. Configure Chainlink Functions subscription with validator contract");
  console.log("2. Add validator contract as authorized consumer in Chainlink");
  console.log("3. Set validation requirements on V2 contracts");
  console.log("4. Test validation flows");
};

export default deployChainlinkValidator;
deployChainlinkValidator.tags = ["ChainlinkValidator"];
deployChainlinkValidator.dependencies = ["PharmaLinkPrescription", "PharmaLinkSupplyChain"];
