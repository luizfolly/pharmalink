# 🔐 Zama FHE Integration Guide - Pharmalink

Guia completo para integração de Fully Homomorphic Encryption (FHE) com Zama no projeto Pharmalink.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Setup Inicial](#setup-inicial)
4. [Deployment](#deployment)
5. [Uso](#uso)
6. [Exemplos](#exemplos)
7. [Testes](#testes)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

A integração Zama FHE fornece criptografia de dados sensíveis no Pharmalink, permitindo:

- **Prescrições Privadas:** Armazenar prescrições médicas criptografadas
- **Medicamentos Privados:** Rastrear medicamentos com dados criptografados
- **Validações Privadas:** Armazenar validações criptografadas
- **Controle de Acesso:** Gerenciar quem pode descriptografar dados
- **Auditoria:** Rastrear acessos aos dados

---

## 🏗️ Arquitetura

### Componentes Principais

```
┌─────────────────────────────────────────────────────────┐
│                   Pharmalink DApp                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │         ZamaIntegration Contract                 │  │
│  │  (Gerencia criptografia e acesso)               │  │
│  └──────────────────────────────────────────────────┘  │
│           ↓                              ↓              │
│  ┌──────────────────────┐    ┌──────────────────────┐  │
│  │ PharmaLinkPrivacy    │    │ Zama Lib (TypeScript)│  │
│  │ (Armazena dados)     │    │ (Criptografia)       │  │
│  └──────────────────────┘    └──────────────────────┘  │
│           ↓                              ↓              │
│  ┌──────────────────────────────────────────────────┐  │
│  │    Contratos Existentes (Prescription, Supply)   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Estrutura de Arquivos

```
packages/hardhat/
├── contracts/privacy/
│   ├── PharmaLinkPrivacy.sol      # Contrato de armazenamento
│   └── ZamaIntegration.sol        # Contrato de integração
├── lib/zama/
│   ├── types.ts                   # Tipos TypeScript
│   ├── config.ts                  # Configuração
│   ├── encryption.ts              # Criptografia
│   ├── decryption.ts              # Descriptografia
│   ├── operations.ts              # Operações FHE
│   └── index.ts                   # Exportações
├── scripts/zama/
│   ├── generate-keys.ts           # Gerador de chaves
│   ├── example-usage.ts           # Exemplo de uso
│   └── validate-deployment.ts     # Validação
├── deploy/
│   └── 03_deploy_zama_privacy.ts  # Script de deployment
└── test/privacy/
    ├── ZamaEncryption.test.ts
    ├── ZamaDecryption.test.ts
    ├── FHEOperations.test.ts
    ├── PharmaLinkPrivacy.test.ts
    └── ZamaIntegration.test.ts
```

---

## 🚀 Setup Inicial

### 1. Instalar Dependências

```bash
cd packages/hardhat
yarn install
```

### 2. Gerar Chaves

```bash
# Gerar novas chaves Zama
yarn hardhat run scripts/zama/generate-keys.ts

# Isso criará/atualizará .env.zama com chaves geradas
```

### 3. Configurar Variáveis de Ambiente

Copie `.env.zama.example` para `.env.zama`:

```bash
cp .env.zama.example .env.zama
```

Edite `.env.zama` com suas configurações:

```env
# Network Configuration
NETWORK=localhost
CHAIN_ID=31337
RPC_URL=http://localhost:8545

# Zama Keys (geradas automaticamente)
ZAMA_PUBLIC_KEY=<gerado>
ZAMA_PRIVATE_KEY=<gerado>

# Contract Addresses (preenchidas após deploy)
PRIVACY_CONTRACT_ADDRESS=
ZAMA_INTEGRATION_ADDRESS=
```

---

## 📦 Deployment

### Deploy em Localhost

```bash
# 1. Iniciar nó local
yarn hardhat node

# 2. Em outro terminal, fazer deploy
yarn hardhat deploy --tags ZamaPrivacy --network localhost

# 3. Validar deployment
yarn hardhat run scripts/zama/validate-deployment.ts --network localhost
```

### Deploy em Testnet (Sepolia)

```bash
# 1. Configurar RPC URL em .env.zama
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY

# 2. Fazer deploy
yarn hardhat deploy --tags ZamaPrivacy --network sepolia

# 3. Validar
yarn hardhat run scripts/zama/validate-deployment.ts --network sepolia
```

---

## 💻 Uso

### Importar Biblioteca Zama

```typescript
import { 
    ZamaEncryption, 
    ZamaDecryption, 
    FHEOperations 
} from "./lib/zama";
```

### Gerar Chaves

```typescript
const encryption = new ZamaEncryption();
const { publicKey, privateKey } = await encryption.generateKeyPair();

// Armazenar privateKey com segurança
// Compartilhar publicKey quando necessário
```

### Criptografar Dados

```typescript
// Dados genéricos
const encrypted = await encryption.encrypt("dados sensíveis", "string");

// Prescrição
const prescription = {
    doctor: "0x...",
    patient: "0x...",
    medicineId: 42,
    isValid: true
};
const encryptedPrescription = await encryption.encryptPrescription(prescription);

// Medicamento
const medicine = {
    name: "Aspirin 500mg",
    batchNumber: "BATCH-2024-001",
    expirationDate: 1735689600,
    manufacturer: "0x..."
};
const encryptedMedicine = await encryption.encryptMedicine(medicine);
```

### Descriptografar Dados

```typescript
const decryption = new ZamaDecryption(privateKey);

// Descriptografar dados genéricos
const decrypted = await decryption.decrypt(encrypted);

// Descriptografar prescrição
const decryptedPrescription = await decryption.decryptPrescription(encryptedPrescription);

// Descriptografar medicamento
const decryptedMedicine = await decryption.decryptMedicine(encryptedMedicine);
```

### Operações FHE

```typescript
const operations = new FHEOperations();

// Comparações
const lessThan = await operations.lessThan(encA, encB);
const equal = await operations.equal(encA, encB);
const greaterThan = await operations.greaterThan(encA, encB);

// Lógica
const and = await operations.and(encA, encB);
const or = await operations.or(encA, encB);
const not = await operations.not(encA);

// Aritmética
const sum = await operations.add(encA, encB);
const diff = await operations.subtract(encA, encB);
const product = await operations.multiply(encA, encB);

// Validações específicas
const isExpired = await operations.isExpired(encExpirationDate, encCurrentTime);
const isMedicineValid = await operations.isMedicineValid(
    encIsValid,
    encExpirationDate,
    encCurrentTime,
    encIsApproved
);
```

### Interagir com Smart Contracts

```typescript
// Registrar chave pública
await zamaIntegration.registerPublicKey(publicKeyBytes);

// Armazenar prescrição criptografada
await zamaIntegration.storePrescriptionEncrypted(prescriptionId, encryptedData);

// Recuperar prescrição criptografada
const retrieved = await zamaIntegration.getPrescriptionEncrypted(prescriptionId);

// Autorizar descriptor
await zamaIntegration.authorizeDecryptor(dataId, userAddress);

// Revogar acesso
await zamaIntegration.revokeDecryptor(dataId, userAddress);
```

---

## 📚 Exemplos

### Exemplo Completo: Prescrição Privada

```typescript
import { ZamaEncryption, ZamaDecryption } from "./lib/zama";
import { ethers } from "hardhat";

async function createPrivatePrescription() {
    // 1. Inicializar criptografia
    const encryption = new ZamaEncryption();
    const { publicKey, privateKey } = await encryption.generateKeyPair();
    const decryption = new ZamaDecryption(privateKey);

    // 2. Dados da prescrição
    const prescription = {
        doctor: "0x1234567890123456789012345678901234567890",
        patient: "0x0987654321098765432109876543210987654321",
        medicineId: 42,
        isValid: true
    };

    // 3. Criptografar
    const encrypted = await encryption.encryptPrescription(prescription);

    // 4. Armazenar no contrato
    const zamaIntegration = await ethers.getContractAt(
        "ZamaIntegration",
        process.env.ZAMA_INTEGRATION_ADDRESS
    );
    
    await zamaIntegration.storePrescriptionEncrypted(1, encrypted.doctor.ciphertext);

    // 5. Recuperar e descriptografar
    const retrieved = await zamaIntegration.getPrescriptionEncrypted(1);
    const decrypted = await decryption.decrypt(encrypted);

    console.log("Prescrição descriptografada:", decrypted);
}
```

### Exemplo: Validação Privada

```typescript
async function validateMedicinePrivately() {
    const encryption = new ZamaEncryption();
    const { privateKey } = await encryption.generateKeyPair();
    const decryption = new ZamaDecryption(privateKey);
    const operations = new FHEOperations();

    // Dados do medicamento
    const isValid = true;
    const expirationDate = Math.floor(Date.now() / 1000) + 86400; // 1 dia
    const currentTime = Math.floor(Date.now() / 1000);
    const isApproved = true;

    // Criptografar dados
    const encIsValid = await encryption.encrypt(isValid, "bool");
    const encExpDate = await encryption.encrypt(expirationDate, "uint256");
    const encCurrTime = await encryption.encrypt(currentTime, "uint256");
    const encIsApproved = await encryption.encrypt(isApproved, "bool");

    // Validar (operações em dados criptografados)
    const result = await operations.isMedicineValid(
        encIsValid,
        encExpDate,
        encCurrTime,
        encIsApproved
    );

    // Descriptografar resultado
    const isValidMedicine = await decryption.decrypt(result);
    console.log("Medicamento válido:", isValidMedicine);
}
```

---

## 🧪 Testes

### Rodar Todos os Testes

```bash
yarn hardhat:test test/privacy/
```

### Rodar Testes Específicos

```bash
# Testes de criptografia
yarn hardhat:test test/privacy/ZamaEncryption.test.ts

# Testes de descriptografia
yarn hardhat:test test/privacy/ZamaDecryption.test.ts

# Testes de operações FHE
yarn hardhat:test test/privacy/FHEOperations.test.ts

# Testes do contrato
yarn hardhat:test test/privacy/PharmaLinkPrivacy.test.ts

# Testes de integração
yarn hardhat:test test/privacy/ZamaIntegration.test.ts
```

### Cobertura de Testes

```bash
yarn hardhat:coverage test/privacy/
```

---

## 🔧 Troubleshooting

### Erro: "Cannot find module '@zama/tfhe'"

**Solução:** Este é um mock para desenvolvimento. Quando usar Zama real, instale:
```bash
npm install @zama/tfhe
```

### Erro: "Empty encrypted data"

**Solução:** Certifique-se de que está passando dados válidos:
```typescript
// ❌ Errado
await zamaIntegration.storePrescriptionEncrypted(1, "0x");

// ✅ Correto
const encryptedData = ethers.toBeHex("0x1234567890abcdef");
await zamaIntegration.storePrescriptionEncrypted(1, encryptedData);
```

### Erro: "Not authorized to decrypt"

**Solução:** Autorize o usuário primeiro:
```typescript
// Autorizar descriptor
await zamaIntegration.authorizeDecryptor(dataId, userAddress);

// Agora pode recuperar
const data = await zamaIntegration.getPrescriptionEncrypted(dataId);
```

### Erro: "Invalid prescription ID"

**Solução:** Use IDs válidos (> 0):
```typescript
// ❌ Errado
await zamaIntegration.storePrescriptionEncrypted(0, encryptedData);

// ✅ Correto
await zamaIntegration.storePrescriptionEncrypted(1, encryptedData);
```

---

## 📊 Estatísticas

- **Linhas de Código:** ~3.500
- **Contratos Solidity:** 2
- **Bibliotecas TypeScript:** 6
- **Testes:** 100+
- **Cobertura:** ~70%

---

## 🔐 Segurança

### Boas Práticas

1. **Chaves Privadas:** Nunca compartilhe chaves privadas
2. **Variáveis de Ambiente:** Mantenha `.env.zama` fora do git
3. **Acesso:** Use `authorizeDecryptor` para controlar acesso
4. **Auditoria:** Monitore eventos de acesso

### Checklist de Segurança

- [ ] Chaves privadas armazenadas com segurança
- [ ] `.env.zama` adicionado ao `.gitignore`
- [ ] Controle de acesso configurado
- [ ] Eventos de auditoria habilitados
- [ ] Testes de privacidade passando

---

## 📞 Suporte

Para problemas ou dúvidas:

1. Verifique o [Troubleshooting](#troubleshooting)
2. Rode os testes: `yarn hardhat:test test/privacy/`
3. Valide o deployment: `yarn hardhat run scripts/zama/validate-deployment.ts`
4. Consulte a documentação Zama: https://docs.zama.ai/

---

## 📄 Licença

MIT

---

**Última atualização:** Novembro 2025
**Versão:** 1.0.0
