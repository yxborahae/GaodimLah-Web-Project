const { ethers } = require("hardhat");
const fs = require("fs");

async function loadContract() {
    const abiFile = JSON.parse(fs.readFileSync("./abi.json", "utf8"));
    const [signer] = await ethers.getSigners();
    return new ethers.Contract(abiFile.address, abiFile.abi, signer);
}

async function registerUser(user) {
    const contract = await loadContract();
    const tx = await contract.registerUser(user);
    await tx.wait();
    console.log("User registered successfully!");
}

// Export the function for reuse
module.exports = { registerUser };