document.addEventListener("DOMContentLoaded", async () => {
    const connectWalletButton = document.getElementById("connect-wallet");
    const testContractButton = document.getElementById("test-smart-contract");
    const contractResult = document.getElementById("contract-result");

    // Form element IDs
    const createCompanyForm = document.getElementById("createCompanyForm"); 
    const createTenderForm = document.getElementById("createTenderForm");
    const submitBidForm = document.getElementById("submitBidForm");
    const awardTenderForm = document.getElementById("awardTenderForm");

    // Company details form fields
    const companyNameInput = document.getElementById("companyName");
    const companySSMInput = document.getElementById("ssm");
    const expertFieldInput = document.getElementById("expertField");
    const financialStatusInput = document.getElementById("financialStatus");

    // Owner details form fields
    const ownerNameInput = document.getElementById("ownerName");
    const ownerQualificationInput = document.getElementById("ownerQualification");
    const ownerExperienceInput = document.getElementById("ownerExperience");

    // Staff list
    const staffListDiv = document.getElementById("staff-list");
    const addStaffButton = document.getElementById("add-staff-btn");

    const tenderTitleInput = document.getElementById("tenderTitle");
    const tenderDescriptionInput = document.getElementById("description");
    const tenderBudgetInput = document.getElementById("budget");
    const tenderDeadlineInput = document.getElementById("deadline");
    const tenderExpertFieldInput = document.getElementById("expertFieldRequired");
    const tenderFinancialStatusInput = document.getElementById("financialStatusRequired");
    const tenderStaffCountInput = document.getElementById("professionalStaffRequired");

    const bidAmountInput = document.getElementById("amount");
    const bidTitleInput = document.getElementById("bidTitle");
    const bidIpfsHashInput = document.getElementById("ipfsHash");
    const tenderIdForBidInput = document.getElementById("tenderId");

    const tenderIdForAwardInput = document.getElementById("awardTenderId");
    const winnerAddressInput = document.getElementById("winnerAddress");

    let provider;
    let signer;
    let contractAddress;
    let contractABI;

    // Function to display error message to the user
    function displayErrorMessage(message) {
        const errorMessageElement = document.getElementById('error-message');
        
        // Set the error message in the element
        errorMessageElement.innerText = message;
        
        // Show the error message (you can style this however you like)
        errorMessageElement.style.display = 'block';
    }

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

    // Wallet connection
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

    // Smart Contract Interaction Testing: Retrieve tender count
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

    // Create Company
    createCompanyForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!signer) {
            alert("Please connect your wallet first!");
            return;
        }

        const name = companyNameInput.value;
        const SSM = companySSMInput.value;
        const expertField = expertFieldInput.value;
        const financialStatus = financialStatusInput.value;

        // Collect owner details
        const ownerName = ownerNameInput.value;
        const ownerQualification = ownerQualificationInput.value;
        const ownerExperience = ownerExperienceInput.value;

        // Collect staff details
        const staff = [];
        const staffElements = document.querySelectorAll(".staff-member");

        staffElements.forEach((staffElement) => {
            const staffName = staffElement.querySelector(".staff-name").value;
            const staffQualification = staffElement.querySelector(".staff-qualification").value;
            const staffExperience = staffElement.querySelector(".staff-experience").value;

            staff.push({
                staffName,
                staffQualification,
                staffExperience: parseInt(staffExperience),
            });
        });

        const owner = {
            staffName: ownerName,
            staffQualification: ownerQualification,
            staffExperience: parseInt(ownerExperience),
        };

        // Interact with the smart contract to register the company
        try {
            const contract = new ethers.Contract(contractAddress, contractABI, signer);
            const tx = await contract.registerCompany(
                name,
                parseInt(SSM),
                expertField,
                financialStatus,
                owner,
                staff,
                { gasLimit: 1000000 }
            );
            await tx.wait(); // Wait for the transaction to be mined
            contractResult.textContent = `Company Registered Successfully: ${tx.hash}`;
            console.log("Company Registered:", tx);
        } catch (error) {
            // Check if the error has a revert message
            if (error.data && error.data.message) {
                // Extract the revert reason from the error
                const revertReason = error.data.message;
                
                // Display the revert reason to the user (You can customize the message as needed)
                displayErrorMessage(revertReason);
            } else {
                // Display a generic error message if no specific reason is provided
                displayErrorMessage("An unknown error occurred while registering the company.");
            }
        }
    });

    // Add staff member dynamically to the form
    addStaffButton.addEventListener("click", function () {
        const staffMemberHTML = `
            <div class="staff-member">
                <h4>Staff Member</h4>
                <label for="staffName">Staff Name:</label>
                <input type="text" class="staff-name" required><br>

                <label for="staffQualification">Staff Qualification:</label>
                <input type="text" class="staff-qualification" required><br>

                <label for="staffExperience">Staff Experience (years):</label>
                <input type="number" class="staff-experience" required><br>

                <button type="button" class="remove-staff-btn">Remove Staff</button><br><br>
            </div>
        `;
        staffListDiv.insertAdjacentHTML("beforeend", staffMemberHTML);

        // Remove staff member from the list
        staffListDiv.querySelectorAll(".remove-staff-btn").forEach((btn) => {
            btn.addEventListener("click", function () {
                btn.parentElement.remove();
            });
        });
    });

    // Create Tender
    createTenderForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!signer) {
            alert("Please connect your wallet first!");
            return;
        }

        const title = tenderTitleInput.value;
        const description = tenderDescriptionInput.value;
        const budget = ethers.utils.parseUnits(tenderBudgetInput.value, "ether"); // Assuming budget is in ether
        const deadline = Math.floor(new Date(tenderDeadlineInput.value).getTime() / 1000); // Convert to Unix timestamp
        const expertFieldRequired = tenderExpertFieldInput.value;
        const financialStatusRequired = tenderFinancialStatusInput.value;
        const professionalStaffRequired = parseInt(tenderStaffCountInput.value);

        try {
            const contract = new ethers.Contract(contractAddress, contractABI, signer);
            const tx = await contract.createTender(
                title,
                description,
                budget,
                deadline,
                expertFieldRequired,
                financialStatusRequired,
                professionalStaffRequired,
                { gasLimit: 1000000 }
            );
            await tx.wait(); // Wait for the transaction to be mined
            contractResult.textContent = `Tender Created Successfully: ${tx.hash}`;
            console.log("Tender Created:", tx);
        } catch (error) {
            // Check if the error has a revert message
            if (error.data && error.data.message) {
                // Extract the revert reason from the error
                const revertReason = error.data.message;
                
                // Display the revert reason to the user (You can customize the message as needed)
                displayErrorMessage(revertReason);
            } else {
                // Display a generic error message if no specific reason is provided
                displayErrorMessage("An unknown error occurred while creating tender.");
            }
        }
    });

    // Submit Bid
    submitBidForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!signer) {
            alert("Please connect your wallet first!");
            return;
        }

        const tenderID = parseInt(tenderIdForBidInput.value);
        const amount = ethers.utils.parseUnits(bidAmountInput.value, "ether"); // Bid amount in ether
        const ipfsHash = bidIpfsHashInput.value;
        const bidTitle = bidTitleInput.value;

        try {
            const contract = new ethers.Contract(contractAddress, contractABI, signer);
            const tx = await contract.submitBid(tenderID, amount, ipfsHash, bidTitle, { gasLimit: 1000000 });
            await tx.wait(); // Wait for the transaction to be mined
            contractResult.textContent = `Bid Submitted Successfully: ${tx.hash}`;
            console.log("Bid Submitted:", tx);
        } catch (error) {
            // Check if the error has a revert message
            if (error.data && error.data.message) {
                // Extract the revert reason from the error
                const revertReason = error.data.message;
                
                // Display the revert reason to the user (You can customize the message as needed)
                displayErrorMessage(revertReason);
            } else {
                // Display a generic error message if no specific reason is provided
                displayErrorMessage("An unknown error occurred while submitting the bid.");
            }
        }
    });

    // Award Tender
    awardTenderForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!signer) {
            alert("Please connect your wallet first!");
            return;
        }

        const tenderID = parseInt(tenderIdForAwardInput.value);
        const winnerAddress = winnerAddressInput.value;

        try {
            const contract = new ethers.Contract(contractAddress, contractABI, signer);
            const tx = await contract.awardTender(tenderID, winnerAddress, { gasLimit: 1000000 });
            await tx.wait(); // Wait for the transaction to be mined
            contractResult.textContent = `Tender Awarded Successfully: ${tx.hash}`;
            console.log("Tender Awarded:", tx);
        } catch (error) {
            // Check if the error has a revert message
            if (error.data && error.data.message) {
                // Extract the revert reason from the error
                const revertReason = error.data.message;
                
                // Display the revert reason to the user (You can customize the message as needed)
                displayErrorMessage(revertReason);
            } else {
                // Display a generic error message if no specific reason is provided
                displayErrorMessage("An unknown error occurred while rewarding tender.");
            }
        }
    });
});
