# Integração Chainlink Functions - Pharmalink

## 📋 Visão Geral

Este documento descreve a integração de Chainlink Functions no projeto Pharmalink para validação de dados externos (prescrições, medicamentos, credenciais de médicos, etc).

## 🏗️ Arquitetura

### Camadas

```
┌─────────────────────────────────────────┐
│   Frontend (Next.js)                    │
│   - UI para requisições de validação    │
│   - Monitoramento de status             │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   Smart Contracts (Solidity)            │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ PharmaLinkPrescriptionV2        │   │
│  │ - Prescrições com validação     │   │
│  │ - Credenciais de médicos        │   │
│  └──────────────┬──────────────────┘   │
│                 │                       │
│  ┌──────────────▼──────────────────┐   │
│  │ PharmaLinkDataValidator         │   │
│  │ - Camada genérica de validação  │   │
│  │ - Múltiplos tipos de validação  │   │
│  └──────────────┬──────────────────┘   │
│                 │                       │
│  ┌──────────────▼──────────────────┐   │
│  │ ChainlinkFunctionsConsumer      │   │
│  │ - Base reutilizável             │   │
│  │ - Gerenciamento de requisições  │   │
│  └──────────────┬──────────────────┘   │
│                 │                       │
│  ┌──────────────▼──────────────────┐   │
│  │ PharmaLinkSupplyChainV2         │   │
│  │ - Supply chain com validação    │   │
│  │ - Medicamentos e pedidos        │   │
│  └─────────────────────────────────┘   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   Chainlink Functions                   │
│   - Executa código JavaScript           │
│   - Consome APIs externas               │
│   - Retorna resultados on-chain         │
└─────────────────────────────────────────┘
```

## 📦 Contratos

### 1. ChainlinkFunctionsConsumer.sol

**Propósito**: Base genérica e reutilizável para consumir Chainlink Functions

**Responsabilidades**:
- Gerenciar requisições para Chainlink Functions
- Armazenar histórico de requisições
- Processar callbacks de fulfillment
- Fornecer interface para consultas

**Funções Principais**:
```solidity
// Enviar requisição
_sendRequest(string[] memory args) → bytes32 requestId

// Callbacks (implementados pelos filhos)
_handleRequestFulfilled(bytes32 requestId, bytes memory response)
_handleRequestFailed(bytes32 requestId, string memory errorMessage)

// Consultas
getRequestStatus(bytes32 requestId) → RequestStatus
getRequestResponse(bytes32 requestId) → bytes
getUserRequests(address user) → bytes32[]
```

### 2. PharmaLinkDataValidator.sol

**Propósito**: Camada específica para Pharmalink com múltiplos tipos de validação

**Tipos de Validação**:
- `PrescriptionValidation` - Valida prescrições médicas
- `MedicineAuthenticity` - Verifica autenticidade de medicamentos
- `DoctorCredentials` - Valida credenciais de médicos
- `BatchExpiration` - Verifica expiração de lotes
- `TemperatureCompliance` - Valida conformidade de temperatura

**Funções Principais**:
```solidity
// Validações
validatePrescription(uint256 prescriptionId, address doctor, address patient)
validateMedicineAuthenticity(uint256 medicineId, string batchNumber, address manufacturer)
validateDoctorCredentials(address doctor, string licenseNumber)
validateBatchExpiration(uint256 medicineId, string batchNumber, uint256 expirationDate)
validateTemperatureCompliance(uint256 medicineId, int256 minTemp, int256 maxTemp)

// Consultas
getValidationResult(address targetContract, uint256 targetId)
getValidationRequest(bytes32 requestId)
```

### 3. PharmaLinkPrescriptionV2.sol

**Propósito**: Prescrições com integração de validação

**Novos Recursos**:
- Status de validação para cada prescrição
- Perfis de médicos com credenciais
- Validação obrigatória de credenciais (configurável)
- Callbacks para receber resultados de validação

