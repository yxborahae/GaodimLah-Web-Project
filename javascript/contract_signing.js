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
        const milestones = await contract.getMilestones(tenderID);

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
    const tenderStatus = creator[9];

    const signer = await contract.provider.getSigner();
    const signerAddress = await signer.getAddress();

    const creatorSignature = await contract.getContractSignatureDetails(tenderID, tenderCreator);
    const winnerSignature = await contract.getContractSignatureDetails(tenderID, projectWinner);

    updateAcceptStatus(creator);
    updateTenderStatus(creator);
    updateGovStatus(creatorSignature);
    updateBidStatus(winnerSignature);

    checkBothSigned(creatorSignature, winnerSignature);

    await displayTransactionDetails(contract, tenderID, signerAddress);

    updateBidderRepresentativeSection();
    updateGovernmentRepresentativeSection();

    const creatorHash = creatorSignature[3];
    const winnerHash = winnerSignature[3];

    if (creatorHash == ethers.constants.HashZero && signerAddress == tenderCreator) {
        document.getElementById("gov-sign-button").style.display = 'block';
    } else {
        document.getElementById("gov-sign-button").style.display = 'none';
    }

    if (winnerHash == ethers.constants.HashZero && signerAddress == projectWinner) {
        document.getElementById("bid-sign-button").style.display = 'block';
    } else {
        document.getElementById("bid-sign-button").style.display = 'none';
    }

    console.log('tender status ', tenderStatus);
    if (tenderStatus >= 5) {
        decline.style.display = 'none';
        accept.style.display = 'none';
    }
}

function updateAcceptStatus(creator) {
    const statusElement = document.getElementById('accept-status-button');
    const status = creator[9];
    console.log("Tender Status:", status);
    if (status >= 4) {
        statusElement.textContent = `Project Accepted`;
        statusElement.style.backgroundColor = 'green';
        statusElement.style.color = 'white';
    } else {
        statusElement.textContent = `Awaiting Accept`;
        statusElement.style.backgroundColor = 'orange';
        statusElement.style.color = 'white';
    }
}

function updateTenderStatus(creator) {
    const statusElement = document.getElementById('contract-status-button');
    const status = creator[9];
    console.log("Tender Status:", status);
    if (status >= 5) {
        statusElement.textContent = `Complete Signature`;
        statusElement.style.backgroundColor = 'green';
        statusElement.style.color = 'white';
    } else {
        statusElement.textContent = `Awaiting Signature`;
        statusElement.style.backgroundColor = 'orange';
        statusElement.style.color = 'white';
    }
}

function updateGovStatus(signature) {
    const statusElement = document.getElementById('creator-status');
    const creatorHash = signature[3];
    console.log("Government Contract Hash:", creatorHash);
    if (creatorHash !== ethers.constants.HashZero) {
        statusElement.textContent = `Signed`;
        statusElement.style.backgroundColor = 'green';
        statusElement.style.color = 'white';
    } else {
        statusElement.textContent = `Not Signed`;
        statusElement.style.backgroundColor = 'orange';
        statusElement.style.color = 'white';
    }
}

function updateBidStatus(signature) {
    const statusElement = document.getElementById('winner-status');
    const bidderHash = signature[3];
    console.log("Bidder Contract Hash:", bidderHash);
    if (bidderHash !== ethers.constants.HashZero) {
        statusElement.textContent = `Signed`;
        statusElement.style.backgroundColor = 'green';
        statusElement.style.color = 'white';
    } else {
        statusElement.textContent = `Not Signed`;
        statusElement.style.backgroundColor = 'orange';
        statusElement.style.color = 'white';
    }
}

