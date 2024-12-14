const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    // Load ABI and address from abi.json
    let contractAddress, contractABI;
    try {
        const abiFile = JSON.parse(fs.readFileSync("./abi.json", "utf8"));
        contractAddress = abiFile.address; // Assuming `address` key in abi.json
        contractABI = abiFile.abi; // Assuming `abi` key in abi.json
        console.log("ABI and Address loaded successfully:", contractAddress);
    } catch (error) {
        console.error("Failed to load ABI file. Ensure abi.json exists and is properly formatted.", error);
        return;
    }

    // Connect to a signer
    const [signer] = await ethers.getSigners();
    console.log("Using signer:", signer.address);

    // Connect the contract with the signer
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    // Define the user details
    const user = {
        ssmNumber: "SSM-123456", // Unique SSM Number
        ssmCertificate: "SSM_CERTIFICATE_HASH", // Certificate (used as a criterion)
        companyName: "Tech Solutions Sdn Bhd",
        expertFields: ["IT", "Consulting"], // Expertise areas
        ownerName: "John Doe",
        personalDetails: {
            fullName: "Johnathan Doe",
            ICNo: "123456-78-9101",
            positionInCompany: "CEO"
        },
        isRegistered: true // This is usually set in the contract, not manually
    };

    console.log("Registering user with the following details:", user);

    try {
        // Send the transaction to register the user
        const tx = await contract.registerUser(user);
        console.log("Transaction sent. Waiting for confirmation...");
        const receipt = await tx.wait(); // Wait for the transaction to be mined
        console.log("User registered successfully! Transaction receipt:", receipt);
    } catch (error) {
        console.error("Error registering user:", error);
    }
}

// Execute the script
main().catch((error) => {
    console.error("Error in script execution:", error);
    process.exitCode = 1;
});