**Funções Principais**:
```solidity
// Gerenciamento de médicos
registerDoctorProfile(address doctor, string licenseNumber)
authorizeDoctor(address doctor, bool status)

// Prescrições
createPrescription(address patient, string tokenURI)
burnPrescription(uint256 prescriptionId)

// Callbacks (chamados pelo validador)
onPrescriptionValidationResult(bytes32 requestId, uint256 prescriptionId, bool isValid)
onDoctorCredentialsValidationResult(bytes32 requestId, address doctor, bool isValid)
```

### 4. PharmaLinkSupplyChainV2.sol

**Propósito**: Supply chain com integração de validação

**Novos Recursos**:
- Status de validação para medicamentos e pedidos
- Validações obrigatórias (configurável)
- Callbacks para receber resultados de validação
- Requisitos de validação antes de ações críticas

**Funções Principais**:
```solidity
// Configuração
setValidatorContract(address validatorAddress)
setValidationRequirements(bool requireMedicine, bool requireOrder, bool requireTemperature)

// Callbacks (chamados pelo validador)
onMedicineValidationResult(bytes32 requestId, uint256 medicineId, bool isValid)
onOrderValidationResult(bytes32 requestId, uint256 orderId, bool isValid)
```

## 🚀 Deployment

### Pré-requisitos

1. **Chainlink Functions Subscription**
   - Criar subscrição em https://functions.chain.link/
   - Obter Subscription ID
   - Financiar com LINK tokens

2. **Variáveis de Ambiente** (`.env`)
   ```
   CHAINLINK_ROUTER_ADDRESS=0x...
   CHAINLINK_SUBSCRIPTION_ID=123
   CHAINLINK_GAS_LIMIT=300000
   CHAINLINK_DON_ID=0x...
   ```

3. **Redes Suportadas**
   - Sepolia (testnet)
   - Arbitrum Sepolia (testnet)
   - Polygon Amoy (testnet)
   - Localhost (desenvolvimento)

### Executar Deployment

```bash
# Localhost
yarn deploy

# Sepolia
yarn hardhat deploy --network sepolia

# Arbitrum Sepolia
yarn hardhat deploy --network arbitrumSepolia

# Polygon Amoy
yarn hardhat deploy --network polygonAmoy
```

### Pós-Deployment

1. **Adicionar Validator como Consumer**
   ```bash
   # No Chainlink Functions dashboard
   # Adicionar endereço do PharmaLinkDataValidator como authorized consumer
   ```

2. **Configurar Validações**
   ```solidity
   // Exemplo: Ativar validação obrigatória
   prescriptionV2.setValidationRequirements(true, true);
   supplyChainV2.setValidationRequirements(true, true, true);
   ```

3. **Registrar Médicos**
   ```solidity
   prescriptionV2.registerDoctorProfile(doctorAddress, "CRM123456");
   ```

## 📝 Fluxos de Uso

### Fluxo 1: Validação de Prescrição

```
1. Médico cria prescrição
   → createPrescription(patient, tokenURI)
   
2. Sistema solicita validação (se configurado)
   → validator.validatePrescription(prescriptionId, doctor, patient)
   
3. Chainlink Functions executa validação externa
   → Consulta API de registros médicos
   
4. Resultado retorna ao contrato
   → onPrescriptionValidationResult(requestId, prescriptionId, isValid)
   
5. Prescrição marcada como aprovada/rejeitada
   → prescriptions[id].validationStatus = Approved/Rejected
```

### Fluxo 2: Validação de Medicamento

```
1. Fabricante cria medicamento
   → createMedicine(name, batch, metadata, producer, expiration)
   
2. Sistema solicita validação
   → validator.validateMedicineAuthenticity(medicineId, batch, manufacturer)
   
3. Chainlink Functions executa validação
   → Consulta API de fabricante/ANVISA
   
4. Resultado retorna
   → onMedicineValidationResult(requestId, medicineId, isValid)
   
5. Medicamento pode ser transferido apenas se aprovado
   → transferToDistributor() requer validationStatus == Approved
```

### Fluxo 3: Validação de Credenciais de Médico

