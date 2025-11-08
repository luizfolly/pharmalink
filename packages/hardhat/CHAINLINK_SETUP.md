# Guia de Setup - Chainlink Functions Integration

## 🚀 Quick Start

### 1. Compilar Contratos

```bash
cd packages/hardhat
yarn hardhat compile
```

### 2. Deploy em Localhost

```bash
# Terminal 1: Iniciar rede local
yarn chain

# Terminal 2: Fazer deploy
yarn deploy

# Terminal 3: Rodar testes
yarn hardhat:test
```

### 3. Deploy em Testnet

#### Sepolia

```bash
# Configurar variáveis de ambiente
export CHAINLINK_ROUTER_ADDRESS=0xb83E47C2bC239B7BF3119d3d12d3B3Be5C8c0df6
export CHAINLINK_SUBSCRIPTION_ID=123  # Seu ID de subscrição
export CHAINLINK_GAS_LIMIT=300000
export CHAINLINK_DON_ID=0x66756e2d657468657265756d2d7365706f6c69612d31000000000000000000

# Deploy
yarn hardhat deploy --network sepolia
```

#### Arbitrum Sepolia

```bash
export CHAINLINK_ROUTER_ADDRESS=0x234ee2c389aE4315CE9A27B5CCED3Ca122b394EF
export CHAINLINK_SUBSCRIPTION_ID=123
export CHAINLINK_GAS_LIMIT=300000
export CHAINLINK_DON_ID=0x6672756e2d617262697472756d2d7365706f6c69612d3100000000000000000000

yarn hardhat deploy --network arbitrumSepolia
```

#### Polygon Amoy

```bash
export CHAINLINK_ROUTER_ADDRESS=0xC22a79eBA640940ABB6dF0f6f59E3130426e539C
export CHAINLINK_SUBSCRIPTION_ID=123
export CHAINLINK_GAS_LIMIT=300000
export CHAINLINK_DON_ID=0x6672756e2d706f6c79676f6e2d616d6f792d31000000000000000000000000000000

yarn hardhat deploy --network polygonAmoy
```

## 📋 Pré-requisitos para Testnet

### 1. Criar Chainlink Functions Subscription

1. Ir para https://functions.chain.link/
2. Conectar wallet
3. Selecionar rede (Sepolia, Arbitrum Sepolia, ou Polygon Amoy)
4. Clicar em "Create subscription"
5. Copiar o Subscription ID
6. Financiar com LINK tokens

### 2. Adicionar Validator como Consumer

Após o deployment:

1. Copiar endereço do `PharmaLinkDataValidator`
2. Ir para https://functions.chain.link/
3. Selecionar sua subscrição
4. Clicar em "Add consumer"
5. Colar endereço do validator
6. Confirmar

### 3. Configurar Variáveis de Ambiente

Criar arquivo `.env` em `packages/hardhat/`:

```env
# Chainlink Functions Configuration
CHAINLINK_ROUTER_ADDRESS=0x...
CHAINLINK_SUBSCRIPTION_ID=123
CHAINLINK_GAS_LIMIT=300000
CHAINLINK_DON_ID=0x...

# Network RPC URLs (opcional, usa padrão se não configurado)
ALCHEMY_API_KEY=your_alchemy_key
```

## 📦 Estrutura de Contratos

```
contracts/
├── ChainlinkFunctionsConsumer.sol      # Base genérica
├── PharmaLinkDataValidator.sol         # Camada de validação
├── PharmaLinkPrescriptionV2.sol        # Prescrições com validação
├── PharmaLinkSupplyChainV2.sol         # Supply chain com validação
└── CHAINLINK_INTEGRATION.md            # Documentação detalhada

deploy/
├── 00_deploy_your_contract.ts          # Deploy original
├── 01_deploy_pharmalink_supplychain.ts # Deploy supply chain
└── 02_deploy_chainlink_validator.ts    # Deploy Chainlink Functions

test/
└── ChainlinkValidator.test.ts          # Testes de integração
```

## 🧪 Executar Testes

### Testes Locais

```bash
# Todos os testes
yarn hardhat:test

# Apenas testes de Chainlink
yarn hardhat test --grep "Chainlink"

# Com output detalhado
yarn hardhat test --grep "Chainlink" --reporter tap
```

### Testes em Testnet

```bash
# Compilar primeiro
yarn hardhat compile

# Deploy em Sepolia
yarn hardhat deploy --network sepolia

# Verificar contrato (opcional)
yarn hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## 🔧 Configuração Pós-Deploy

### 1. Autorizar Participantes (Prescription)

```javascript
const prescriptionV2 = await ethers.getContractAt(
  "PharmaLinkPrescriptionV2",
  prescriptionV2Address
);

// Registrar médico
await prescriptionV2.registerDoctorProfile(
  doctorAddress,
  "CRM123456"
);

