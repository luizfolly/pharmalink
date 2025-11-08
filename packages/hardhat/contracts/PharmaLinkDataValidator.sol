// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ChainlinkFunctionsConsumer.sol";

/**
 * @title PharmaLinkDataValidator
 * @dev Camada específica de validação de dados para Pharmalink
 * Integra Chainlink Functions para validar prescrições, medicamentos e credenciais
 */
contract PharmaLinkDataValidator is ChainlinkFunctionsConsumer {
    // ================================================
    // TIPOS E ESTRUTURAS
    // ================================================

    enum ValidationType {
        PrescriptionValidation,
        MedicineAuthenticity,
        DoctorCredentials,
        BatchExpiration,
        TemperatureCompliance
    }

    struct ValidationRequest {
        bytes32 requestId;
        address requester;
        ValidationType validationType;
        address targetContract;
        uint256 targetId;
        bool isValid;
        string validationData;
    }

    struct ValidationResult {
        bool isApproved;
        string reason;
        uint256 timestamp;
    }

    // ================================================
    // ESTADO
    // ================================================

    mapping(bytes32 => ValidationRequest) public validationRequests;
    mapping(address => mapping(uint256 => ValidationResult)) public validationResults;

    address public prescriptionContract;
    address public supplyChainContract;

    uint256 public validationCounter;

    // ================================================
    // EVENTOS
    // ================================================

    event ValidationRequested(
        bytes32 indexed requestId,
        ValidationType validationType,
        address indexed targetContract,
        uint256 indexed targetId
    );

    event ValidationCompleted(
        bytes32 indexed requestId,
        ValidationType validationType,
        bool isValid,
        string validationData
    );

    event ContractAddressUpdated(string contractType, address indexed newAddress);

    // ================================================
    // MODIFICADORES
    // ================================================

    modifier onlyValidationType(ValidationType vType) {
        require(uint256(vType) <= 4, "Invalid validation type");
        _;
    }

    // ================================================
    // CONSTRUTOR
    // ================================================

    constructor(
        address router,
        uint64 subscriptionId,
        uint32 gasLimit,
        bytes32 donId,
        address _prescriptionContract,
        address _supplyChainContract
    )
        ChainlinkFunctionsConsumer(
            router,
            subscriptionId,
            gasLimit,
            donId,
            _getDefaultSourceCode()
        )
    {
        prescriptionContract = _prescriptionContract;
        supplyChainContract = _supplyChainContract;
    }

    // ================================================
    // FUNÇÕES EXTERNAS - VALIDAÇÃO
    // ================================================

    /**
     * @dev Valida uma prescrição consultando dados externos
     * @param prescriptionId ID da prescrição
     * @param doctorAddress Endereço do médico
     * @param patientAddress Endereço do paciente
     * @return requestId ID da requisição Chainlink
     */
    function validatePrescription(
        uint256 prescriptionId,
        address doctorAddress,
        address patientAddress
    ) external returns (bytes32) {
        string[] memory args = new string[](3);
        args[0] = _addressToString(doctorAddress);
        args[1] = _addressToString(patientAddress);
        args[2] = _uint256ToString(prescriptionId);

        bytes32 requestId = _sendRequest(args);

        validationRequests[requestId] = ValidationRequest({
            requestId: requestId,
            requester: msg.sender,
            validationType: ValidationType.PrescriptionValidation,
            targetContract: prescriptionContract,
            targetId: prescriptionId,
            isValid: false,
            validationData: ""
        });

        emit ValidationRequested(
            requestId,
            ValidationType.PrescriptionValidation,
            prescriptionContract,
            prescriptionId
        );

        validationCounter++;
        return requestId;
    }

    /**
     * @dev Valida autenticidade de um medicamento
     * @param medicineId ID do medicamento
     * @param batchNumber Número do lote
     * @param manufacturerAddress Endereço do fabricante
     * @return requestId ID da requisição Chainlink
     */
    function validateMedicineAuthenticity(
        uint256 medicineId,
        string memory batchNumber,
        address manufacturerAddress
    ) external returns (bytes32) {
        string[] memory args = new string[](3);
        args[0] = _uint256ToString(medicineId);
        args[1] = batchNumber;
        args[2] = _addressToString(manufacturerAddress);

        bytes32 requestId = _sendRequest(args);

        validationRequests[requestId] = ValidationRequest({
            requestId: requestId,
            requester: msg.sender,
            validationType: ValidationType.MedicineAuthenticity,
            targetContract: supplyChainContract,
            targetId: medicineId,
            isValid: false,
            validationData: batchNumber
        });

        emit ValidationRequested(
            requestId,
            ValidationType.MedicineAuthenticity,
            supplyChainContract,
            medicineId
        );

        validationCounter++;
        return requestId;
    }

    /**
     * @dev Valida credenciais de um médico
     * @param doctorAddress Endereço do médico
     * @param licenseNumber Número da licença
     * @return requestId ID da requisição Chainlink
     */
    function validateDoctorCredentials(address doctorAddress, string memory licenseNumber)
        external
        returns (bytes32)
    {
        string[] memory args = new string[](2);
        args[0] = _addressToString(doctorAddress);
        args[1] = licenseNumber;

        bytes32 requestId = _sendRequest(args);

        validationRequests[requestId] = ValidationRequest({
            requestId: requestId,
            requester: msg.sender,
            validationType: ValidationType.DoctorCredentials,
            targetContract: prescriptionContract,
            targetId: 0,
            isValid: false,
            validationData: licenseNumber
        });

        emit ValidationRequested(
            requestId,
            ValidationType.DoctorCredentials,
            prescriptionContract,
            0
        );

        validationCounter++;
        return requestId;
    }

    /**
     * @dev Valida expiração de um lote de medicamento
     * @param medicineId ID do medicamento
     * @param batchNumber Número do lote
     * @param expirationDate Data de expiração (timestamp)
     * @return requestId ID da requisição Chainlink
     */
    function validateBatchExpiration(
        uint256 medicineId,
        string memory batchNumber,
        uint256 expirationDate
    ) external returns (bytes32) {
        string[] memory args = new string[](3);
        args[0] = _uint256ToString(medicineId);
        args[1] = batchNumber;
        args[2] = _uint256ToString(expirationDate);

        bytes32 requestId = _sendRequest(args);

        validationRequests[requestId] = ValidationRequest({
            requestId: requestId,
            requester: msg.sender,
            validationType: ValidationType.BatchExpiration,
            targetContract: supplyChainContract,
            targetId: medicineId,
            isValid: false,
            validationData: batchNumber
        });

        emit ValidationRequested(
            requestId,
            ValidationType.BatchExpiration,
            supplyChainContract,
            medicineId
        );

        validationCounter++;
        return requestId;
    }

    /**
     * @dev Valida conformidade de temperatura durante transporte
     * @param medicineId ID do medicamento
     * @param minTemp Temperatura mínima permitida
     * @param maxTemp Temperatura máxima permitida
     * @return requestId ID da requisição Chainlink
     */
    function validateTemperatureCompliance(
        uint256 medicineId,
        int256 minTemp,
        int256 maxTemp
    ) external returns (bytes32) {
        string[] memory args = new string[](3);
        args[0] = _uint256ToString(medicineId);
        args[1] = _int256ToString(minTemp);
        args[2] = _int256ToString(maxTemp);

        bytes32 requestId = _sendRequest(args);

        validationRequests[requestId] = ValidationRequest({
            requestId: requestId,
            requester: msg.sender,
            validationType: ValidationType.TemperatureCompliance,
            targetContract: supplyChainContract,
            targetId: medicineId,
            isValid: false,
            validationData: ""
        });

        emit ValidationRequested(
            requestId,
            ValidationType.TemperatureCompliance,
            supplyChainContract,
            medicineId
        );

        validationCounter++;
        return requestId;
    }

    // ================================================
    // FUNÇÕES INTERNAS - CALLBACKS
    // ================================================

    /**
     * @dev Processa resposta bem-sucedida de validação
     */
    function _handleRequestFulfilled(bytes32 requestId, bytes memory response)
        internal
        override
    {
        ValidationRequest storage valReq = validationRequests[requestId];
        require(valReq.requester != address(0), "Validation request not found");

        // Decodifica a resposta (esperamos um boolean)
        bool isValid = abi.decode(response, (bool));
        valReq.isValid = isValid;

        validationResults[valReq.targetContract][valReq.targetId] = ValidationResult({
            isApproved: isValid,
            reason: "Validation completed successfully",
            timestamp: block.timestamp
        });

        emit ValidationCompleted(requestId, valReq.validationType, isValid, "");
    }

    /**
     * @dev Processa falha na validação
     */
    function _handleRequestFailed(bytes32 requestId, string memory errorMessage)
        internal
        override
    {
        ValidationRequest storage valReq = validationRequests[requestId];
        require(valReq.requester != address(0), "Validation request not found");

        valReq.isValid = false;

        validationResults[valReq.targetContract][valReq.targetId] = ValidationResult({
            isApproved: false,
            reason: errorMessage,
            timestamp: block.timestamp
        });

        emit ValidationCompleted(requestId, valReq.validationType, false, errorMessage);
    }

    // ================================================
    // FUNÇÕES EXTERNAS - CONFIGURAÇÃO
    // ================================================

    /**
     * @dev Atualiza endereço do contrato de prescrições
     */
    function setPrescriptionContract(address newAddress) external {
        require(newAddress != address(0), "Invalid address");
        prescriptionContract = newAddress;
        emit ContractAddressUpdated("PrescriptionContract", newAddress);
    }

    /**
     * @dev Atualiza endereço do contrato de supply chain
     */
    function setSupplyChainContract(address newAddress) external {
        require(newAddress != address(0), "Invalid address");
        supplyChainContract = newAddress;
        emit ContractAddressUpdated("SupplyChainContract", newAddress);
    }

    // ================================================
    // FUNÇÕES DE CONSULTA
    // ================================================

    /**
     * @dev Retorna resultado de validação
     */
    function getValidationResult(address targetContract, uint256 targetId)
        external
        view
        returns (ValidationResult memory)
    {
        return validationResults[targetContract][targetId];
    }

    /**
     * @dev Retorna detalhes de uma requisição de validação
     */
    function getValidationRequest(bytes32 requestId)
        external
        view
        returns (ValidationRequest memory)
    {
        return validationRequests[requestId];
    }

    /**
     * @dev Retorna total de validações realizadas
     */
    function getValidationCounter() external view returns (uint256) {
        return validationCounter;
    }

    // ================================================
    // FUNÇÕES UTILITÁRIAS INTERNAS
    // ================================================

    function _getDefaultSourceCode() internal pure returns (string memory) {
        return
            "const validationData = args[0];"
            "const result = validationData !== 'invalid';"
            "return Functions.encodeUint256(result ? 1 : 0);";
    }

    function _addressToString(address addr) internal pure returns (string memory) {
        bytes memory addrBytes = abi.encodePacked(addr);
        bytes memory hexChars = "0123456789abcdef";
        bytes memory result = new bytes(42);
        result[0] = "0";
        result[1] = "x";

        for (uint256 i = 0; i < 20; i++) {
            uint8 value = uint8(addrBytes[i]);
            result[2 + i * 2] = hexChars[value >> 4];
            result[3 + i * 2] = hexChars[value & 0x0f];
        }

        return string(result);
    }

    function _uint256ToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }

        uint256 temp = value;
        uint256 digits;

        while (temp != 0) {
            digits++;
            temp /= 10;
        }

        bytes memory result = new bytes(digits);
        temp = value;

        while (temp != 0) {
            digits -= 1;
            result[digits] = bytes1(uint8(48 + (temp % 10)));
            temp /= 10;
        }

        return string(result);
    }

    function _int256ToString(int256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }

        bool negative = value < 0;
        uint256 absValue = negative ? uint256(-value) : uint256(value);

        string memory absStr = _uint256ToString(absValue);

        if (negative) {
            return string(abi.encodePacked("-", absStr));
        }

        return absStr;
    }
}