```
1. Admin registra médico
   → registerDoctorProfile(doctor, licenseNumber)
   
2. Sistema solicita validação (se configurado)
   → validator.validateDoctorCredentials(doctor, licenseNumber)
   
3. Chainlink Functions valida contra registros profissionais
   → Consulta base de dados de CRM/ANVISA
   
4. Resultado retorna
   → onDoctorCredentialsValidationResult(requestId, doctor, isValid)
   
5. Médico autorizado apenas se credenciais aprovadas
   → authorizeDoctor(doctor, true) requer credentialsStatus == Approved
```

## 🔧 Customização

### Adicionar Novo Tipo de Validação

1. **Adicionar enum em PharmaLinkDataValidator.sol**
   ```solidity
   enum ValidationType {
       // ... tipos existentes
       NovoTipo
   }
   ```

2. **Implementar função de validação**
   ```solidity
   function validateNovoTipo(
       uint256 id,
       string memory param1,
       address param2
   ) external returns (bytes32) {
       string[] memory args = new string[](2);
       args[0] = param1;
       args[1] = _addressToString(param2);
       
       bytes32 requestId = _sendRequest(args);
       
       validationRequests[requestId] = ValidationRequest({
           validationType: ValidationType.NovoTipo,
           // ... outros campos
       });
       
       return requestId;
   }
   ```

3. **Implementar callback em contrato específico**
   ```solidity
   function onNovoTipoValidationResult(
       bytes32 requestId,
       uint256 id,
       bool isValid
   ) external onlyValidatorContract {
       // Processar resultado
   }
   ```

### Customizar Função JavaScript

A função JavaScript executada pelo Chainlink Functions pode ser customizada:

```javascript
// Exemplo: Validar prescrição contra API
const doctorAddress = args[0];
const patientAddress = args[1];
const prescriptionId = args[2];

const response = await Functions.makeHttpRequest({
  url: `https://api.medical-registry.com/validate`,
  method: "POST",
  data: {
    doctor: doctorAddress,
    patient: patientAddress,
    prescriptionId: prescriptionId
  }
});

const isValid = response.data.valid === true;
return Functions.encodeUint256(isValid ? 1 : 0);
```

## 🧪 Testes

### Testar Localmente

```bash
# Iniciar rede local
yarn chain

# Em outro terminal, fazer deploy
yarn deploy

# Em outro terminal, rodar testes
yarn hardhat:test

# Testar validação específica
yarn hardhat test --grep "ChainlinkValidator"
```

### Testar em Testnet

```bash
# Sepolia
yarn hardhat deploy --network sepolia

# Verificar deployment
yarn hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## 📊 Monitoramento

### Consultar Status de Validação

```solidity
// Obter status de uma requisição
RequestStatus status = validator.getRequestStatus(requestId);

// Obter resultado de validação
ValidationResult result = validator.getValidationResult(contractAddress, targetId);

// Obter todas as requisições de um usuário
bytes32[] requestIds = validator.getUserRequests(userAddress);
```

### Eventos para Monitorar

```solidity
// Validação solicitada
event ValidationRequested(bytes32 indexed requestId, ValidationType validationType, ...)

// Validação completada
event ValidationCompleted(bytes32 indexed requestId, ValidationType validationType, bool isValid, ...)

// Status atualizado
event ValidationStatusUpdated(uint256 indexed targetId, string targetType, ValidationStatus newStatus)
```

## 🔐 Segurança

### Considerações

1. **Autorização**: Apenas o contrato validador pode chamar callbacks
2. **Validação de Entrada**: Todos os parâmetros são validados
3. **Limite de Gas**: Configurável por tipo de validação
4. **Timeout**: Requisições podem expirar se não forem processadas

### Boas Práticas

1. Sempre validar dados críticos antes de ações irreversíveis
2. Implementar fallback em caso de falha de validação
3. Monitorar requisições pendentes
4. Manter logs de todas as validações

## 📚 Referências

- [Chainlink Functions Docs](https://docs.chain.link/chainlink-functions)
- [Chainlink Functions Examples](https://github.com/smartcontractkit/smart-contract-examples)
- [Pharmalink GitHub](https://github.com/luizfolly/pharmalink)

## 🤝 Suporte

Para dúvidas ou problemas:
1. Verificar logs de deployment
2. Consultar eventos emitidos
3. Testar em localhost primeiro
4. Abrir issue no repositório
