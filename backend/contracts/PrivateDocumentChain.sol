// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PrivateDocumentChain {
    struct Document {
        string ipfsHash;
        string sector;
        bool isClassified;
        uint256 timestamp;
        address uploadedBy;
    }

    mapping(string => Document) private documents;
    mapping(address => bool) private authorizedUsers;
    address private admin;

    event DocumentAdded(string indexed ipfsHash, string sector, bool isClassified, uint256 timestamp);
    event UserAuthorized(address indexed user);
    event UserRevoked(address indexed user);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedUsers[msg.sender] || msg.sender == admin, "Not authorized");
        _;
    }

    constructor() {
        admin = msg.sender;
        authorizedUsers[msg.sender] = true;
    }

    function addDocument(
        string memory _ipfsHash,
        string memory _sector,
        bool _isClassified
    ) external onlyAuthorized {
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(_sector).length > 0, "Sector cannot be empty");

        documents[_ipfsHash] = Document({
            ipfsHash: _ipfsHash,
            sector: _sector,
            isClassified: _isClassified,
            timestamp: block.timestamp,
            uploadedBy: msg.sender
        });

        emit DocumentAdded(_ipfsHash, _sector, _isClassified, block.timestamp);
    }

    function getDocument(string memory _ipfsHash) external view onlyAuthorized returns (
        string memory ipfsHash,
        string memory sector,
        bool isClassified,
        uint256 timestamp,
        address uploadedBy
    ) {
        Document memory doc = documents[_ipfsHash];
        require(bytes(doc.ipfsHash).length > 0, "Document not found");
        
        return (
            doc.ipfsHash,
            doc.sector,
            doc.isClassified,
            doc.timestamp,
            doc.uploadedBy
        );
    }

    function authorizeUser(address _user) external onlyAdmin {
        require(_user != address(0), "Invalid address");
        authorizedUsers[_user] = true;
        emit UserAuthorized(_user);
    }

    function revokeUser(address _user) external onlyAdmin {
        require(_user != address(0), "Invalid address");
        authorizedUsers[_user] = false;
        emit UserRevoked(_user);
    }

    function isAuthorized(address _user) external view returns (bool) {
        return authorizedUsers[_user] || _user == admin;
    }
} 