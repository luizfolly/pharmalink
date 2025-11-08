import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploy Zama Privacy Contracts
 * Deploys PharmaLinkPrivacy and ZamaIntegration contracts
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, ethers } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    log("🔐 Deploying Zama Privacy Contracts...\n");

    // ================================================
    // 1. Deploy PharmaLinkPrivacy
    // ================================================
    log("1️⃣  Deploying PharmaLinkPrivacy...");

    const privacyDeployment = await deploy("PharmaLinkPrivacy", {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: 1,
    });

    log(`✅ PharmaLinkPrivacy deployed at: ${privacyDeployment.address}`);
    log(`   Gas used: ${privacyDeployment.receipt?.gasUsed || "N/A"}\n`);

    // ================================================
    // 2. Deploy ZamaIntegration
    // ================================================
    log("2️⃣  Deploying ZamaIntegration...");

    // Get existing contract addresses (or use zero address for mocks)
    const prescriptionAddress = process.env.PHARMALINK_PRESCRIPTION_ADDRESS || ethers.ZeroAddress;
    const supplyChainAddress = process.env.PHARMALINK_SUPPLY_CHAIN_ADDRESS || ethers.ZeroAddress;

    const zamaDeployment = await deploy("ZamaIntegration", {
        from: deployer,
        args: [prescriptionAddress, supplyChainAddress, privacyDeployment.address],
        log: true,
        waitConfirmations: 1,
    });

    log(`✅ ZamaIntegration deployed at: ${zamaDeployment.address}`);
    log(`   Gas used: ${zamaDeployment.receipt?.gasUsed || "N/A"}\n`);

    // ================================================
    // 3. Verify Deployments
    // ================================================
    log("3️⃣  Verifying deployments...\n");

    try {
        const privacyContract = await ethers.getContractAt("PharmaLinkPrivacy", privacyDeployment.address);
        const zamaContract = await ethers.getContractAt("ZamaIntegration", zamaDeployment.address);

        // Check PharmaLinkPrivacy
        const counters = await privacyContract.getCounters();
        log(`✅ PharmaLinkPrivacy verified`);
        log(`   Prescriptions: ${counters.prescriptions}`);
        log(`   Medicines: ${counters.medicines}`);
        log(`   Validations: ${counters.validations}\n`);

        // Check ZamaIntegration
        const addresses = await zamaContract.getContractAddresses();
        log(`✅ ZamaIntegration verified`);
        log(`   Privacy Contract: ${addresses.privacy}`);
        log(`   Prescription Contract: ${addresses.prescription}`);
        log(`   Supply Chain Contract: ${addresses.supplyChain}\n`);
    } catch (error) {
        log(`⚠️  Verification failed: ${error}`);
    }

    // ================================================
    // 4. Save Deployment Info
    // ================================================
    log("4️⃣  Saving deployment information...\n");

    const deploymentInfo = {
        network: hre.network.name,
        timestamp: new Date().toISOString(),
        deployer,
        contracts: {
            PharmaLinkPrivacy: {
                address: privacyDeployment.address,
                transactionHash: privacyDeployment.transactionHash,
                blockNumber: privacyDeployment.receipt?.blockNumber,
            },
            ZamaIntegration: {
                address: zamaDeployment.address,
                transactionHash: zamaDeployment.transactionHash,
                blockNumber: zamaDeployment.receipt?.blockNumber,
            },
        },
    };

    log("📝 Deployment Summary:");
    log(JSON.stringify(deploymentInfo, null, 2));
    log("\n");

    // ================================================
    // 5. Environment Setup
    // ================================================
    log("5️⃣  Environment setup instructions:\n");
    log("Add these to your .env.zama file:");
    log(`PRIVACY_CONTRACT_ADDRESS=${privacyDeployment.address}`);
    log(`ZAMA_INTEGRATION_ADDRESS=${zamaDeployment.address}`);
    log("\n");

    log("✅ Zama Privacy Contracts deployment completed!\n");
};

export default func;
func.tags = ["ZamaPrivacy"];
func.dependencies = [];