async function signContract() {
    try {
        const confirmSign = confirm("Are you sure you want to sign this contract? Once signed, this action cannot be undone.");
        if (!confirmSign) {
            alert("Signing cancelled.");
            return;
        }

        // Hash a simple message (replace with actual agreement text if needed)
        const message = "I agree to the tender contract terms.";
        const signedHash = ethers.utils.id(message);

        const signingAction = 0;

        // Attempt to sign the contract
        const tx = await contract.sign(tenderID, signedHash, signingAction);
        const txReceipt = await tx.wait(); 

        let blockNumber = txReceipt.blockNumber;
        blockNumber = parseInt(blockNumber, 10);
        const transactionHash = txReceipt.transactionHash;

        // Check if the block number is valid
        if (isNaN(blockNumber) || blockNumber <= 0) {
            console.error("Invalid block number:", blockNumber);
            alert("Invalid block number. Unable to retrieve block details.");
            return;
        }

        // Fetch block details
        const blockDetails = await provider.getBlock(blockNumber);
        const timestamp = blockDetails.timestamp;

        console.log("Signature Details:");
        console.log("Block Number:", blockNumber);
        console.log("Transaction Hash:", transactionHash);
        console.log("Timestamp:", new Date(timestamp * 1000).toISOString());

        // Check if both parties have signed
        const creator = await contract.getTenderBasicInfo(tenderID);
        const projectWinner = creator[10]; 
        const tenderCreator = creator[0]; 

        const creatorSignature = await contract.getContractSignatureDetails(tenderID, tenderCreator);
        const winnerSignature = await contract.getContractSignatureDetails(tenderID, projectWinner);

        if (creatorSignature[3] !== ethers.constants.HashZero && winnerSignature[3] !== ethers.constants.HashZero) {
            console.log("Both parties have signed. Updating tender status...");
            await contract.updateTenderStatus(tenderID, 5);
            alert("Contract signed successfully and tender status updated!");
        } else {
            console.log("Waiting for both parties to sign...");
            alert("Contract signed successfully! Waiting for the other party to sign.");
        }

        // Reload the signing status after signing
        await loadSigningStatus(contract);

    } catch (error) {
        console.error("Error signing contract:", error);
        alert("Failed to sign contract. Check console for details.");
    }
}


async function checkBothSigned(creatorSignature, winnerSignature) {
    // Debugging: Log the full objects to understand their structure
    console.log("Creator Signature:", creatorSignature);
    console.log("Winner Signature:", winnerSignature);

    // Ensure creatorSignature and winnerSignature are not undefined or null
    if (!creatorSignature || !winnerSignature) {
        console.warn("Signature details are missing or undefined.");
        return; // Exit if either signature is missing
    }

    // Check for the contractHash (if it exists in the returned structure)
    const creatorHash = creatorSignature[3];
    const winnerHash = winnerSignature[3];

    // Update confirmation message only if both hashes are valid
    if (creatorHash !== ethers.constants.HashZero && winnerHash !== ethers.constants.HashZero) {
        document.getElementById("confirmation-message").textContent =
            "✅ Both parties have signed the contract. Agreement confirmed!";
    } else {
        document.getElementById("confirmation-message").textContent =
            "❌ Contract not fully signed yet. Awaiting signatures.";
    }
}

