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
    if (status === 7) {
        statusElement.textContent = `Complete Signature`;
        statusElement.style.backgroundColor = 'green';
        statusElement.style.color = 'white';
    } else {
        statusElement.textContent = `Awaiting Signature`;
        statusElement.style.backgroundColor = 'orange';
        statusElement.style.color = 'white';
    }
}

async function fetchTenderDetails(contract) {
    if (!tenderID) {
        alert("Tender ID is missing!");
        return;
    }

    try {
        console.log("Fetching tender details for Tender ID:", tenderID);

        // Fetch basic tender details
        const result = await contract.getTenderBasicInfo(tenderID);
        const title = result[2];
        const ministry = result[3];
        const bidderDetails = await contract.getUser(result[10]);
        const companyName = bidderDetails.companyName;

        updateAcceptStatus(result);
        updateTenderStatus(result);

        // Populate tender details
        document.getElementById('tender-title').innerHTML = `<h3 class="tender-title">${title}</h3>`;
        document.getElementById('tender-details').innerHTML = `
            <div class="detail-row">
                <span class="label">Tender ID</span><span class="value">: ${tenderID}</span>
            </div>
            <div class="detail-row">
                <span class="label">Responsibility Center</span><span class="value">: ${ministry}</span>
            </div>
            <div class="detail-row">
                <span class="label">Awarded Company</span><span class="value">: ${companyName}</span>
            </div>
        </a>
        `;

        // Fetch milestones
        const milestones = await contract.getMilestones(tenderID);

        // Map status to text and style
        const statusMap = {
            0: { text: 'Not Started', color: '#f3f3f3', icon: '⏳' },
            1: { text: 'On Going', color: '#6F9CDE', icon: '🔄' },
            2: { text: 'Complete', color: '#4CAF50', icon: '✅' },
        };
       
        const milestoneStatuses = [];

        // Populate milestones
        let milestoneContent = '';
        if (milestones.length > 0) {
            for (let index = 0; index < milestones.length; index++) {
                const uploadedDocs = await contract.getMilestoneDocuments(tenderID, index);
                let status;
                if (milestones[index].status === 2){
                    status = statusMap[2];
                }else{
                    if (uploadedDocs.length > 0) {
                        status = statusMap[1];
                    } else {
                        status = statusMap[0];
                    }
                }
                milestoneStatuses.push(status);
            }

            milestones.forEach((milestone, index) => {
                const status = milestoneStatuses[index];
                milestoneContent += `
                    <a href="project-milestone-details.html?tenderID=${tenderID}&index=${index}">
                        <div class="milestone-card">
                            <div class="milestone-header">
                                <h4>Milestone ${index + 1}</h4>
                                <span class="status-box" style="background-color: ${status.color};">
                                    ${status.icon} ${status.text}
                                </span>
                            </div>
                            <div class="milestone-content">
                                <p><strong>Description:</strong> ${milestone.description}</p>
                                <p><strong>Due Date:</strong> ${new Date(milestone.dueDate * 1000).toLocaleDateString()}</p>
                                <p><strong>Payment Percentage:</strong> ${milestone.paymentPercentage}%</p>
                            </div>
                        </div>
                `;
            });
        } else {
            milestoneContent = `
                <div class="no-milestones">
                    <p>No milestones have been set for this project yet.</p>
                </div>
            `;
        }

        document.querySelector('.keyTerms').innerHTML = `
            <div class="key-terms-container">
                <p class="subtitle">Project Milestones</p>
                <div class="line"></div>
                <div class="milestones-list">${milestoneContent}</div>
            </div>
        `;
    } catch (err) {
        console.error("Error fetching tender details:", err);
        alert("Unable to fetch tender details. Check console for more info.");
    }
}





