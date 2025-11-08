# 📖 Exemplos de Uso - Chainlink Functions Integration

## Índice

1. [Setup Inicial](#setup-inicial)
2. [Prescrições](#prescrições)
3. [Supply Chain](#supply-chain)
4. [Validações](#validações)
5. [Monitoramento](#monitoramento)

---

## Setup Inicial

### Conectar aos Contratos

```typescript
import { ethers } from "hardhat";

// Obter signers
const [owner, doctor, patient, manufacturer, distributor, pharmacy] = 
  await ethers.getSigners();

// Conectar aos contratos
const prescriptionV2 = await ethers.getContractAt(
  "PharmaLinkPrescriptionV2",
  prescriptionV2Address
);

const supplyChainV2 = await ethers.getContractAt(
  "PharmaLinkSupplyChainV2",
  supplyChainV2Address
);

const validator = await ethers.getContractAt(
  "PharmaLinkDataValidator",
  validatorAddress
);
```

---

## Prescrições

### 1. Registrar Médico

```typescript
// Registrar médico com número de licença
const licenseNumber = "CRM123456";
await prescriptionV2.registerDoctorProfile(doctor.address, licenseNumber);

console.log("✅ Médico registrado");
```

### 2. Validar Credenciais do Médico

```typescript
// Solicitar validação de credenciais
const credentialsRequestId = await validator.validateDoctorCredentials(
  doctor.address,
  "CRM123456"
);

console.log("📋 Validação solicitada:", credentialsRequestId);

// Simular callback de validação bem-sucedida (em produção, Chainlink faz isso)
await prescriptionV2.onDoctorCredentialsValidationResult(
  credentialsRequestId,
  doctor.address,
  true // isValid
);

console.log("✅ Credenciais validadas");
```

### 3. Autorizar Médico

```typescript
// Autorizar médico após validação
await prescriptionV2.authorizeDoctor(doctor.address, true);

console.log("✅ Médico autorizado");

// Verificar autorização
const isAuthorized = await prescriptionV2.isDoctorAuthorized(doctor.address);
console.log("Médico autorizado?", isAuthorized);
```

### 4. Criar Prescrição

```typescript
// Médico cria prescrição
const tokenURI = "ipfs://QmExample123";

const tx = await prescriptionV2
  .connect(doctor)
  .createPrescription(patient.address, tokenURI);

const receipt = await tx.wait();
console.log("✅ Prescrição criada");

// Obter ID da prescrição
const prescriptionId = await prescriptionV2.getPrescriptionCounter();
console.log("Prescrição ID:", prescriptionId);
```

### 5. Validar Prescrição

```typescript
// Solicitar validação de prescrição
const prescriptionRequestId = await validator.validatePrescription(
  prescriptionId,
  doctor.address,
  patient.address
);

console.log("📋 Validação de prescrição solicitada:", prescriptionRequestId);

// Simular callback (em produção, Chainlink faz isso)
await prescriptionV2.onPrescriptionValidationResult(
  prescriptionRequestId,
  prescriptionId,
  true // isValid
);

console.log("✅ Prescrição validada");

// Verificar status
const prescription = await prescriptionV2.getPrescription(prescriptionId);
console.log("Status de validação:", prescription.validationStatus);
// 0 = NotValidated, 1 = Pending, 2 = Approved, 3 = Rejected
```

### 6. Queimar Prescrição

```typescript
// Paciente queima prescrição após usar
await prescriptionV2.connect(patient).burnPrescription(prescriptionId);

console.log("✅ Prescrição queimada (invalidada)");

// Verificar se foi invalidada
const prescription = await prescriptionV2.getPrescription(prescriptionId);
console.log("Prescrição válida?", prescription.isValid);
```

---

## Supply Chain

### 1. Autorizar Participantes

```typescript
// Autorizar fabricante
await supplyChainV2.authorizePharmaceutical(manufacturer.address);
console.log("✅ Fabricante autorizado");

// Autorizar distribuidor
await supplyChainV2.authorizeDistributor(distributor.address);
console.log("✅ Distribuidor autorizado");

// Autorizar farmácia
await supplyChainV2.authorizePharmacy(pharmacy.address);
console.log("✅ Farmácia autorizada");
```

### 2. Criar Medicamento

```typescript
// Fabricante cria medicamento
const name = "Aspirin";
const batchNumber = "BATCH001";
const metadataURI = "ipfs://QmMedicine123";
const producerName = "Pharma Corp";
const expirationDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 ano

const tx = await supplyChainV2
  .connect(manufacturer)
  .createMedicine(name, batchNumber, metadataURI, producerName, expirationDate);

const receipt = await tx.wait();
console.log("✅ Medicamento criado");

// Obter ID do medicamento
const medicineId = await supplyChainV2.medicineCounter();
console.log("Medicamento ID:", medicineId);
```

### 3. Validar Medicamento

```typescript
// Solicitar validação de autenticidade
const medicineRequestId = await validator.validateMedicineAuthenticity(
  medicineId,
  "BATCH001",
  manufacturer.address
);

console.log("📋 Validação de medicamento solicitada:", medicineRequestId);

// Simular callback (em produção, Chainlink faz isso)
await supplyChainV2.onMedicineValidationResult(
  medicineRequestId,
  medicineId,
  true // isValid
);

console.log("✅ Medicamento validado");
```

### 4. Criar Pedido

```typescript
// Farmácia cria pedido
const quantity = 100;

const tx = await supplyChainV2
  .connect(pharmacy)
  .createPharmacyOrder(medicineId, quantity, distributor.address);

const receipt = await tx.wait();
console.log("✅ Pedido criado");

// Obter ID do pedido
const orderId = await supplyChainV2.orderCounter();
console.log("Pedido ID:", orderId);
```

### 5. Validar Pedido

```typescript
// Solicitar validação de pedido
const orderRequestId = await validator.validateBatchExpiration(
  medicineId,
  "BATCH001",
  expirationDate
);

console.log("📋 Validação de pedido solicitada:", orderRequestId);

// Simular callback (em produção, Chainlink faz isso)
await supplyChainV2.onOrderValidationResult(
  orderRequestId,
  orderId,
  true // isValid
);

console.log("✅ Pedido validado");
```

### 6. Transferir Medicamento

```typescript
// Fabricante transfere para distribuidor
await supplyChainV2
  .connect(manufacturer)
  .transferToDistributor(medicineId, distributor.address);

console.log("✅ Medicamento transferido para distribuidor");

// Distribuidor transfere para farmácia
await supplyChainV2
  .connect(distributor)
  .transferToPharmacy(medicineId, pharmacy.address);

console.log("✅ Medicamento transferido para farmácia");
```

### 7. Adicionar Rastreamento

```typescript
// Distribuidor adiciona evento de rastreamento
await supplyChainV2
  .connect(distributor)
  .addTrackingEvent(
    medicineId,
    "São Paulo, SP",
    "25°C",
    "60%",
    "Transport in progress",
    1 // Status.InTransit
  );

console.log("✅ Evento de rastreamento adicionado");

// Obter histórico
const history = await supplyChainV2.getTrackingHistory(medicineId);
console.log("Histórico de rastreamento:", history);
```

### 8. Validar Temperatura

```typescript
// Solicitar validação de conformidade de temperatura
const tempRequestId = await validator.validateTemperatureCompliance(
  medicineId,
  15, // minTemp
  25  // maxTemp
);

console.log("📋 Validação de temperatura solicitada:", tempRequestId);

// Simular callback
await supplyChainV2.onMedicineValidationResult(
  tempRequestId,
  medicineId,
  true // isValid
);

console.log("✅ Temperatura validada");
```

### 9. Marcar como Vendido

```typescript
// Farmácia marca medicamento como vendido
await supplyChainV2.connect(pharmacy).markAsSold(medicineId);

console.log("✅ Medicamento marcado como vendido");

// Verificar status final
const medicine = await supplyChainV2.getMedicine(medicineId);
console.log("Status final:", medicine.status); // 3 = Sold
```

---

## Validações

### Verificar Status de Validação

```typescript
// Obter status de uma requisição
const status = await validator.getRequestStatus(requestId);
console.log("Status:", status);
// 0 = Pending, 1 = Fulfilled, 2 = Failed

// Obter resposta
const response = await validator.getRequestResponse(requestId);
console.log("Resposta:", response);

// Obter resultado de validação
const result = await validator.getValidationResult(
  supplyChainV2Address,
  medicineId
);
console.log("Aprovado?", result.isApproved);
console.log("Motivo:", result.reason);
```

### Obter Histórico de Requisições

```typescript
// Obter todas as requisições de um usuário
const userRequests = await validator.getUserRequests(doctor.address);
console.log("Total de requisições:", userRequests.length);

// Obter detalhes de uma requisição
const requestDetails = await validator.getValidationRequest(requestId);
console.log("Detalhes:", requestDetails);
```

---

## Monitoramento

### Escutar Eventos

```typescript
// Escutar validações solicitadas
validator.on("ValidationRequested", (requestId, validationType, targetContract, targetId) => {
  console.log("🔔 Validação solicitada:");
  console.log("   Request ID:", requestId);
  console.log("   Tipo:", validationType);
  console.log("   Contrato:", targetContract);
  console.log("   ID do alvo:", targetId);
});

// Escutar validações completadas
validator.on("ValidationCompleted", (requestId, validationType, isValid, validationData) => {
  console.log("✅ Validação completada:");
  console.log("   Request ID:", requestId);
  console.log("   Tipo:", validationType);
  console.log("   Válido?", isValid);
  console.log("   Dados:", validationData);
});

// Escutar atualizações de status
prescriptionV2.on("ValidationStatusUpdated", (targetId, targetType, newStatus) => {
  console.log("📊 Status atualizado:");
  console.log("   ID:", targetId);
  console.log("   Tipo:", targetType);
  console.log("   Novo status:", newStatus);
});

supplyChainV2.on("ValidationStatusUpdated", (targetId, targetType, newStatus) => {
  console.log("📊 Status atualizado (Supply Chain):");
  console.log("   ID:", targetId);
  console.log("   Tipo:", targetType);
  console.log("   Novo status:", newStatus);
});
```

### Monitorar Transações

```typescript
// Aguardar confirmação de transação
const tx = await prescriptionV2
  .connect(doctor)
  .createPrescription(patient.address, tokenURI);

const receipt = await tx.wait();

if (receipt?.status === 1) {
  console.log("✅ Transação confirmada");
} else {
  console.log("❌ Transação falhou");
}

// Obter logs de eventos
const events = receipt?.logs || [];
console.log("Eventos:", events.length);
```

---

## Fluxo Completo - Exemplo

```typescript
async function completePharmacyFlow() {
  console.log("🚀 Iniciando fluxo completo...\n");

  // 1. Setup
  console.log("1️⃣  Setup");
  await supplyChainV2.authorizePharmaceutical(manufacturer.address);
  await supplyChainV2.authorizeDistributor(distributor.address);
  await supplyChainV2.authorizePharmacy(pharmacy.address);
  console.log("   ✅ Participantes autorizados\n");

  // 2. Criar medicamento
  console.log("2️⃣  Criar medicamento");
  const expirationDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
  await supplyChainV2
    .connect(manufacturer)
    .createMedicine(
      "Ibuprofen",
      "BATCH001",
      "ipfs://QmMedicine",
      "Pharma Inc",
      expirationDate
    );
  const medicineId = await supplyChainV2.medicineCounter();
  console.log("   ✅ Medicamento criado:", medicineId, "\n");

  // 3. Validar medicamento
  console.log("3️⃣  Validar medicamento");
  const medicineRequestId = await validator.validateMedicineAuthenticity(
    medicineId,
    "BATCH001",
    manufacturer.address
  );
  await supplyChainV2.onMedicineValidationResult(
    medicineRequestId,
    medicineId,
    true
  );
  console.log("   ✅ Medicamento validado\n");

  // 4. Criar pedido
  console.log("4️⃣  Criar pedido");
  await supplyChainV2
    .connect(pharmacy)
    .createPharmacyOrder(medicineId, 100, distributor.address);
  const orderId = await supplyChainV2.orderCounter();
  console.log("   ✅ Pedido criado:", orderId, "\n");

  // 5. Validar pedido
  console.log("5️⃣  Validar pedido");
  const orderRequestId = await validator.validateBatchExpiration(
    medicineId,
    "BATCH001",
    expirationDate
  );
  await supplyChainV2.onOrderValidationResult(orderRequestId, orderId, true);
  console.log("   ✅ Pedido validado\n");

  // 6. Transferências
  console.log("6️⃣  Transferências");
  await supplyChainV2
    .connect(manufacturer)
    .transferToDistributor(medicineId, distributor.address);
  console.log("   ✅ Transferido para distribuidor");

  await supplyChainV2
    .connect(distributor)
    .transferToPharmacy(medicineId, pharmacy.address);
  console.log("   ✅ Transferido para farmácia\n");

  // 7. Rastreamento
  console.log("7️⃣  Rastreamento");
  await supplyChainV2
    .connect(distributor)
    .addTrackingEvent(
      medicineId,
      "São Paulo, SP",
      "22°C",
      "55%",
      "In transit",
      1
    );
  console.log("   ✅ Evento de rastreamento adicionado\n");

  // 8. Marcar como vendido
  console.log("8️⃣  Marcar como vendido");
  await supplyChainV2.connect(pharmacy).markAsSold(medicineId);
  console.log("   ✅ Medicamento vendido\n");

  // 9. Verificar estado final
  console.log("9️⃣  Estado final");
  const medicine = await supplyChainV2.getMedicine(medicineId);
  console.log("   Status:", medicine.status); // 3 = Sold
  console.log("   Validação:", medicine.validationStatus); // 2 = Approved
  console.log("\n✅ Fluxo completo concluído!");
}

// Executar
await completePharmacyFlow();
```

---

## Dicas e Boas Práticas

### 1. Sempre Validar Antes de Ações Críticas

```typescript
// ❌ Evitar
await supplyChainV2.transferToDistributor(medicineId, distributor.address);

// ✅ Preferir
const medicineRequestId = await validator.validateMedicineAuthenticity(...);
await supplyChainV2.onMedicineValidationResult(medicineRequestId, medicineId, true);
await supplyChainV2.transferToDistributor(medicineId, distributor.address);
```

### 2. Monitorar Eventos

```typescript
// Escutar eventos para rastrear fluxo
validator.on("ValidationCompleted", (requestId, validationType, isValid) => {
  if (!isValid) {
    console.error("⚠️  Validação falhou!");
    // Tomar ação apropriada
  }
});
```

### 3. Tratamento de Erros

```typescript
try {
  await prescriptionV2.authorizeDoctor(doctor.address, true);
} catch (error) {
  if (error.message.includes("Doctor credentials must be validated")) {
    console.error("Credenciais não foram validadas");
  } else {
    console.error("Erro desconhecido:", error);
  }
}
```

### 4. Usar Configurações Apropriadas

```typescript
// Para desenvolvimento
await prescriptionV2.setValidationRequirements(false, false);

// Para produção
await prescriptionV2.setValidationRequirements(true, true);
```

---

## Recursos Adicionais

- [CHAINLINK_INTEGRATION.md](./contracts/CHAINLINK_INTEGRATION.md) - Documentação técnica
- [CHAINLINK_SETUP.md](./CHAINLINK_SETUP.md) - Guia de setup
- [ChainlinkValidator.test.ts](./test/ChainlinkValidator.test.ts) - Testes completos
