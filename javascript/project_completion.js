const tenderID = new URLSearchParams(window.location.search).get('tenderID');

const back = document.getElementById('back-btn');
back.addEventListener('click', function () {
    window.location.href = `ap_progress.html?tenderID=${tenderID}`;
});

let provider;
let contract;
let contractAddress;
let contractABI;

const done = document.getElementById('done-btn');
done.addEventListener('click', function () {
    window.location.href = `ap_progress.html?tenderID=${tenderID}`;
});

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
        
        fetchAndRenderMilestones(tenderID, contract);
        
    } catch (err) {
        console.error("Error fetching tender details:", err);
        alert("Unable to fetch tender details. Check console for more info.");
    }
}

// Function to fetch and render milestones
async function fetchAndRenderMilestones(tenderID, contract) {
    try {
        // Fetch milestones from the blockchain
        const milestones = await contract.getTenderMilestones(tenderID);

        // Target the container/table where milestones will be displayed
        const milestoneTable = document.getElementById('milestone-table');

        // Build the table dynamically
        let milestoneContent = `
            <table class="mt-3">
                <tr>
                    <th class="textColumn">Milestone</th>
                    <th>Description</th>
                    <th>Status</th>
                </tr>
        `;

        // Check if milestones exist
        if (milestones.length > 0) {
            milestones.forEach((milestone, index) => {
                
                mstatus = '';

                if (milestone.status === 0){
                    mstatus = 'No Start';
                }else if (milestone.status === 1){
                    mstatus = 'On Going';
                }else if (milestone.status === 1){
                    mstatus = 'Complete';
                }else{
                    mstatus = 'Undefined';
                }
                milestoneContent += `
                    <tr>
                        <td class="textColumn">${index + 1}</td>
                        <td>${milestone.description}</td>
                        <td>${mstatus}</td>
                    </tr>
                `;
            });
        } else {
            // Handle case when no milestones are available
            milestoneContent += `
                <tr>
                    <td colspan="3" style="text-align:left;">No milestones have been set for this project yet.</td>
                </tr>
            `;
        }

        // Close the table
        milestoneContent += `</table>`;

        // Render the content inside the milestone table container
        milestoneTable.innerHTML = milestoneContent;

    } catch (error) {
        console.error("Error fetching milestones:", error);
        document.getElementById('milestone-table').innerHTML = `
            <p style="color: red; text-align: center;">Failed to load milestones. Please try again later.</p>
        `;
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
    const timestamp = Date.now();
    if (
        creatorSignature !== ethers.constants.HashZero &&
        winnerSignature !== ethers.constants.HashZero
    ) {
        document.getElementById("confirmation-message").textContent =
            "✅ Both parties have signed the contract. Agreement confirmed!";
            document.getElementById("close-date").textContent =
            `Project Closure Date: ${new Date(timestamp * 1000).toLocaleString()}`;
        
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