async function displayTransactionDetails(contract, tenderID, signerAddress) {
    try {
        // Fetch signature details from the smart contract
        const signatureDetails = await contract.getContractSignatureDetails(tenderID, signerAddress);

        // Destructure the returned values
        const [transactionID, blockNumber, timestamp, contractHash] = signatureDetails;

        // Check if the contract has been signed
        if (contractHash === ethers.constants.HashZero) {
            // If not signed, display a proper message
            document.querySelector(".blockchain-record").innerHTML = `
                <p class="subtitle">Blockchain Transaction Record</p>
                <div class="line"></div>
                <p>This contract has not been signed yet.</p>
            `;
            return;
        }

        // Ensure blockNumber is a valid integer
        const blockNumberInt = parseInt(blockNumber, 10);
        if (isNaN(blockNumberInt) || blockNumberInt <= 0) {
            console.error("Invalid block number:", blockNumber);
            document.querySelector(".blockchain-record").innerHTML = `
                <p class="subtitle">Blockchain Transaction Record</p>
                <div class="line"></div>
                <p>Error: Invalid block number.</p>
            `;
            return;
        }

        // Fetch block details using the provider
        const block = await contract.provider.getBlock(blockNumberInt);

        // Check if block exists
        if (!block) {
            console.error("Block not found:", blockNumberInt);
            document.querySelector(".blockchain-record").innerHTML = `
                <p class="subtitle">Blockchain Transaction Record</p>
                <div class="line"></div>
                <p>Error: Block details not found.</p>
            `;
            return;
        }

        // Format the timestamp
        const transactionTimestamp = new Date(timestamp * 1000).toLocaleString();

        // Update the blockchain record section in HTML
        document.querySelector(".blockchain-record").innerHTML = `
            <p class="subtitle">Blockchain Transaction Record</p>
            <div class="line"></div>
            <p><span>Transaction ID: </span>${transactionID}</p>
            <p><span>Block Number: </span>${blockNumberInt}</p>
            <p><span>Timestamp: </span>${transactionTimestamp}</p>
            <p><span>Contract Hash: </span>${contractHash}</p>
        `;
    } catch (error) {
        console.error("Error displaying transaction details:", error);
        document.querySelector(".blockchain-record").innerHTML = `
            <p class="subtitle">Blockchain Transaction Record</p>
            <div class="line"></div>
            <p>An error occurred while fetching the transaction details. Please try again later.</p>
        `;
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
        const winnerSignature = await contract.getContractSignatureDetails(tenderID, projectWinner);
        const timestamp = new Date(winnerSignature[2] * 1000).toLocaleString();
        
        document.querySelector(".bidder-signature .small-title").textContent = "Bidder Representative";

        const winnerHash = winnerSignature[3];

        if (!winnerHash || winnerHash === ethers.constants.HashZero) {
            document.getElementById("winner-status").textContent = "Not Signed";
            document.querySelector(".bidder-signature p:nth-child(2)").textContent = `Name: N/A`;
            document.querySelector(".bidder-signature p:nth-child(3)").textContent = `Digital Signature: N/A`;
            document.querySelector(".bidder-signature p:nth-child(4)").textContent = `Date Signed: N/A`;
            return;
        }

        // Update name and signature details
        document.getElementById("winner-status").textContent = "Signed";
        document.querySelector(".bidder-signature p:nth-child(2)").textContent = `Name: ${bidderName}`;
        document.querySelector(".bidder-signature p:nth-child(3)").textContent = `Digital Signature: ${winnerSignature[3]}`;
        document.querySelector(".bidder-signature p:nth-child(4)").textContent = `Date Signed: ${new Date(timestamp)}`;

    } catch (error) {
        console.error("Error updating Bidder Representative section:", error);
    }
}

async function updateGovernmentRepresentativeSection() {
    try {
        const creator = await contract.getTenderBasicInfo(tenderID);
        const name = creator[3];
        const address = creator[0]; 

        // Get the bidder's signature and timestamp (when they signed the contract)
        const creatorSignature = await contract.getContractSignatureDetails(tenderID, address);
        const timestamp = new Date(creatorSignature[2] * 1000).toLocaleString();

        document.querySelector(".government-signature .small-title").textContent = "Government Representative";

        const creatorHash = creatorSignature[3];

        if (!creatorHash || creatorHash === ethers.constants.HashZero) {
            // If not signed, display "Not signed yet"
            document.getElementById("creator-status").textContent = "Not Signed";
            document.querySelector(".government-signature p:nth-child(2)").textContent = `Name: N/A`;
            document.querySelector(".government-signature p:nth-child(3)").textContent = `Digital Signature: N/A`;
            document.querySelector(".government-signature p:nth-child(4)").textContent = `Date Signed: N/A`;
            return;
        }

        // Update name and signature details
        document.getElementById("creator-status").textContent = "Signed";
        document.querySelector(".government-signature p:nth-child(2)").textContent = `Name: ${name}`;
        document.querySelector(".government-signature p:nth-child(3)").textContent = `Digital Signature: ${creatorSignature[3]}`;
        document.querySelector(".government-signature p:nth-child(4)").textContent = `Date Signed: ${new Date(timestamp)}`; 

    } catch (error) {
        console.error("Error updating government Representative section:", error);
    }
}

// function calculateDeadline() {
//     const deadline = new Date("2024-12-25");
//     const now = new Date();
//     const timeDiff = deadline - now;
//     const daysLeft = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
//     const monthsLeft = Math.floor(daysLeft / 30);
//     const remainingDays = daysLeft % 30;
//     document.getElementById('deadline-timer').textContent =
//         `${monthsLeft} months ${remainingDays} days`;
// }
// calculateDeadline();


