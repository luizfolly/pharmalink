// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PharmaLinkPrescriptionV2
 * @dev Prescrições com integração de validação via Chainlink Functions
 * Estende PharmaLinkPrescription com validações de dados externos
 */
contract PharmaLinkPrescriptionV2 is ERC721URIStorage, Ownable {
    // ================================================
    // TIPOS E ESTRUTURAS
    // ================================================

    enum ValidationStatus {
        NotValidated,
        Pending,
        Approved,
        Rejected
    }

    struct Prescription {
        address doctor;
        address patient;
        bool isValid;
        string metadataURI;
        ValidationStatus validationStatus;
        bytes32 validationRequestId;
        uint256 createdAt;
    }

    struct DoctorProfile {
        address doctorAddress;
        string licenseNumber;
        bool isAuthorized;
        ValidationStatus credentialsStatus;
        bytes32 credentialsValidationRequestId;
        uint256 authorizedAt;
    }

    struct ValidationConfig {
        address validatorContract;
        bool requirePrescriptionValidation;
        bool requireDoctorCredentialsValidation;
    }

    // ================================================
    // ESTADO
    // ================================================

    uint256 public prescriptionCounter;

    mapping(uint256 => Prescription) public prescriptions;
    mapping(address => DoctorProfile) public doctorProfiles;
    mapping(address => bool) public authorizedDoctors;

    ValidationConfig public validationConfig;

    // Mapeamento de requisições de validação
    mapping(bytes32 => uint256) public validationRequestToPrescriptionId;
    mapping(bytes32 => address) public validationRequestToDoctorAddress;

    // ================================================
    // EVENTOS
    // ================================================

    event DoctorAuthorized(address indexed doctor, bool authorized);
    event DoctorProfileCreated(address indexed doctor, string licenseNumber);
    event PrescriptionCreated(uint256 indexed id, address indexed doctor, address indexed patient);
    event PrescriptionBurned(uint256 indexed id);

    event ValidationRequested(
        bytes32 indexed requestId,
        uint256 indexed targetId,
        string targetType
    );

    event ValidationStatusUpdated(
        uint256 indexed targetId,
        string targetType,
        ValidationStatus newStatus
    );

    event DoctorCredentialsValidationUpdated(
        address indexed doctor,
        ValidationStatus newStatus
    );

    event ValidatorContractUpdated(address indexed newValidator);

    // ================================================
    // MODIFICADORES
    // ================================================

    modifier onlyValidatorContract() {
        require(msg.sender == validationConfig.validatorContract, "Only validator contract");
        _;
    }

    modifier onlyAuthorizedDoctor() {
        require(authorizedDoctors[msg.sender], "Not an authorized doctor");
        _;
    }

    // ================================================
    // CONSTRUTOR
    // ================================================

    constructor() ERC721("PharmaLinkPrescription", "pNFT") {
        validationConfig = ValidationConfig({
            validatorContract: address(0),
            requirePrescriptionValidation: false,
            requireDoctorCredentialsValidation: false
        });
    }

    // ================================================
    // CONFIGURAÇÃO DE VALIDAÇÃO
    // ================================================

    /**
     * @dev Define o contrato validador de Chainlink Functions
     */
    function setValidatorContract(address validatorAddress) external onlyOwner {
        require(validatorAddress != address(0), "Invalid validator address");
        validationConfig.validatorContract = validatorAddress;
        emit ValidatorContractUpdated(validatorAddress);
    }

    /**
     * @dev Configura quais validações são obrigatórias
     */
    function setValidationRequirements(
        bool requirePrescription,
        bool requireDoctorCredentials
    ) external onlyOwner {
        validationConfig.requirePrescriptionValidation = requirePrescription;
        validationConfig.requireDoctorCredentialsValidation = requireDoctorCredentials;
    }

    // ================================================
    // GERENCIAMENTO DE MÉDICOS
    // ================================================

    /**
     * @dev Registra um perfil de médico com número de licença
     */
    function registerDoctorProfile(address doctor, string memory licenseNumber)
        external
        onlyOwner
    {
        require(doctor != address(0), "Invalid doctor address");
        require(bytes(licenseNumber).length > 0, "License number required");

        doctorProfiles[doctor] = DoctorProfile({
            doctorAddress: doctor,
            licenseNumber: licenseNumber,
            isAuthorized: false,
            credentialsStatus: validationConfig.requireDoctorCredentialsValidation
                ? ValidationStatus.Pending
                : ValidationStatus.Approved,
            credentialsValidationRequestId: bytes32(0),
            authorizedAt: 0
        });

        emit DoctorProfileCreated(doctor, licenseNumber);
    }

    /**
     * @dev Autoriza um médico (após validação bem-sucedida)
     */
    function authorizeDoctor(address doctor, bool status) external onlyOwner {
        require(doctorProfiles[doctor].doctorAddress != address(0), "Doctor profile not found");

        if (status && validationConfig.requireDoctorCredentialsValidation) {
            require(
                doctorProfiles[doctor].credentialsStatus == ValidationStatus.Approved,
                "Doctor credentials must be validated first"
            );
        }

        authorizedDoctors[doctor] = status;
        if (status) {
            doctorProfiles[doctor].authorizedAt = block.timestamp;
        }

        emit DoctorAuthorized(doctor, status);
    }

    // ================================================
    // CRIAÇÃO DE PRESCRIÇÕES
    // ================================================

    /**
     * @dev Cria uma prescrição (requer autorização de médico)
     */
    function createPrescription(address patient, string memory tokenURI)
        external
        onlyAuthorizedDoctor
        returns (uint256)
    {
        uint256 newId = ++prescriptionCounter;
        _mint(patient, newId);
        _setTokenURI(newId, tokenURI);

        prescriptions[newId] = Prescription({
            doctor: msg.sender,
            patient: patient,
            isValid: true,
            metadataURI: tokenURI,
            validationStatus: validationConfig.requirePrescriptionValidation
                ? ValidationStatus.Pending
                : ValidationStatus.Approved,
            validationRequestId: bytes32(0),
            createdAt: block.timestamp
        });

        emit PrescriptionCreated(newId, msg.sender, patient);
        return newId;
    }

    // ================================================
    // QUEIMA DE PRESCRIÇÕES
    // ================================================

    /**
     * @dev Queima uma prescrição (invalida seu uso)
     */
    function burnPrescription(uint256 prescriptionId) external {
        Prescription storage p = prescriptions[prescriptionId];
        require(p.isValid, "Prescription already invalidated");
        require(msg.sender == p.patient || msg.sender == owner(), "Only patient or admin can burn");

        p.isValid = false;
        _burn(prescriptionId);
        emit PrescriptionBurned(prescriptionId);
    }

    // ================================================
    // CALLBACKS DE VALIDAÇÃO (Chainlink Functions)
    // ================================================

    /**
     * @dev Callback chamado pelo validador quando prescrição é validada
     */
    function onPrescriptionValidationResult(
        bytes32 requestId,
        uint256 prescriptionId,
        bool isValid
    ) external onlyValidatorContract {
        require(prescriptions[prescriptionId].doctor != address(0), "Prescription not found");

        ValidationStatus newStatus = isValid ? ValidationStatus.Approved : ValidationStatus.Rejected;
        prescriptions[prescriptionId].validationStatus = newStatus;
        prescriptions[prescriptionId].validationRequestId = requestId;

        emit ValidationStatusUpdated(prescriptionId, "prescription", newStatus);
    }

    /**
     * @dev Callback chamado pelo validador quando credenciais de médico são validadas
     */
    function onDoctorCredentialsValidationResult(
        bytes32 requestId,
        address doctor,
        bool isValid
    ) external onlyValidatorContract {
        require(doctorProfiles[doctor].doctorAddress != address(0), "Doctor profile not found");

        ValidationStatus newStatus = isValid ? ValidationStatus.Approved : ValidationStatus.Rejected;
        doctorProfiles[doctor].credentialsStatus = newStatus;
        doctorProfiles[doctor].credentialsValidationRequestId = requestId;

        emit DoctorCredentialsValidationUpdated(doctor, newStatus);
    }

    // ================================================
    // CONSULTAS
    // ================================================

    /**
     * @dev Retorna detalhes de uma prescrição
     */
    function getPrescription(uint256 prescriptionId)
        external
        view
        returns (Prescription memory)
    {
        return prescriptions[prescriptionId];
    }

    /**
     * @dev Retorna perfil de um médico
     */
    function getDoctorProfile(address doctor)
        external
        view
        returns (DoctorProfile memory)
    {
        return doctorProfiles[doctor];
    }

    /**
     * @dev Verifica se um médico está autorizado
     */
    function isDoctorAuthorized(address doctor) external view returns (bool) {
        return authorizedDoctors[doctor];
    }

    /**
     * @dev Retorna configuração de validação
     */
    function getValidationConfig() external view returns (ValidationConfig memory) {
        return validationConfig;
    }

    /**
     * @dev Retorna total de prescrições criadas
     */
    function getPrescriptionCounter() external view returns (uint256) {
        return prescriptionCounter;
    }
}
