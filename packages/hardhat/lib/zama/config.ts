/**
 * Configuração Zama FHE
 */

export const zamaConfig = {
    network: process.env.NETWORK || "localhost",
    chainId: parseInt(process.env.CHAIN_ID || "31337"),
    rpcUrl: process.env.RPC_URL || "http://localhost:8545",
    contractAddress: process.env.PRIVACY_CONTRACT_ADDRESS || "",
    keySize: 2048,
    securityLevel: 128,
};

export const encryptionConfig = {
    algorithm: "TFHE",
    keySize: zamaConfig.keySize,
    securityLevel: zamaConfig.securityLevel,
};

export const zamaNetworks = {
    localhost: {
        chainId: 31337,
        rpcUrl: "http://localhost:8545",
    },
    sepolia: {
        chainId: 11155111,
        rpcUrl: process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/YOUR_KEY",
    },
    arbitrumSepolia: {
        chainId: 421614,
        rpcUrl: process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc",
    },
    polygonAmoy: {
        chainId: 80002,
        rpcUrl: process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
    },
};
