/**
 * Script para gerar chaves Zama e criar arquivo .env
 */

import * as fs from "fs";
import * as path from "path";
import { ZamaEncryption } from "../../lib/zama";

async function generateKeysAndCreateEnv() {
    console.log("🔐 Gerando chaves Zama FHE...\n");

    try {
        // Gerar chaves
        const encryption = new ZamaEncryption();
        const { publicKey, privateKey } = await encryption.generateKeyPair();

        // Converter para hex
        const publicKeyHex = Buffer.from(publicKey).toString("hex");
        const privateKeyHex = Buffer.from(privateKey).toString("hex");

        console.log("✅ Chaves geradas com sucesso!\n");
        console.log(`📝 Chave Pública (primeiros 32 chars): ${publicKeyHex.substring(0, 32)}...`);
        console.log(`📝 Chave Privada (primeiros 32 chars): ${privateKeyHex.substring(0, 32)}...\n`);

        // Criar conteúdo do .env
        const envContent = `# Zama FHE Configuration

# Network Configuration
NETWORK=localhost
CHAIN_ID=31337
RPC_URL=http://localhost:8545

# Contract Addresses
PRIVACY_CONTRACT_ADDRESS=

# Zama Keys (Geradas automaticamente)
ZAMA_PUBLIC_KEY=${publicKeyHex}
ZAMA_PRIVATE_KEY=${privateKeyHex}

# Network RPC URLs (opcional)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
`;

        // Criar conteúdo do .env.example
        const envExampleContent = `# Zama FHE Configuration

# Network Configuration
NETWORK=localhost
CHAIN_ID=31337
RPC_URL=http://localhost:8545

# Contract Addresses
PRIVACY_CONTRACT_ADDRESS=

# Zama Keys (Gere com: yarn hardhat run scripts/zama/generate-keys.ts)
ZAMA_PUBLIC_KEY=<generated-public-key>
ZAMA_PRIVATE_KEY=<generated-private-key>

# Network RPC URLs (opcional)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
`;

        // Caminhos dos arquivos
        const envPath = path.join(__dirname, "../.env.zama");
        const envExamplePath = path.join(__dirname, "../.env.zama.example");

        // Escrever arquivos
        fs.writeFileSync(envPath, envContent);
        fs.writeFileSync(envExamplePath, envExampleContent);

        console.log("✅ Arquivos criados com sucesso!");
        console.log(`   📄 ${envPath}`);
        console.log(`   📄 ${envExamplePath}\n`);

        console.log("🎯 Próximos passos:");
        console.log("   1. Adicione PRIVACY_CONTRACT_ADDRESS após fazer deploy");
        console.log("   2. Configure RPC URLs para as redes desejadas");
        console.log("   3. Commit .env.zama.example (não commit .env.zama)\n");

        return { publicKeyHex, privateKeyHex };
    } catch (error) {
        console.error("❌ Erro ao gerar chaves:", error);
        process.exit(1);
    }
}

// Executar
generateKeysAndCreateEnv().catch(console.error);
