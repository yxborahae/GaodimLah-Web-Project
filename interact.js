document.addEventListener("DOMContentLoaded", async () => {
  const connectWalletButton = document.getElementById("connectWallet-btn");

  let provider;
  let signer;
  let contractAddress;
  let contractABI;
  let contract;

  // Function to display error message to the user
  function displayErrorMessage(message) {
    const errorMessageElement = document.getElementById("error-message");

    // Set the error message in the element
    errorMessageElement.innerText = message;

    // Show the error message (you can style this however you like)
    errorMessageElement.style.display = "block";
  }

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

         // Initialize the contract only after the wallet is connected
         contract = new ethers.Contract(contractAddress, contractABI, signer);

        // Retrieve user data from localStorage
        const retrievedData = JSON.parse(localStorage.getItem("userData"));
        if (!retrievedData) {
          alert("No user data found in localStorage.");
          return;
        }

        // Update isRegistered to true
        retrievedData.isRegistered = true;

        // Trigger the registerUser function on the contract with the updated data
        const tx = await contract.registerUser(retrievedData);
        await tx.wait(); // Wait for the transaction to be mined

        console.log(`User registered: ${address}`);
        
        // Show the connected wallet address in an alert
        alert(`Connected Wallet: ${address} and User Registered`);
        console.log(`Wallet connected: ${address}`);

        // Save the updated user data back to localStorage
        localStorage.setItem("userData", JSON.stringify(retrievedData));

        // Navigate to tender_main.html after successful registration
        window.location.href = "tender_main.html";
      } else {
        const userResponse = confirm(
          "MetaMask is not installed. Would you like to download it now?"
      );
      if (userResponse) {
          // Redirect user to the MetaMask download page
          window.location.href = "https://metamask.io/download/";
      }
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  });
});
