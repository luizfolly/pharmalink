// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./PharmaLinkPrivacy.sol";

/**
 * @title ZamaChainlinkIntegration
 * @dev Integração de Zama FHE com Chainlink Functions
 */
contract ZamaChainlinkIntegration {
    PharmaLinkPrivacy public privacyContract;
    address public owner;

    // Mapeamento de request ID -> dados
    mapping(bytes32 => bytes) public requestResults;
    mapping(bytes32 => bool) public requestProcessed;

    event RequestSent(bytes32 indexed requestId);
    event RequestFulfilled(bytes32 indexed requestId, bytes result);
    event ValidationCompleted(uint256 indexed validationId, bool isValid);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(address _privacyContract) {
        owner = msg.sender;
        privacyContract = PharmaLinkPrivacy(_privacyContract);
    }

    /**
     * Validar prescrição via Chainlink
     */
    function validatePrescriptionChainlink(
        uint256 prescriptionId,
        string memory prescriptionData
    ) external onlyOwner returns (bytes32 requestId) {
        requestId = keccak256(abi.encodePacked(prescriptionId, prescriptionData, block.timestamp));
        emit RequestSent(requestId);
        return requestId;
    }

    /**
     * Validar medicamento via Chainlink
     */
    function validateMedicineChainlink(
        uint256 medicineId,
        string memory batchNumber
    ) external onlyOwner returns (bytes32 requestId) {
        requestId = keccak256(abi.encodePacked(medicineId, batchNumber, block.timestamp));
        emit RequestSent(requestId);
        return requestId;
    }

    /**
     * Callback do Chainlink (simulado)
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response
    ) external onlyOwner {
        requestResults[requestId] = response;
        requestProcessed[requestId] = true;
        emit RequestFulfilled(requestId, response);
    }

    /**
     * Armazenar resultado validado
     */
    function storeValidatedResult(
        uint256 validationId,
        bytes32 requestId,
        bytes calldata encryptedData
    ) external onlyOwner {
        require(requestProcessed[requestId], "Request not processed");

        privacyContract.storeEncryptedValidation(validationId, requestId, encryptedData);
        emit ValidationCompleted(validationId, true);
    }

    /**
     * Script de validação de prescrição
     */
    function _buildValidationScript(
        string memory prescriptionData
    ) private pure returns (string memory) {
        return string(
            abi.encodePacked(
                "const prescription = '",
                prescriptionData,
                "'; ",
                "const response = await Functions.makeHttpRequest({ ",
                "url: 'https://api.pharmalink.example/validate-prescription', ",
                "method: 'POST', ",
                "data: { prescription: prescription } ",
                "}); ",
                "if (response.error) { throw Error('API Error'); } ",
                "return Functions.encodeString(JSON.stringify(response.data));"
            )
        );
    }

    /**
     * Script de validação de medicamento
     */
    function _buildMedicineValidationScript(
        string memory batchNumber
    ) private pure returns (string memory) {
        return string(
            abi.encodePacked(
                "const batch = '",
                batchNumber,
                "'; ",
                "const response = await Functions.makeHttpRequest({ ",
                "url: 'https://api.pharmalink.example/validate-medicine', ",
                "method: 'POST', ",
                "data: { batchNumber: batch } ",
                "}); ",
                "if (response.error) { throw Error('API Error'); } ",
                "return Functions.encodeString(JSON.stringify(response.data));"
            )
        );
    }
}
