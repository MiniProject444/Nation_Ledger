// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PublicDocumentChain {
    struct Document {
        string ipfsHash;
        string sector;
        uint256 timestamp;
        address uploadedBy;
    }

    mapping(string => Document) private documents;
    address private admin;

    event DocumentAdded(string indexed ipfsHash, string sector, uint256 timestamp);
    event DocumentVerified(string indexed ipfsHash, bool verified);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function addDocument(
        string memory _ipfsHash,
        string memory _sector
    ) external onlyAdmin {
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(_sector).length > 0, "Sector cannot be empty");

        documents[_ipfsHash] = Document({
            ipfsHash: _ipfsHash,
            sector: _sector,
            timestamp: block.timestamp,
            uploadedBy: msg.sender
        });

        emit DocumentAdded(_ipfsHash, _sector, block.timestamp);
    }

    function getDocument(string memory _ipfsHash) external view returns (
        string memory ipfsHash,
        string memory sector,
        uint256 timestamp,
        address uploadedBy
    ) {
        Document memory doc = documents[_ipfsHash];
        require(bytes(doc.ipfsHash).length > 0, "Document not found");
        
        return (
            doc.ipfsHash,
            doc.sector,
            doc.timestamp,
            doc.uploadedBy
        );
    }

    function verifyDocument(string memory _ipfsHash) external view returns (bool) {
        return bytes(documents[_ipfsHash].ipfsHash).length > 0;
    }
} 