// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PharmaLinkSupplyChain
 * @dev Complete supply chain tracking, order management, and transport monitoring for medicines
 */
contract PharmaLinkSupplyChain is Ownable {
    uint256 public medicineCounter;
    uint256 public orderCounter;

    enum Status {
        Produced,
        InTransit,
        Delivered,
        Sold
    }

    enum OrderStatus {
        Requested,
        Approved,
        Rejected,
        Shipped,
        Completed
    }

    struct Medicine {
        uint256 id;
        string name;
        string batchNumber;
        string metadataURI;
        string producerName;
        uint256 expirationDate;
        address manufacturer;
        address distributor;
        address pharmacy;
        Status status;
    }

    struct Order {
        uint256 id;
        uint256 medicineId;
        uint256 quantity;
        address requester;
        address supplier;
        OrderStatus status;
    }

    struct TrackingEvent {
        uint256 timestamp;
        address recordedBy;
        string location;
        string temperature;
        string humidity;
        string remarks;
        Status status;
    }

    // ------------------------------------------------
    // MAPEAMENTOS
    // ------------------------------------------------
    mapping(address => bool) public authorizedPharmaceuticals;
    mapping(address => bool) public authorizedDistributors;
    mapping(address => bool) public authorizedPharmacies;

    mapping(uint256 => Medicine) public medicines;
    mapping(uint256 => Order) public orders;

    mapping(address => uint256[]) public manufacturerInventory;
    mapping(address => uint256[]) public pharmacyOrders;
    mapping(address => uint256[]) public distributorOrders;

    // 🔍 Histórico de rastreamento por medicamento
    mapping(uint256 => TrackingEvent[]) private medicineTracking;

    // ------------------------------------------------
    // EVENTOS
    // ------------------------------------------------
    event PharmaceuticalAuthorized(address indexed pharma);
    event DistributorAuthorized(address indexed distributor);
    event PharmacyAuthorized(address indexed pharmacy);
    event AuthorizationRevoked(address indexed account, string role);

    event MedicineCreated(uint256 indexed id, string name, string batch, address indexed manufacturer);
    event MedicineTransferred(uint256 indexed id, address indexed from, address indexed to, Status newStatus);

    event OrderCreated(uint256 indexed id, address indexed requester, address indexed supplier);
    event OrderUpdated(uint256 indexed id, OrderStatus status);

    event TrackingEventAdded(
        uint256 indexed medicineId,
        string location,
        string temperature,
        string humidity,
        string remarks,
        address indexed recordedBy,
        uint256 timestamp
    );

    // ------------------------------------------------
    // CONSTRUTOR
    // ------------------------------------------------
    constructor() {}

    // ------------------------------------------------
    // AUTORIZAÇÕES
    // ------------------------------------------------
    function authorizePharmaceutical(address pharma) external onlyOwner {
        authorizedPharmaceuticals[pharma] = true;
        emit PharmaceuticalAuthorized(pharma);
    }

    function authorizeDistributor(address distributor) external onlyOwner {
        authorizedDistributors[distributor] = true;
        emit DistributorAuthorized(distributor);
    }

    function authorizePharmacy(address pharmacy) external onlyOwner {
        authorizedPharmacies[pharmacy] = true;
        emit PharmacyAuthorized(pharmacy);
    }

    function revokeAuthorization(address account, string memory role) external onlyOwner {
        if (keccak256(bytes(role)) == keccak256("pharma")) {
            authorizedPharmaceuticals[account] = false;
        } else if (keccak256(bytes(role)) == keccak256("distributor")) {
            authorizedDistributors[account] = false;
        } else if (keccak256(bytes(role)) == keccak256("pharmacy")) {
            authorizedPharmacies[account] = false;
        } else {
            revert("Invalid role");
        }
        emit AuthorizationRevoked(account, role);
    }

    // ------------------------------------------------
    // PRODUÇÃO DE MEDICAMENTOS
    // ------------------------------------------------
    function createMedicine(
        string memory name,
        string memory batchNumber,
        string memory metadataURI,
        string memory producerName,
        uint256 expirationDate
    ) external returns (uint256) {
        require(authorizedPharmaceuticals[msg.sender], "Not authorized pharmaceutical");

        uint256 newId = ++medicineCounter;

        medicines[newId] = Medicine({
            id: newId,
            name: name,
            batchNumber: batchNumber,
            metadataURI: metadataURI,
            producerName: producerName,
            expirationDate: expirationDate,
            manufacturer: msg.sender,
            distributor: address(0),
            pharmacy: address(0),
            status: Status.Produced
        });

        manufacturerInventory[msg.sender].push(newId);

        emit MedicineCreated(newId, name, batchNumber, msg.sender);
        return newId;
    }

    // ------------------------------------------------
    // PEDIDOS
    // ------------------------------------------------
    function createPharmacyOrder(uint256 medicineId, uint256 quantity, address distributor) external returns (uint256) {
        require(authorizedPharmacies[msg.sender], "Only pharmacies can order");
        require(authorizedDistributors[distributor], "Invalid distributor");

        uint256 newOrderId = ++orderCounter;
        orders[newOrderId] = Order({
            id: newOrderId,
            medicineId: medicineId,
            quantity: quantity,
            requester: msg.sender,
            supplier: distributor,
            status: OrderStatus.Requested
        });

        pharmacyOrders[msg.sender].push(newOrderId);
        emit OrderCreated(newOrderId, msg.sender, distributor);
        return newOrderId;
    }

    function createDistributorOrder(uint256 medicineId, uint256 quantity, address manufacturer) external returns (uint256) {
        require(authorizedDistributors[msg.sender], "Only distributors can order");
        require(authorizedPharmaceuticals[manufacturer], "Invalid manufacturer");

        uint256 newOrderId = ++orderCounter;
        orders[newOrderId] = Order({
            id: newOrderId,
            medicineId: medicineId,
            quantity: quantity,
            requester: msg.sender,
            supplier: manufacturer,
            status: OrderStatus.Requested
        });

        distributorOrders[msg.sender].push(newOrderId);
        emit OrderCreated(newOrderId, msg.sender, manufacturer);
        return newOrderId;
    }

    function updateOrderStatus(uint256 orderId, OrderStatus newStatus) external {
        Order storage order = orders[orderId];
        require(order.id != 0, "Order not found");
        require(msg.sender == order.supplier, "Only supplier can update");

        order.status = newStatus;
        emit OrderUpdated(orderId, newStatus);
    }

    // ------------------------------------------------
    // RASTREAMENTO DE TRANSPORTE
    // ------------------------------------------------
    function addTrackingEvent(
        uint256 medicineId,
        string memory location,
        string memory temperature,
        string memory humidity,
        string memory remarks,
        Status status
    ) external {
        Medicine storage med = medicines[medicineId];
        require(
            msg.sender == med.manufacturer || msg.sender == med.distributor || msg.sender == med.pharmacy,
            "Not authorized to record tracking"
        );

        TrackingEvent memory eventData = TrackingEvent({
            timestamp: block.timestamp,
            recordedBy: msg.sender,
            location: location,
            temperature: temperature,
            humidity: humidity,
            remarks: remarks,
            status: status
        });

        medicineTracking[medicineId].push(eventData);

        emit TrackingEventAdded(medicineId, location, temperature, humidity, remarks, msg.sender, block.timestamp);
    }

    function getTrackingHistory(uint256 medicineId) external view returns (TrackingEvent[] memory) {
        return medicineTracking[medicineId];
    }

    // ------------------------------------------------
    // TRANSFERÊNCIAS
    // ------------------------------------------------
    function transferToDistributor(uint256 medicineId, address distributor) external {
        Medicine storage med = medicines[medicineId];
        require(msg.sender == med.manufacturer, "Only manufacturer can transfer");
        med.distributor = distributor;
        med.status = Status.InTransit;
        emit MedicineTransferred(medicineId, msg.sender, distributor, Status.InTransit);
    }

    function transferToPharmacy(uint256 medicineId, address pharmacy) external {
        Medicine storage med = medicines[medicineId];
        require(msg.sender == med.distributor, "Only distributor can transfer");
        med.pharmacy = pharmacy;
        med.status = Status.Delivered;
        emit MedicineTransferred(medicineId, msg.sender, pharmacy, Status.Delivered);
    }

    function markAsSold(uint256 medicineId) external {
        Medicine storage med = medicines[medicineId];
        require(msg.sender == med.pharmacy, "Only pharmacy can mark as sold");
        med.status = Status.Sold;
        emit MedicineTransferred(medicineId, msg.sender, address(0), Status.Sold);
    }

    // ------------------------------------------------
    // CONSULTAS
    // ------------------------------------------------
    function getMedicine(uint256 id) external view returns (Medicine memory) {
        return medicines[id];
    }

    function getOrder(uint256 id) external view returns (Order memory) {
        return orders[id];
    }

    function getOrdersByPharmacy(address pharmacy) external view returns (uint256[] memory) {
        return pharmacyOrders[pharmacy];
    }

    function getOrdersByDistributor(address distributor) external view returns (uint256[] memory) {
        return distributorOrders[distributor];
    }
}