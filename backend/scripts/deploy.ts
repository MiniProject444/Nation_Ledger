import { ethers } from "hardhat";

async function main() {
  // Deploy PrivateDocumentChain
  const PrivateDocumentChain = await ethers.getContractFactory("PrivateDocumentChain");
  const privateChain = await PrivateDocumentChain.deploy();
  await privateChain.deployed();
  console.log("PrivateDocumentChain deployed to:", privateChain.address);

  // Deploy PublicDocumentChain
  const PublicDocumentChain = await ethers.getContractFactory("PublicDocumentChain");
  const publicChain = await PublicDocumentChain.deploy();
  await publicChain.deployed();
  console.log("PublicDocumentChain deployed to:", publicChain.address);

  // Save the addresses to a file for later use
  const fs = require("fs");
  const addresses = {
    privateChain: privateChain.address,
    publicChain: publicChain.address,
  };
  fs.writeFileSync(
    "contract-addresses.json",
    JSON.stringify(addresses, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 