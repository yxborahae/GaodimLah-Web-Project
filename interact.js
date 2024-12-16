document.addEventListener("DOMContentLoaded", async () => {
  const connectWalletButton = document.getElementById("connectWallet-btn");
  const testContractButton = document.getElementById("test-smart-contract");
  const contractResult = document.getElementById("contract-result");

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
    contractResult.textContent =
      "Error loading ABI file. Check console for details.";
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
      contractResult.textContent =
        "Error connecting wallet. Check console for details.";
    }
  });

  // Smart Contract Interaction Testing: Retrieve tender info
  testContractButton.addEventListener("click", async () => {
    if (!signer) {
      alert("Please connect your wallet first!");
      return;
    }
    try {
      // Initialize the contract
      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      const tenderID = "sampleTenderID"; // Replace with an actual tender ID
      const tenderFieldsAndLocality = await contract.getTenderFieldsAndLocality(
        tenderID
      );

      // Destructure the returned arrays
      const qualifiedFields = tenderFieldsAndLocality[0];
      const localities = tenderFieldsAndLocality[1];

      console.log("Qualified Fields:", qualifiedFields);
      console.log("Localities:", localities);

      // Format the arrays for display
      const formattedFields = qualifiedFields.join(", ");
      const formattedLocalities = localities.join(", ");

      // Display result in UI
      contractResult.textContent = `
          Smart Contract is connected successfully!
          Qualified Fields: ${formattedFields}
          Localities: ${formattedLocalities}
        `;
    } catch (error) {
      console.error("Error interacting with the contract:", error);
      contractResult.textContent =
        "Error interacting with the contract. Check console for details.";
    }
  });
});
