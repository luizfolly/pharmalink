/**
 * Deploy Script - Zama FHE Integration em Sepolia
 * Faz deploy dos contratos em Sepolia testnet
 */

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function deploySepolia() {
    console.log("🚀 DEPLOY ZAMA FHE INTEGRATION - SEPOLIA TESTNET\n");

    const [deployer] = await ethers.getSigners();

    console.log("📋 Informações de Deployment:");
    console.log(`   Deployer: ${deployer.address}`);
    console.log(`   Network: ${(await ethers.provider.getNetwork()).name}`);
    console.log(`   Chain ID: ${(await ethers.provider.getNetwork()).chainId}\n`);

    try {
        // ================================================
        // 1. Deploy PharmaLinkPrivacy
        // ================================================
        console.log("1️⃣  Deployando PharmaLinkPrivacy...\n");

        const PrivacyFactory = await ethers.getContractFactory("PharmaLinkPrivacy");
        const privacyContract = await PrivacyFactory.deploy();
        await privacyContract.waitForDeployment();

        const privacyAddress = await privacyContract.getAddress();
        console.log(`✅ PharmaLinkPrivacy deployed: ${privacyAddress}`);
        console.log(`   TX Hash: ${privacyContract.deploymentTransaction()?.hash}\n`);

        // ================================================
        // 2. Deploy ZamaIntegration
        // ================================================
        console.log("2️⃣  Deployando ZamaIntegration...\n");

        const ZamaFactory = await ethers.getContractFactory("ZamaIntegration");
        const zamaIntegration = await ZamaFactory.deploy(
            ethers.ZeroAddress, // prescription contract (mock)
            ethers.ZeroAddress, // supply chain contract (mock)
            privacyAddress
        );
        await zamaIntegration.waitForDeployment();

        const zamaAddress = await zamaIntegration.getAddress();
        console.log(`✅ ZamaIntegration deployed: ${zamaAddress}`);
        console.log(`   TX Hash: ${zamaIntegration.deploymentTransaction()?.hash}\n`);

        // ================================================
        // 3. Verificar Deployment
        // ================================================
        console.log("3️⃣  Verificando deployment...\n");

        const counters = await privacyContract.getCounters();
        console.log("✅ PharmaLinkPrivacy verificado:");
        console.log(`   Prescrições: ${counters.prescriptions}`);
        console.log(`   Medicamentos: ${counters.medicines}`);
        console.log(`   Validações: ${counters.validations}\n`);

        const addresses = await zamaIntegration.getContractAddresses();
        console.log("✅ ZamaIntegration verificado:");
        console.log(`   Privacy Contract: ${addresses.privacy}`);
        console.log(`   Prescription Contract: ${addresses.prescription}`);
        console.log(`   Supply Chain Contract: ${addresses.supplyChain}\n`);

        // ================================================
        // 4. Salvar Informações de Deployment
        // ================================================
        console.log("4️⃣  Salvando informações de deployment...\n");

        const deploymentInfo = {
            network: "sepolia",
            timestamp: new Date().toISOString(),
            deployer: deployer.address,
            contracts: {
                PharmaLinkPrivacy: {
                    address: privacyAddress,
                    transactionHash: privacyContract.deploymentTransaction()?.hash,
                },
                ZamaIntegration: {
                    address: zamaAddress,
                    transactionHash: zamaIntegration.deploymentTransaction()?.hash,
                },
            },
            explorers: {
                PharmaLinkPrivacy: `https://sepolia.etherscan.io/address/${privacyAddress}`,
                ZamaIntegration: `https://sepolia.etherscan.io/address/${zamaAddress}`,
            },
        };

        // Salvar em arquivo
        const deploymentPath = path.join(__dirname, "../../deployments/sepolia-deployment.json");
        const deploymentDir = path.dirname(deploymentPath);

        if (!fs.existsSync(deploymentDir)) {
            fs.mkdirSync(deploymentDir, { recursive: true });
        }

        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
        console.log(`✅ Informações salvas em: ${deploymentPath}\n`);

        // ================================================
        // 5. Atualizar .env.zama
        // ================================================
        console.log("5️⃣  Atualizando .env.zama...\n");

        const envPath = path.join(__dirname, "../../.env.zama");
        let envContent = "";

        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, "utf-8");
        }

        // Atualizar ou adicionar variáveis
        const updateEnv = (content: string, key: string, value: string) => {
            const regex = new RegExp(`^${key}=.*$`, "m");
            if (regex.test(content)) {
                return content.replace(regex, `${key}=${value}`);
            }
            return content + (content ? "\n" : "") + `${key}=${value}`;
        };

        envContent = updateEnv(envContent, "SEPOLIA_PRIVACY_CONTRACT_ADDRESS", privacyAddress);
        envContent = updateEnv(envContent, "SEPOLIA_ZAMA_INTEGRATION_ADDRESS", zamaAddress);
        envContent = updateEnv(envContent, "NETWORK", "sepolia");

        fs.writeFileSync(envPath, envContent);
        console.log(`✅ .env.zama atualizado\n`);

        // ================================================
        // 6. Resumo Final
        // ================================================
        console.log("════════════════════════════════════════════════════════════");
        console.log("✅ DEPLOYMENT EM SEPOLIA CONCLUÍDO COM SUCESSO!");
        console.log("════════════════════════════════════════════════════════════\n");

        console.log("📊 Resumo:");
        console.log(`   Network: Sepolia Testnet`);
        console.log(`   Deployer: ${deployer.address}`);
        console.log(`   PharmaLinkPrivacy: ${privacyAddress}`);
        console.log(`   ZamaIntegration: ${zamaAddress}\n`);

        console.log("🔗 Links Etherscan:");
        console.log(`   PharmaLinkPrivacy: ${deploymentInfo.explorers.PharmaLinkPrivacy}`);
        console.log(`   ZamaIntegration: ${deploymentInfo.explorers.ZamaIntegration}\n`);

        console.log("💾 Arquivo de deployment: deployments/sepolia-deployment.json\n");

        console.log("🚀 Próximos passos:");
        console.log("   1. Validar deployment: yarn hardhat run scripts/zama/validate-deployment.ts --network sepolia");
        console.log("   2. Usar endereços em sua aplicação web");
        console.log("   3. Testar fluxo completo\n");

        return {
            privacyAddress,
            zamaAddress,
            deploymentInfo,
        };
    } catch (error) {
        console.error("❌ Erro durante deployment:");
        console.error(error);
        process.exit(1);
    }
}

// Executar deployment
deploySepolia().catch((error) => {
    console.error(error);
    process.exit(1);
});
