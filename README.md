# 🛡️ NationLedger – Hybrid Blockchain Platform for Government Transparency

**NationLedger** is a secure, blockchain-based platform built to enhance **government budget allocation transparency** while ensuring the **confidentiality of sensitive data**. Using a **hybrid blockchain architecture**, NationLedger stores classified documents on a **private Ethereum network** and publicly-accessible documents on a **public blockchain**, offering fine-grained access control for different types of users.

> Built as a major semester project by Aayush Jadhav in 3rd year of Computer Engineering with a specialization in Blockchain, Cybersecurity, and IoT.

---

## 📄 Abstract

Government sectors often struggle with transparency, document authenticity, and controlled access to sensitive data. **NationLedger** addresses these challenges by combining **blockchain immutability** with **role-based access**. Government employees and admins can upload classified or declassified documents, while the public can verify and view declassified data. All records are **tamper-proof**, **verifiable**, and **secure**.

---

## 🚦 User Roles & Access Control

|         Role            |                          Capabilities                                     |
|-------------------------|---------------------------------------------------------------------------|
| **Main Admin**          | Full control – creates employee credentials, uploads files, grants access |
| **Government Employee** | Can log in, upload/view documents (classified or declassified)            |
| **General Public**      | Can view and verify only declassified documents on the public blockchain  | 

---

## ⚙️ Features

- 🔐 **Hybrid Blockchain Model**:
  - **Private Ethereum Blockchain**: For classified internal government documents
  - **Public Ethereum Blockchain**: For transparent, declassified budget documents
- 📁 Document Upload System: Choose visibility (Classified or Declassified)
- 🧑‍💼 Admin Dashboard: Create user credentials, manage roles
- 🗂️ Role-based document access with MongoDB-backed authentication
- ✅ Document Verification System for authenticity and integrity
- 🧾 Audit Trail & Data Integrity via blockchain logs
- 🌐 React Frontend for all user roles (Admin, Employee, Public)

---

## 💡 Tech Stack

|         Component           |              Technology                  |
|-----------------------------|------------------------------------------|
| **Frontend**                | React 18, Tailwind CSS, TypeScript       |
| **Blockchain (Private)**    | Ethereum (Ganache / Hardhat)             |
| **Blockchain (Public)**     | Ethereum Testnet (e.g., Goerli)          |
| **Smart Contracts**         | Solidity                                 |
| **Backend Integration**     | Web3.js / Ethers.js                      |
| **Database**                | MongoDB Atlas (Cloud)                    |
| **File Storage (Optional)** | IPFS via Pinata for larger files         |
| **Authentication**          | Admin-generated credentials linked to DB |

---

## 🔐 Access Control & Data Flow Diagram

```text
[Admin]
   |
   |-- Generates Employee Credential → MongoDB
   |
   |-- Uploads Document → Classify: Private (internal) or Public (external)
   |
[Employee]
   |
   |-- Logs in → Views/Uploads Docs (Classified or Declassified)
   |
[Public]
   |
   |-- Views Public Docs → Verifies Document via Public Ethereum Hash
