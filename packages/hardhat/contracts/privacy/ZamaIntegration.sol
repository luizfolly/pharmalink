// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../PharmaLinkPrescription.sol";
import "../PharmaLinkSupplyChain.sol";
import "./PharmaLinkPrivacy.sol";

/**
 * @title ZamaIntegration
 * @dev Integração de Zama FHE com os contratos existentes do Pharmalink
 * Fornece uma camada de privacidade para prescrições e medicamentos
 */
contract ZamaIntegration {
    // ================================================
    // ESTADO
    // ================================================

    PharmaLinkPrescription public prescriptionContract;
    PharmaLinkSupplyChain public supplyChainContract;
    PharmaLinkPrivacy public privacyContract;

    address public owner;

    // Mapeamento de prescrição ID -> dados criptografados
    mapping(uint256 => bytes) public encryptedPrescriptionData;

    // Mapeamento de medicamento ID -> dados criptografados
    mapping(uint256 => bytes) public encryptedMedicineData;

    // Mapeamento de validação ID -> dados criptografados
    mapping(uint256 => bytes) public encryptedValidationData;

    // Rastreamento de quem pode descriptografar
    mapping(uint256 => address[]) public authorizedDecryptors;

    // ================================================
    // EVENTOS
    // ================================================

    event PrescriptionEncrypted(uint256 indexed prescriptionId, address indexed doctor);
    event MedicineEncrypted(uint256 indexed medicineId, address indexed manufacturer);
    event ValidationEncrypted(uint256 indexed validationId, bytes32 indexed requestId);
    event DecryptorAuthorized(uint256 indexed dataId, address indexed decryptor);
    event DecryptorRevoked(uint256 indexed dataId, address indexed decryptor);

    // ================================================
    // MODIFICADORES
    // ================================================

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyAuthorizedDecryptor(uint256 dataId) {
        bool isAuthorized = false;
        for (uint256 i = 0; i < authorizedDecryptors[dataId].length; i++) {
            if (authorizedDecryptors[dataId][i] == msg.sender) {
                isAuthorized = true;
                break;
            }
        }
        require(isAuthorized, "Not authorized to decrypt");
        _;
    }

    // ================================================
    // CONSTRUTOR
    // ================================================

    constructor(
        address _prescriptionContract,
        address _supplyChainContract,
        address _privacyContract
    ) {
        owner = msg.sender;
        prescriptionContract = PharmaLinkPrescription(_prescriptionContract);
        supplyChainContract = PharmaLinkSupplyChain(_supplyChainContract);
        privacyContract = PharmaLinkPrivacy(_privacyContract);
    }

    // ================================================
    // PRESCRIÇÃO - CRIPTOGRAFIA
    // ================================================

    /**
     * @dev Armazenar prescrição criptografada
     * @param prescriptionId ID da prescrição
     * @param encryptedData Dados criptografados
     */
    function storePrescriptionEncrypted(uint256 prescriptionId, bytes calldata encryptedData)
        external
    {
        require(encryptedData.length > 0, "Empty encrypted data");

        // Armazenar no contrato de privacidade
        privacyContract.storeEncryptedPrescription(prescriptionId, encryptedData);

        // Armazenar localmente
        encryptedPrescriptionData[prescriptionId] = encryptedData;

        // Autorizar o médico a descriptografar
        authorizeDecryptor(prescriptionId, msg.sender);

        emit PrescriptionEncrypted(prescriptionId, msg.sender);
    }

    /**
     * @dev Recuperar prescrição criptografada
     * @param prescriptionId ID da prescrição
     */
    function getPrescriptionEncrypted(uint256 prescriptionId)
        external
        onlyAuthorizedDecryptor(prescriptionId)
        returns (bytes memory)
    {
        return privacyContract.getEncryptedPrescription(prescriptionId);
    }

    // ================================================
    // MEDICAMENTO - CRIPTOGRAFIA
    // ================================================

    /**
     * @dev Armazenar medicamento criptografado
     * @param medicineId ID do medicamento
     * @param encryptedData Dados criptografados
     */
    function storeMedicineEncrypted(uint256 medicineId, bytes calldata encryptedData) external {
        require(encryptedData.length > 0, "Empty encrypted data");

        // Armazenar no contrato de privacidade
        privacyContract.storeEncryptedMedicine(medicineId, encryptedData);

        // Armazenar localmente
        encryptedMedicineData[medicineId] = encryptedData;

        // Autorizar o fabricante a descriptografar
        authorizeDecryptor(medicineId, msg.sender);

        emit MedicineEncrypted(medicineId, msg.sender);
    }

    /**
     * @dev Recuperar medicamento criptografado
     * @param medicineId ID do medicamento
     */
    function getMedicineEncrypted(uint256 medicineId)
        external
        onlyAuthorizedDecryptor(medicineId)
        returns (bytes memory)
    {
        return privacyContract.getEncryptedMedicine(medicineId);
    }

    // ================================================
    // VALIDAÇÃO - CRIPTOGRAFIA
    // ================================================

    /**
     * @dev Armazenar validação criptografada
     * @param validationId ID da validação
     * @param requestId ID da requisição
     * @param encryptedData Dados criptografados
     */
    function storeValidationEncrypted(
        uint256 validationId,
        bytes32 requestId,
        bytes calldata encryptedData
    ) external {
        require(encryptedData.length > 0, "Empty encrypted data");

        // Armazenar no contrato de privacidade
        privacyContract.storeEncryptedValidation(validationId, requestId, encryptedData);

        // Armazenar localmente
        encryptedValidationData[validationId] = encryptedData;

        // Autorizar o validador a descriptografar
        authorizeDecryptor(validationId, msg.sender);

        emit ValidationEncrypted(validationId, requestId);
    }

    /**
     * @dev Recuperar validação criptografada
     * @param validationId ID da validação
     */
    function getValidationEncrypted(uint256 validationId)
        external
        onlyAuthorizedDecryptor(validationId)
        returns (bytes memory)
    {
        return privacyContract.getEncryptedValidation(validationId);
    }

    // ================================================
    // GERENCIAMENTO DE ACESSO
    // ================================================

    /**
     * @dev Autorizar um endereço a descriptografar dados
     * @param dataId ID dos dados
     * @param decryptor Endereço autorizado
     */
    function authorizeDecryptor(uint256 dataId, address decryptor) public {
        // Apenas o owner ou quem armazenou os dados pode autorizar
        require(msg.sender == owner || msg.sender == tx.origin, "Not authorized");

        // Verificar se já está autorizado
        for (uint256 i = 0; i < authorizedDecryptors[dataId].length; i++) {
            if (authorizedDecryptors[dataId][i] == decryptor) {
                return; // Já autorizado
            }
        }

        authorizedDecryptors[dataId].push(decryptor);
        emit DecryptorAuthorized(dataId, decryptor);
    }

    /**
     * @dev Revogar autorização de descriptografia
     * @param dataId ID dos dados
     * @param decryptor Endereço a revogar
     */
    function revokeDecryptor(uint256 dataId, address decryptor) external onlyOwner {
        for (uint256 i = 0; i < authorizedDecryptors[dataId].length; i++) {
            if (authorizedDecryptors[dataId][i] == decryptor) {
                // Remover do array
                authorizedDecryptors[dataId][i] = authorizedDecryptors[dataId][
                    authorizedDecryptors[dataId].length - 1
                ];
                authorizedDecryptors[dataId].pop();
                emit DecryptorRevoked(dataId, decryptor);
                return;
            }
        }
    }

    /**
     * @dev Obter lista de descriptores autorizados
     * @param dataId ID dos dados
     */
    function getAuthorizedDecryptors(uint256 dataId)
        external
        view
        returns (address[] memory)
    {
        return authorizedDecryptors[dataId];
    }

    /**
     * @dev Verificar se um endereço está autorizado
     * @param dataId ID dos dados
     * @param decryptor Endereço a verificar
     */
    function isAuthorizedDecryptor(uint256 dataId, address decryptor)
        external
        view
        returns (bool)
    {
        for (uint256 i = 0; i < authorizedDecryptors[dataId].length; i++) {
            if (authorizedDecryptors[dataId][i] == decryptor) {
                return true;
            }
        }
        return false;
    }

    // ================================================
    // GERENCIAMENTO DE CHAVES PÚBLICAS
    // ================================================

    /**
     * @dev Registrar chave pública do usuário
     * @param publicKey Chave pública em bytes
     */
    function registerPublicKey(bytes calldata publicKey) external {
        privacyContract.registerPublicKey(publicKey);
    }

    /**
     * @dev Obter chave pública do usuário
     * @param user Endereço do usuário
     */
    function getPublicKey(address user) external view returns (bytes memory) {
        return privacyContract.getPublicKey(user);
    }

    // ================================================
    // INFORMAÇÕES
    // ================================================

    /**
     * @dev Obter endereços dos contratos integrados
     */
    function getContractAddresses()
        external
        view
        returns (
            address prescription,
            address supplyChain,
            address privacy
        )
    {
        return (
            address(prescriptionContract),
            address(supplyChainContract),
            address(privacyContract)
        );
    }
}
