document.addEventListener("DOMContentLoaded", async () => {
    const connectWalletButton = document.getElementById("login-btn");

    let provider;
    let signer;
    let contractAddress;
    let contractABI;
    let contract;

    // Load ABI and address from abi.json
    try {
        const response = await fetch("../abi.json");
        if (!response.ok) {
            throw new Error("Failed to load ABI file.");
        }
        const contractData = await response.json();
        contractAddress = contractData.address;
        contractABI = contractData.abi;
        console.log("Contract data loaded successfully:", contractData);
    } catch (error) {
        console.error("Error loading ABI file:", error);
        return; // Prevent further execution if ABI can't be loaded
    }

    // Wallet connection
    connectWalletButton.addEventListener("click", async () => {
        try {
            if (window.ethereum) {
                // Request connection to MetaMask
                provider = new ethers.providers.Web3Provider(window.ethereum);
                await provider.send("eth_requestAccounts", []);
                signer = provider.getSigner();
                const address = await signer.getAddress();
                console.log(`Wallet connected: ${address}`);

                // Instantiate the contract
                contract = new ethers.Contract(contractAddress, contractABI, signer);

                // Check if user is registered
                const userData = await contract.users(address);
                if (userData.isRegistered) {
                    // Check if the address is admin or a regular user
                    if (address === "<input admin address here>") {
                        window.location.href = "./admin_main.html"; // Redirect to admin page
                    } else {
                        window.location.href = "./tender_main.html"; // Redirect to tender page
                    }
                } else {
                    alert("You don't have an account. Please sign up.");
                }
            } else {
                alert("MetaMask is not installed. Please install MetaMask and try again.");
            }
        } catch (error) {
            console.error("Error connecting wallet:", error);
            alert("An error occurred. Please check the console for details.");
        }
    });
});
