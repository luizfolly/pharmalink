/**
 * Exemplo de Uso - Zama FHE Integration
 * Demonstra como usar a biblioteca Zama para criptografia e operações privadas
 */

import { ZamaEncryption, ZamaDecryption, FHEOperations } from "../../lib/zama";

async function exampleUsage() {
    console.log("🔐 EXEMPLO DE USO - ZAMA FHE INTEGRATION\n");

    // ================================================
    // 1. INICIALIZAR CRIPTOGRAFIA
    // ================================================

    console.log("1️⃣  Inicializando criptografia...");
    const encryption = new ZamaEncryption();
    const { publicKey, privateKey } = await encryption.generateKeyPair();
    console.log("✅ Chaves geradas\n");

    // ================================================
    // 2. CRIPTOGRAFAR PRESCRIÇÃO
    // ================================================

    console.log("2️⃣  Criptografando prescrição...");
    const prescription = {
        doctor: "0x1234567890123456789012345678901234567890",
        patient: "0x0987654321098765432109876543210987654321",
        medicineId: 42,
        isValid: true,
    };

    const encryptedPrescription = await encryption.encryptPrescription(prescription);
    console.log("✅ Prescrição criptografada\n");

    // ================================================
    // 3. CRIPTOGRAFAR MEDICAMENTO
    // ================================================

    console.log("3️⃣  Criptografando medicamento...");
    const medicine = {
        name: "Aspirin 500mg",
        batchNumber: "BATCH-2024-001",
        expirationDate: 1735689600, // 2025-01-01
        manufacturer: "0x1111111111111111111111111111111111111111",
    };

    const encryptedMedicine = await encryption.encryptMedicine(medicine);
    console.log("✅ Medicamento criptografado\n");

    // ================================================
    // 4. OPERAÇÕES PRIVADAS
    // ================================================

    console.log("4️⃣  Realizando operações privadas...");
    const operations = new FHEOperations();

    // Verificar expiração privadamente
    const currentTime = Math.floor(Date.now() / 1000);
    const encryptedCurrentTime = await encryption.encrypt(currentTime, "uint256");

    const isExpired = await operations.isExpired(
        encryptedMedicine.expirationDate,
        encryptedCurrentTime
    );
    console.log("✅ Verificação de expiração concluída\n");

    // ================================================
    // 5. DESCRIPTOGRAFAR RESULTADOS
    // ================================================

    console.log("5️⃣  Descriptografando resultados...");
    const decryption = new ZamaDecryption(privateKey);

    const decryptedPrescription = await decryption.decryptPrescription(encryptedPrescription);
    console.log("✅ Prescrição descriptografada:");
    console.log(JSON.stringify(decryptedPrescription, null, 2));

    const decryptedMedicine = await decryption.decryptMedicine(encryptedMedicine);
    console.log("\n✅ Medicamento descriptografado:");
    console.log(JSON.stringify(decryptedMedicine, null, 2));

    const decryptedIsExpired = await decryption.decrypt(isExpired);
    console.log(`\n✅ Medicamento expirado? ${decryptedIsExpired}\n`);

    // ================================================
    // 6. VALIDAÇÃO COMPLEXA
    // ================================================

    console.log("6️⃣  Realizando validação complexa...");

    const encryptedIsValid = await encryption.encrypt(true, "bool");
    const encryptedIsApproved = await encryption.encrypt(true, "bool");

    const medicineValid = await operations.isMedicineValid(
        encryptedIsValid,
        encryptedMedicine.expirationDate,
        encryptedCurrentTime,
        encryptedIsApproved
    );

    const decryptedMedicineValid = await decryption.decrypt(medicineValid);
    console.log(`✅ Medicamento válido? ${decryptedMedicineValid}\n`);

    // ================================================
    // RESUMO
    // ================================================

    console.log("════════════════════════════════════════════════════════════");
    console.log("✅ EXEMPLO CONCLUÍDO COM SUCESSO!");
    console.log("════════════════════════════════════════════════════════════");
    console.log("\n📊 Resumo:");
    console.log(`  • Prescrição: ${decryptedPrescription.isValid ? "✅ Válida" : "❌ Inválida"}`);
    console.log(`  • Medicamento: ${decryptedMedicineValid ? "✅ Válido" : "❌ Inválido"}`);
    console.log(`  • Expirado: ${decryptedIsExpired ? "⚠️  Sim" : "✅ Não"}`);
    console.log("\n🔐 Todos os dados foram processados criptografados!");
}

// Executar exemplo
exampleUsage().catch(console.error);
