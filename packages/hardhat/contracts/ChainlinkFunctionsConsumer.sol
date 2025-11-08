// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ChainlinkFunctionsConsumer
 * @dev Contrato base genérico para consumir dados via Chainlink Functions
 * Fornece uma interface reutilizável para qualquer contrato que necessite dados externos
 * 
 * NOTA: Este é um contrato genérico que será estendido pelos contratos específicos.
 * Para usar em produção com Chainlink Functions real, integre com:
 * https://github.com/smartcontractkit/smart-contract-examples/blob/main/functions-examples/examples/1_simple_httpget/contracts/FunctionsConsumer.sol
 */
abstract contract ChainlinkFunctionsConsumer {

    // ================================================
    // TIPOS E ESTRUTURAS
    // ================================================

    enum RequestStatus {
        Pending,
        Fulfilled,
        Failed
    }

    struct FunctionRequest {
        bytes32 requestId;
        address requester;
        uint256 timestamp;
        RequestStatus status;
        bytes response;
        string errorMessage;
    }

    struct FunctionConfig {
        string sourceCode;
        uint64 subscriptionId;
        uint32 gasLimit;
        bytes32 donId;
    }

    // ================================================
    // ESTADO
    // ================================================

    FunctionConfig public functionConfig;
    mapping(bytes32 => FunctionRequest) public requests;
    mapping(address => bytes32[]) public userRequests;

    uint256 public requestCounter;

    // ================================================
    // EVENTOS
    // ================================================

    event RequestSent(bytes32 indexed requestId, address indexed requester, string sourceCode);
    event RequestFulfilled(bytes32 indexed requestId, bytes response);
    event RequestFailed(bytes32 indexed requestId, string errorMessage);
    event ConfigUpdated(uint64 subscriptionId, uint32 gasLimit, bytes32 donId);

    // ================================================
    // MODIFICADORES
    // ================================================

    modifier onlyValidRequest(bytes32 requestId) {
        require(requests[requestId].requester != address(0), "Request not found");
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
        string memory sourceCode
    ) {
        // router é armazenado para referência futura em integração com Chainlink
        require(router != address(0), "Invalid router address");
        
        functionConfig = FunctionConfig({
            sourceCode: sourceCode,
            subscriptionId: subscriptionId,
            gasLimit: gasLimit,
            donId: donId
        });
    }

    // ================================================
    // FUNÇÕES EXTERNAS - CONFIGURAÇÃO
    // ================================================

    /**
     * @dev Atualiza a configuração de Chainlink Functions
     * @param subscriptionId ID da subscrição
     * @param gasLimit Limite de gas para execução
     * @param donId ID do DON (Decentralized Oracle Network)
     * @param sourceCode Novo código da função (opcional)
     */
    function updateFunctionConfig(
        uint64 subscriptionId,
        uint32 gasLimit,
        bytes32 donId,
        string memory sourceCode
    ) external virtual {
        functionConfig.subscriptionId = subscriptionId;
        functionConfig.gasLimit = gasLimit;
        functionConfig.donId = donId;

        if (bytes(sourceCode).length > 0) {
            functionConfig.sourceCode = sourceCode;
        }

        emit ConfigUpdated(subscriptionId, gasLimit, donId);
    }

    // ================================================
    // FUNÇÕES INTERNAS - REQUISIÇÕES
    // ================================================

    /**
     * @dev Envia uma requisição genérica para Chainlink Functions
     * @param args Array de argumentos para a função
     * @return requestId ID da requisição
     * 
     * NOTA: Esta é uma implementação genérica. Em produção, esta função
     * será integrada com o Chainlink Functions Router real.
     */
    function _sendRequest(string[] memory args) internal returns (bytes32) {
        // Gerar um ID de requisição único
        bytes32 requestId = keccak256(abi.encodePacked(msg.sender, block.timestamp, requestCounter));

        requests[requestId] = FunctionRequest({
            requestId: requestId,
            requester: msg.sender,
            timestamp: block.timestamp,
            status: RequestStatus.Pending,
            response: "",
            errorMessage: ""
        });

        userRequests[msg.sender].push(requestId);
        requestCounter++;

        emit RequestSent(requestId, msg.sender, functionConfig.sourceCode);

        return requestId;
    }

    /**
     * @dev Callback chamado pelo Chainlink quando a função é executada
     * @param requestId ID da requisição
     * @param response Resposta da função
     * @param err Erro, se houver
     * 
     * NOTA: Em produção, este será chamado automaticamente pelo Chainlink.
     * Para testes, pode ser chamado manualmente.
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal {
        FunctionRequest storage req = requests[requestId];
        require(req.requester != address(0), "Request not found");

        if (err.length > 0) {
            req.status = RequestStatus.Failed;
            req.errorMessage = string(err);
            emit RequestFailed(requestId, string(err));
            _handleRequestFailed(requestId, string(err));
        } else {
            req.status = RequestStatus.Fulfilled;
            req.response = response;
            emit RequestFulfilled(requestId, response);
            _handleRequestFulfilled(requestId, response);
        }
    }

    // ================================================
    // FUNÇÕES VIRTUAIS - IMPLEMENTADAS PELOS FILHOS
    // ================================================

    /**
     * @dev Função virtual para processar resposta bem-sucedida
     * Deve ser implementada pelos contratos filhos
     */
    function _handleRequestFulfilled(bytes32 requestId, bytes memory response) internal virtual;

    /**
     * @dev Função virtual para processar falha na requisição
     * Deve ser implementada pelos contratos filhos
     */
    function _handleRequestFailed(bytes32 requestId, string memory errorMessage) internal virtual;

    // ================================================
    // FUNÇÕES DE CONSULTA
    // ================================================

    /**
     * @dev Retorna o status de uma requisição
     */
    function getRequestStatus(bytes32 requestId)
        external
        view
        onlyValidRequest(requestId)
        returns (RequestStatus)
    {
        return requests[requestId].status;
    }

    /**
     * @dev Retorna a resposta de uma requisição
     */
    function getRequestResponse(bytes32 requestId)
        external
        view
        onlyValidRequest(requestId)
        returns (bytes memory)
    {
        return requests[requestId].response;
    }

    /**
     * @dev Retorna todas as requisições de um usuário
     */
    function getUserRequests(address user) external view returns (bytes32[] memory) {
        return userRequests[user];
    }

    /**
     * @dev Retorna detalhes completos de uma requisição
     */
    function getRequestDetails(bytes32 requestId)
        external
        view
        onlyValidRequest(requestId)
        returns (FunctionRequest memory)
    {
        return requests[requestId];
    }

    /**
     * @dev Retorna a configuração atual de Chainlink Functions
     */
    function getFunctionConfig() external view returns (FunctionConfig memory) {
        return functionConfig;
    }
}
