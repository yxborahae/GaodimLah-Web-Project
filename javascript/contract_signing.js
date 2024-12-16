const tenderID = new URLSearchParams(window.location.search).get('tenderID');

const back = document.getElementById('back-btn');
back.addEventListener('click', function () {
    window.location.href = `ap_progress.html?tenderID=${tenderID}`;
});

const decline = document.getElementById('decline');
decline.addEventListener('click', function () {
    const confirmDecline = confirm("Are you sure you want to decline this contract?");
    if (confirmDecline) {
        window.location.href = `ap_progress.html?tenderID=${tenderID}`;
    }
});

const accept = document.getElementById('accept');
accept.addEventListener('click', function () {
    const confirmAccept = confirm("Are you sure you want to accept this contract?");
    if (confirmAccept) {
        window.location.href = `ap_progress.html?tenderID=${tenderID}`;
    }
});

let provider;
let contract;
let contractAddress;
let contractABI;

// Initialize the provider and contract
window.onload = async function init() {
    

    // Fetch ABI and contract address from abi.json file
    const response = await fetch('../abi.json');
    const data = await response.json();

    contractAddress = data.address;
    contractABI = data.abi;

    // Connect to Ethereum network (MetaMask or other provider)
    if (window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        try {
            await provider.send("eth_requestAccounts", []); // Request user's accounts
            const signer = provider.getSigner();
            contract = new ethers.Contract(contractAddress, contractABI, signer);
            console.log("Connected to contract:", contractAddress);

            fetchTenderDetails(contract);

            // Load current signing status
            await loadSigningStatus(contract);

        } catch (error) {
            console.error("Error connecting to MetaMask:", error);
            alert("Error connecting to MetaMask. Please try again.");
        }
    } else {
        alert("Please install MetaMask to interact with the blockchain.");
    }
}

async function fetchTenderDetails(contract) {

    if (!tenderID) {
        alert("Tender ID is missing!");
        return;
    }

    try {
        // Debugging: log the tenderID format
        console.log("Fetching tender details for Tender ID:", tenderID);

        // Fetch data from blockchain
        const result = await contract.getTenderBasicInfo(tenderID);

        const title = result[2];
        const ministry = result[3]; 
        const bidderDetails = await contract.getUser(result[10]);
        const companyName = bidderDetails.companyName; 

        document.getElementById('tender-title').innerHTML = `
            <h3 class="tender-title" id="tender-title">${title}</h3>
        `;

        document.getElementById('tender-details').innerHTML = `
            <div class="detail-row">
                <span class="label">Tender ID</span>
                <span class="value">: ${tenderID}</span>
            </div>
            <div class="detail-row">
                <span class="label">Responsibility Center</span>
                <span class="value">: ${ministry}</span>
            </div>
            <div class="detail-row">
                <span class="label">Awarded Company</span>
                <span class="value">: ${companyName}</span>
            </div>
        `;
        
        // Fetch milestones
        const milestones = await contract.getTenderMilestones(tenderID);

        // Populate Project Key Terms
        let milestoneContent = '';
        if (milestones.length > 0) {
            milestones.forEach((milestone, index) => {
                milestoneContent += `
                    <div class="milestone-item">
                        <div class="milestone-icon-wrapper">
                            <div class="milestone-icon">
                                <i class="fa-solid fa-circle-check"></i>
                            </div>
                            ${index < milestones.length - 1 ? '<div class="milestone-line"></div>' : ''}
                        </div>
                        <div class="milestone-details">
                            <p class="milestone-title">Milestone ${index + 1}</p>
                            <p class="milestone-due-date">${new Date(milestone.dueDate * 1000).toLocaleDateString()}</p>
                            <p class="milestone-description">${milestone.description}</p>
                            <p class="milestone-payment">Payment Percentage: <strong>${milestone.paymentPercentage}%</strong></p>
                        </div>
                    </div>
                `;
            });
        } else {
            milestoneContent = `
                <div class="no-milestones">
                    <p>No milestones have been set for this project yet.</p>
                    <p>Please check back later or contact the project administrator for more details.</p>
                </div>
            `;
        }

        document.querySelector('.keyTerms').innerHTML = `
            <div class="key-terms-container">
                <p class="subtitle">Contract Summary</p>
                <div class="line"></div>
                <div>The project milestones is defined as shown below : <br><br></div>
                <div class="milestones-list">
                    ${milestoneContent}
                </div>
            </div>
        `;

        
    } catch (err) {
        console.error("Error fetching tender details:", err);
        alert("Unable to fetch tender details. Check console for more info.");
    }
}

async function loadSigningStatus(contract) {
    const creator = await contract.getTenderBasicInfo(tenderID);
    const projectWinner = creator[10]; 
    const tenderCreator = creator[0]; 

    const signer = await contract.provider.getSigner();
    const signerAddress = await signer.getAddress();

    const creatorSignature = await contract.getSignature(tenderID, tenderCreator);
    const winnerSignature = await contract.getSignature(tenderID, projectWinner);

    updatePartyStatus("creator-status", creatorSignature);
    updatePartyStatus("winner-status", winnerSignature);

    // Enable "Sign Contract" button if current user is eligible
    if (signerAddress === tenderCreator || signerAddress === projectWinner) {
        document.getElementById("sign-button").disabled = false;
    }

    checkBothSigned(creatorSignature, winnerSignature);

    // Hide "Sign Contract" button if both parties have signed the contract
    if (creatorSignature !== ethers.constants.HashZero && winnerSignature !== ethers.constants.HashZero) {
        document.getElementById("sign-button").style.display = 'none';
    } else {
        document.getElementById("sign-button").style.display = 'block';
    }
}

