// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PharmaLinkPrescription
 * @dev Transforme prescrições médicas em NFTs verificáveis.
 */
contract PharmaLinkPrescription is ERC721URIStorage, Ownable {
    uint256 public prescriptionCounter;

    struct Prescription {
        address doctor;
        address patient;
        bool isValid;
        string metadataURI;
    }

    mapping(uint256 => Prescription) public prescriptions;
    mapping(address => bool) public authorizedDoctors;

    event DoctorAuthorized(address indexed doctor, bool authorized);
    event PrescriptionCreated(uint256 indexed id, address indexed doctor, address indexed patient);
    event PrescriptionBurned(uint256 indexed id);

    // ✅ Construtor ajustado
    constructor() ERC721("PharmaLinkPrescription", "pNFT") {
        // O owner já é msg.sender automaticamente
    }

    // ------------------------------------------------
    // ADMIN FUNCTIONS
    // ------------------------------------------------
    function authorizeDoctor(address doctor, bool status) external onlyOwner {
        authorizedDoctors[doctor] = status;
        emit DoctorAuthorized(doctor, status);
    }

    // ------------------------------------------------
    // DOCTOR ACTIONS
    // ------------------------------------------------
    function createPrescription(address patient, string memory tokenURI) external returns (uint256) {
        require(authorizedDoctors[msg.sender], "Not an authorized doctor");

        uint256 newId = ++prescriptionCounter;
        _mint(patient, newId);
        _setTokenURI(newId, tokenURI);

        prescriptions[newId] = Prescription({
            doctor: msg.sender,
            patient: patient,
            isValid: true,
            metadataURI: tokenURI
        });

        emit PrescriptionCreated(newId, msg.sender, patient);
        return newId;
    }

    // ------------------------------------------------
    // PATIENT / PHARMACY ACTIONS
    // ------------------------------------------------
    function burnPrescription(uint256 prescriptionId) external {
        Prescription storage p = prescriptions[prescriptionId];
        require(p.isValid, "Prescription already invalidated");
        require(msg.sender == p.patient || msg.sender == owner(), "Only patient or admin can burn");

        p.isValid = false;
        _burn(prescriptionId);
        emit PrescriptionBurned(prescriptionId);
    }
}
