
document.addEventListener("DOMContentLoaded", async () => {
    const connectWalletButton = document.getElementById("connect-wallet");
    const testContractButton = document.getElementById("test-smart-contract");
    const contractResult = document.getElementById("contract-result");

    let provider;
    let signer;
    let contractAddress;
    let contractABI;

    // Load ABI and address from abi.json
    try {
        const response = await fetch("./abi.json");
        if (!response.ok) {
            throw new Error("Failed to load ABI file.");
        }
        const contractData = await response.json();
        contractAddress = contractData.address;
        contractABI = contractData.abi;
        console.log("Contract data loaded successfully:", contractData);
    } catch (error) {
        console.error("Error loading ABI file:", error);
        contractResult.textContent = "Error loading ABI file. Check console for details.";
        return; // Prevent further execution if ABI can't be loaded
    }

    connectWalletButton.addEventListener("click", async () => {
        try {
            if (window.ethereum) {
                // Request connection to MetaMask
                provider = new ethers.providers.Web3Provider(window.ethereum);
                await provider.send("eth_requestAccounts", []);
                signer = provider.getSigner();
                const address = await signer.getAddress();
                contractResult.textContent = `Connected Wallet: ${address}`;
                console.log(`Wallet connected: ${address}`);
            } else {
                alert("MetaMask is not installed. Please install MetaMask and try again.");
            }
        } catch (error) {
            console.error("Error connecting wallet:", error);
            contractResult.textContent = "Error connecting wallet. Check console for details.";
        }
    });

    testContractButton.addEventListener("click", async () => {
        if (!signer) {
            alert("Please connect your wallet first!");
            return;
        }

        try {
            // Initialize the contract using the loaded ABI and address
            const contract = new ethers.Contract(contractAddress, contractABI, signer);

            // Example: Call the `tenderCount` function from the contract
            const tenderCount = await contract.tenderCount();
            contractResult.textContent = `Total Tenders: ${tenderCount}`;
            console.log("Total Tenders:", tenderCount);
        } catch (error) {
            console.error("Error interacting with the contract:", error);
            contractResult.textContent = "Error interacting with the contract. Check console for details.";
        }
    });
});