// Autorizar médico (após validação)
await prescriptionV2.authorizeDoctor(doctorAddress, true);
```

### 2. Autorizar Participantes (Supply Chain)

```javascript
const supplyChainV2 = await ethers.getContractAt(
  "PharmaLinkSupplyChainV2",
  supplyChainV2Address
);

// Autorizar fabricante
await supplyChainV2.authorizePharmaceutical(manufacturerAddress);

// Autorizar distribuidor
await supplyChainV2.authorizeDistributor(distributorAddress);

// Autorizar farmácia
await supplyChainV2.authorizePharmacy(pharmacyAddress);
```

### 3. Ativar Validações

```javascript
// Prescrições
await prescriptionV2.setValidationRequirements(
  requirePrescriptionValidation = true,
  requireDoctorCredentialsValidation = true
);

// Supply Chain
await supplyChainV2.setValidationRequirements(
  requireMedicineValidation = true,
  requireOrderValidation = true,
  requireTemperatureValidation = true
);
```

### 4. Conectar Validador

```javascript
// Prescrições
await prescriptionV2.setValidatorContract(validatorAddress);

// Supply Chain
await supplyChainV2.setValidatorContract(validatorAddress);
```

## 📊 Monitoramento

### Verificar Status de Validação

```javascript
const validator = await ethers.getContractAt(
  "PharmaLinkDataValidator",
  validatorAddress
);

// Obter status de requisição
const status = await validator.getRequestStatus(requestId);
console.log("Status:", status); // 0=Pending, 1=Fulfilled, 2=Failed

// Obter resultado
const result = await validator.getValidationResult(
  contractAddress,
  targetId
);
console.log("Approved:", result.isApproved);
console.log("Reason:", result.reason);

// Obter todas as requisições do usuário
const requests = await validator.getUserRequests(userAddress);
console.log("Total requests:", requests.length);
```

### Monitorar Eventos

```javascript
// Escutar validações solicitadas
validator.on("ValidationRequested", (requestId, validationType, targetContract, targetId) => {
  console.log("Validation requested:", {
    requestId,
    validationType,
    targetContract,
    targetId
  });
});

// Escutar validações completadas
validator.on("ValidationCompleted", (requestId, validationType, isValid, validationData) => {
  console.log("Validation completed:", {
    requestId,
    validationType,
    isValid,
    validationData
  });
});

// Escutar atualizações de status
prescriptionV2.on("ValidationStatusUpdated", (targetId, targetType, newStatus) => {
  console.log("Status updated:", {
    targetId,
    targetType,
    newStatus // 0=NotValidated, 1=Pending, 2=Approved, 3=Rejected
  });
});
```

## 🐛 Troubleshooting

### Erro: "Router not found"

**Causa**: Endereço do router Chainlink incorreto

**Solução**:
1. Verificar rede selecionada
2. Confirmar endereço do router para a rede
3. Atualizar variável de ambiente

### Erro: "Subscription not funded"

**Causa**: Subscrição sem LINK tokens

**Solução**:
1. Ir para https://functions.chain.link/
2. Selecionar subscrição
3. Clicar em "Fund subscription"
4. Enviar LINK tokens

### Erro: "Unauthorized consumer"

**Causa**: Contrato não adicionado como consumer

**Solução**:
1. Copiar endereço do `PharmaLinkDataValidator`
2. Ir para https://functions.chain.link/
3. Adicionar como consumer
4. Aguardar confirmação

### Erro: "Insufficient gas"

**Causa**: Limite de gas muito baixo

**Solução**:
1. Aumentar `CHAINLINK_GAS_LIMIT` (ex: 500000)
2. Fazer deploy novamente
3. Atualizar configuração: `validator.updateFunctionConfig(...)`

### Erro: "Request timeout"

**Causa**: Função JavaScript levando muito tempo

**Solução**:
1. Otimizar código JavaScript
2. Reduzir número de chamadas HTTP
3. Aumentar timeout se possível

## 📚 Recursos Úteis

- [Chainlink Functions Docs](https://docs.chain.link/chainlink-functions)
- [Chainlink Functions Examples](https://github.com/smartcontractkit/smart-contract-examples)
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Arbitrum Sepolia Faucet](https://faucet.arbitrum.io/)
- [Polygon Amoy Faucet](https://faucet.polygon.technology/)

## 🤝 Suporte

Para dúvidas:
1. Consultar `CHAINLINK_INTEGRATION.md` para documentação detalhada
2. Verificar testes em `test/ChainlinkValidator.test.ts`
3. Abrir issue no repositório
4. Contatar suporte Chainlink

## ✅ Checklist de Deploy

- [ ] Compilar contratos: `yarn hardhat compile`
- [ ] Criar Chainlink Functions subscription
- [ ] Configurar variáveis de ambiente
- [ ] Fazer deploy: `yarn hardhat deploy --network <network>`
- [ ] Copiar endereço do validator
- [ ] Adicionar validator como consumer
- [ ] Autorizar participantes
- [ ] Ativar validações
- [ ] Conectar validador
- [ ] Testar fluxos
- [ ] Monitorar eventos
