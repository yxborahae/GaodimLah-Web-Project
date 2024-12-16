const tenderID = new URLSearchParams(window.location.search).get('tenderID');

const back = document.getElementById('back-btn');
back.addEventListener('click', function () {
    window.location.href = `ap_progress.html?tenderID=${tenderID}`;
});

const done = document.getElementById('done-btn');
done.addEventListener('click', function () {
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


