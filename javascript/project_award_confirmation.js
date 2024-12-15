const tenderID = new URLSearchParams(window.location.search).get('tenderID');

const back = document.getElementById('back-btn');
back.addEventListener('click', function () {
    window.location.href = `ap_progress.html?tenderID=${tenderID}`;
});

// Initialize the provider and contract
window.onload = async function init() {
    let provider;
    let contract;
    let contractAddress;
    let contractABI;

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
                        <div class="milestone-header">
                            <span class="milestone-title">Milestone ${index + 1}</span>
                            <span class="milestone-due-date">${new Date(milestone.dueDate * 1000).toLocaleDateString()}</span>
                        </div>
                        <div class="milestone-body">
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
                <p class="subtitle">Project Key Terms</p>
                <div class="line"></div>
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


