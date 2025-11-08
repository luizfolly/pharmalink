// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PharmaLinkPrivacy
 * @dev Armazena dados criptografados com Zama FHE
 * Implementação para garantir privacidade de dados médicos
 */
contract PharmaLinkPrivacy {
    // ================================================
    // ESTADO
    // ================================================

    // Armazena dados criptografados
    mapping(uint256 => bytes) public encryptedPrescriptions;
    mapping(uint256 => bytes) public encryptedMedicines;
    mapping(uint256 => bytes) public encryptedValidations;

    // Metadados de chaves públicas
    mapping(address => bytes) public userPublicKeys;

    // Contadores
    uint256 public prescriptionCounter;
    uint256 public medicineCounter;
    uint256 public validationCounter;

    // ================================================
    // EVENTOS
    // ================================================

    event EncryptedPrescriptionStored(
        uint256 indexed prescriptionId,
        address indexed doctor,
        uint256 timestamp
    );

    event EncryptedMedicineStored(
        uint256 indexed medicineId,
        address indexed manufacturer,
        uint256 timestamp
    );

    event EncryptedValidationStored(
        uint256 indexed validationId,
        bytes32 indexed requestId,
        uint256 timestamp
    );

    event PublicKeyRegistered(address indexed user, uint256 timestamp);

    event EncryptedDataRetrieved(
        uint256 indexed dataId,
        address indexed requester,
        string dataType,
        uint256 timestamp
    );

    // ================================================
    // FUNÇÕES - PRESCRIÇÕES
    // ================================================

    /**
     * @dev Armazenar prescrição criptografada
     * @param prescriptionId ID da prescrição
     * @param encryptedData Dados criptografados
     */
    function storeEncryptedPrescription(
        uint256 prescriptionId,
        bytes calldata encryptedData
    ) external {
        require(encryptedData.length > 0, "Empty encrypted data");
        require(prescriptionId > 0, "Invalid prescription ID");

        encryptedPrescriptions[prescriptionId] = encryptedData;
        prescriptionCounter++;

        emit EncryptedPrescriptionStored(prescriptionId, msg.sender, block.timestamp);
    }

    /**
     * @dev Recuperar prescrição criptografada
     * @param prescriptionId ID da prescrição
     */
    function getEncryptedPrescription(uint256 prescriptionId)
        external
        returns (bytes memory)
    {
        require(encryptedPrescriptions[prescriptionId].length > 0, "Prescription not found");

        emit EncryptedDataRetrieved(prescriptionId, msg.sender, "prescription", block.timestamp);

        return encryptedPrescriptions[prescriptionId];
    }

    // ================================================
    // FUNÇÕES - MEDICAMENTOS
    // ================================================

    /**
     * @dev Armazenar medicamento criptografado
     * @param medicineId ID do medicamento
     * @param encryptedData Dados criptografados
     */
    function storeEncryptedMedicine(
        uint256 medicineId,
        bytes calldata encryptedData
    ) external {
        require(encryptedData.length > 0, "Empty encrypted data");
        require(medicineId > 0, "Invalid medicine ID");

        encryptedMedicines[medicineId] = encryptedData;
        medicineCounter++;

        emit EncryptedMedicineStored(medicineId, msg.sender, block.timestamp);
    }

    /**
     * @dev Recuperar medicamento criptografado
     * @param medicineId ID do medicamento
     */
    function getEncryptedMedicine(uint256 medicineId)
        external
        returns (bytes memory)
    {
        require(encryptedMedicines[medicineId].length > 0, "Medicine not found");

        emit EncryptedDataRetrieved(medicineId, msg.sender, "medicine", block.timestamp);

        return encryptedMedicines[medicineId];
    }

    // ================================================
    // FUNÇÕES - VALIDAÇÕES
    // ================================================

    /**
     * @dev Armazenar validação criptografada
     * @param validationId ID da validação
     * @param requestId ID da requisição Chainlink
     * @param encryptedData Dados criptografados
     */
    function storeEncryptedValidation(
        uint256 validationId,
        bytes32 requestId,
        bytes calldata encryptedData
    ) external {
        require(encryptedData.length > 0, "Empty encrypted data");
        require(validationId > 0, "Invalid validation ID");
        require(requestId != bytes32(0), "Invalid request ID");

        encryptedValidations[validationId] = encryptedData;
        validationCounter++;

        emit EncryptedValidationStored(validationId, requestId, block.timestamp);
    }

    /**
     * @dev Recuperar validação criptografada
     * @param validationId ID da validação
     */
    function getEncryptedValidation(uint256 validationId)
        external
        returns (bytes memory)
    {
        require(encryptedValidations[validationId].length > 0, "Validation not found");

        emit EncryptedDataRetrieved(validationId, msg.sender, "validation", block.timestamp);

        return encryptedValidations[validationId];
    }

    // ================================================
    // FUNÇÕES - GERENCIAMENTO DE CHAVES
    // ================================================

    /**
     * @dev Registrar chave pública do usuário
     * @param publicKey Chave pública em bytes
     */
    function registerPublicKey(bytes calldata publicKey) external {
        require(publicKey.length > 0, "Empty public key");

        userPublicKeys[msg.sender] = publicKey;

        emit PublicKeyRegistered(msg.sender, block.timestamp);
    }

    /**
     * @dev Recuperar chave pública do usuário
     * @param user Endereço do usuário
     */
    function getPublicKey(address user) external view returns (bytes memory) {
        return userPublicKeys[user];
    }

    /**
     * @dev Verificar se usuário tem chave pública registrada
     * @param user Endereço do usuário
     */
    function hasPublicKey(address user) external view returns (bool) {
        return userPublicKeys[user].length > 0;
    }

    // ================================================
    // FUNÇÕES - INFORMAÇÕES
    // ================================================

    /**
     * @dev Obter contadores
     */
    function getCounters()
        external
        view
        returns (
            uint256 prescriptions,
            uint256 medicines,
            uint256 validations
        )
    {
        return (prescriptionCounter, medicineCounter, validationCounter);
    }

    /**
     * @dev Verificar se prescrição existe
     * @param prescriptionId ID da prescrição
     */
    function prescriptionExists(uint256 prescriptionId) external view returns (bool) {
        return encryptedPrescriptions[prescriptionId].length > 0;
    }

    /**
     * @dev Verificar se medicamento existe
     * @param medicineId ID do medicamento
     */
    function medicineExists(uint256 medicineId) external view returns (bool) {
        return encryptedMedicines[medicineId].length > 0;
    }

    /**
     * @dev Verificar se validação existe
     * @param validationId ID da validação
     */
    function validationExists(uint256 validationId) external view returns (bool) {
        return encryptedValidations[validationId].length > 0;
    }
}