function updatePartyStatus(elementId, signature) {
    const statusElement = document.getElementById(elementId);
    statusElement.textContent = signature !== ethers.constants.HashZero ? "Signed" : "Not Signed";
}

async function signContract() {
    try {

        const confirmSign = confirm("Are you sure you want to sign this contract? Once signed, this action cannot be undone.");
        if (!confirmSign) {
            alert("Signing cancelled.");
            return; // Exit if the user clicks 'Cancel'
        }
        
        // Hash a simple message (replace with actual agreement text if needed)
        const message = "I agree to the tender contract terms.";
        const signedHash = ethers.utils.id(message);

        const tx = await contract.signContract(tenderID, signedHash);
        await tx.wait();

        const txReceipt = await tx.wait(); 

        alert("Contract signed successfully!");

        // Now, fetch transaction details to display
        await displayTransactionDetails(txReceipt);

        // Reload status after signing
        await loadSigningStatus(contract);

        // Update the Bidder Representative section
        await updateBidderRepresentativeSection();

        // Update the Bidder Representative section
        await updateGovermentRepresentativeSection();
        
    } catch (error) {
        console.error("Error signing contract:", error);
        alert("Failed to sign contract. Check console for details.");
    }
}

function checkBothSigned(creatorSignature, winnerSignature) {
    if (
        creatorSignature !== ethers.constants.HashZero &&
        winnerSignature !== ethers.constants.HashZero
    ) {
        document.getElementById("confirmation-message").textContent =
            "✅ Both parties have signed the contract. Agreement confirmed!";
    }
}

async function displayTransactionDetails(txReceipt) {
    try {
        // Fetch Block details to get the timestamp
        const block = await provider.getBlock(txReceipt.blockNumber);

        // Retrieve transaction details
        const txHash = txReceipt.transactionHash;
        const blockNumber = txReceipt.blockNumber;
        const timestamp = new Date(block.timestamp * 1000).toLocaleString(); // Convert timestamp to human-readable format
        const contractHash = txReceipt.contractAddress || "N/A"; // The contract address is available if the contract was deployed in this transaction

        // Update the blockchain record section in HTML
        document.querySelector(".blockchain-record").innerHTML = `
            <p class="subtitle">Blockchain Transaction Record</p>
            <div class="line"></div>
            <p><span>Transaction ID: </span>${txHash}</p>
            <p><span>Block Number: </span>${blockNumber}</p>
            <p><span>Timestamp: </span>${timestamp}</p>
            <p><span>Contract Hash: </span>${contractHash}</p>
        `;
    } catch (error) {
        console.error("Error displaying transaction details:", error);
    }
}

async function updateBidderRepresentativeSection() {
    try {
        const creator = await contract.getTenderBasicInfo(tenderID);
        const projectWinner = creator[10]; // Project Winner Address (Bidder Representative)

        // Get the bidder details (name, etc.)
        const bidderDetails = await contract.getUser(projectWinner);
        const bidderName = bidderDetails.personalDetails.fullName;

        // Get the bidder's signature and timestamp (when they signed the contract)
        const winnerSignature = await contract.getSignature(tenderID, projectWinner);
        const timestamp = Date.now();

        // Update the HTML of the Bidder Representative section
        document.querySelector(".bidder-signature .small-title").textContent = "Bidder Representative";
        document.getElementById("winner-status").textContent = winnerSignature !== ethers.constants.HashZero ? "Signed" : "Not Signed";

        // Update name and signature details
        document.querySelector(".bidder-signature p:nth-child(2)").textContent = `Name: ${bidderName}`;
        document.querySelector(".bidder-signature p:nth-child(3)").textContent = `Digital Signature: ${winnerSignature}`;
        document.querySelector(".bidder-signature p:nth-child(4)").textContent = `Date Signed: ${new Date(timestamp * 1000).toLocaleString()}`; // Format timestamp

        // Show the "Signed Contract" button
        document.getElementById("sign-button").style.display = 'none';
    } catch (error) {
        console.error("Error updating Bidder Representative section:", error);
    }
}

async function updateGovermentRepresentativeSection() {
    try {
        const creator = await contract.getTenderBasicInfo(tenderID);
        const name = creator[3];
        const address = creator[0]; 

        // Get the bidder's signature and timestamp (when they signed the contract)
        const winnerSignature = await contract.getSignature(tenderID, address);
        const timestamp = Date.now();

        // Update the HTML of the Bidder Representative section
        document.querySelector(".government-signature .small-title").textContent = "Bidder Representative";
        document.getElementById("winner-status").textContent = winnerSignature !== ethers.constants.HashZero ? "Signed" : "Not Signed";

        // Update name and signature details
        document.querySelector(".government-signature p:nth-child(2)").textContent = `Name: ${name}`;
        document.querySelector(".government-signature p:nth-child(3)").textContent = `Digital Signature: ${winnerSignature}`;
        document.querySelector(".government-signature p:nth-child(4)").textContent = `Date Signed: ${new Date(timestamp * 1000).toLocaleString()}`; // Format timestamp

        // Show the "Signed Contract" button
        document.getElementById("sign-button").style.display = 'none';
    } catch (error) {
        console.error("Error updating government Representative section:", error);
    }
}


