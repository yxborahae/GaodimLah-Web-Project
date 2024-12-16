const { ethers } = window; // Ethers.js will be provided by your frontend environment (like a CDN)

// Retrieve `tenderID` and `index` from URL
const urlParams = new URLSearchParams(window.location.search);
const tenderID = urlParams.get("tenderID");
const milestoneIndex = urlParams.get("index");

window.onload = async function () {
    try {
        // Check for Ethereum provider (MetaMask)
        if (!window.ethereum) {
            alert("Please install MetaMask to interact with the blockchain!");
            return;
        }

        // Connect to Ethereum
        // const provider = new ethers.providers.Web3Provider(window.ethereum);
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []); // Request account access
        const signer = provider.getSigner();

        // Load contract details from abi.json
        const response = await fetch("../abi.json");
        const contractData = await response.json();
        const contractAddress = contractData.address;
        const contractABI = contractData.abi;


        // Initialize contract with provider (for view functions)
        const contractWithProvider = new ethers.Contract(contractAddress, contractABI, provider);

        // Fetch basic tender information to get budget
        console.log("Fetching tender details...");
        const tenderDetails = await contractWithProvider.getTenderBasicInfo(tenderID);
        console.log("Tender Details:", tenderDetails);

        const tenderTitle = tenderDetails[2]; // Assuming title is the 3rd field in getTenderBasicInfo
        const budget = tenderDetails[4]; // Assuming budget is the 5th field in getTenderBasicInfo

        // Update the tender title in the HTML
        document.getElementById("milestone-title").textContent = `${tenderTitle}`;

        // Initialize contract with signer (for transactions)
        const contractWithSigner = new ethers.Contract(contractAddress, contractABI, signer);

        // Fetch milestones using the provider-connected contract
        const milestones = await contractWithProvider.getTenderMilestones(tenderID);
        console.log("Milestones:", milestones);


        // Validate milestone index
        if (milestoneIndex >= milestones.length) {
            alert("Invalid milestone index.");
            return;
        }

        // Get specific milestone data
        const milestone = milestones[milestoneIndex];

        // Status mapping
        const statusMap = {
            0: { text: "Not Started", color: "#f3f3f3", icon: "⏳" },
            1: { text: "On Going", color: "#2196F3", icon: "🔄" },
            2: { text: "Complete", color: "#4CAF50", icon: "✅" },
        };

        const status = statusMap[milestone.status] || statusMap[0];

        // Calculate payment released
        const paymentPercentage = Number(milestone.paymentPercentage); // Convert BigInt to Number
        const budgetInEth = parseFloat(ethers.formatEther(budget)); // Convert budget from string to float
        const paymentReleased = (paymentPercentage / 100) * budgetInEth; // Safe arithmetic operation

        // Predefined milestone names based on their index
        const milestoneNames = [
            "Initial Setup and Requirements Gathering",  // Milestone 1
            "Mid-Project Development Review",            // Milestone 2
            "Final Delivery and Deployment"              // Milestone 3
        ];

        // Safely get the milestone name based on the index, or fallback to "Milestone X"
        const milestoneName = milestoneNames[milestoneIndex];
        console.log("-----Milestone Index:", milestoneIndex);
        console.log("-----Milestone Name:", milestoneName);

        // Update the HTML with milestone details
        document.querySelector(".keyTerms").innerHTML = `
            <div>
                <div>
                    <p class="subtitle">Milestone ${parseInt(milestoneIndex) + 1}: ${milestoneName}</p>
                    <div class="line"></div>
                </div>
                <button class="milestone-status-button" style="background-color: ${status.color}">${status.text}</button>

            </div>
            <p><span>Description: </span>${milestone.description}</p>
            <p class="mt-3"><span>Deadline: </span>${new Date(Number(milestone.dueDate) * 1000).toLocaleDateString()}</p>
            <p><span>Payment Released: RM </span>${paymentReleased.toFixed(2)}</p>
            <form method="form" enctype="multipart/form-data">
                <table class="mt-3">
                    <tr>
                        <th class="textColumn">Deliverables</th>
                        <th>Approval Status</th>
                        <th>Action</th>
                    </tr>
                    ${milestone.requiredDocuments.map((doc, idx) => `
                        <tr>
                            <td class="textColumn">${doc}</td>
                            <td>Not Uploaded</td>
                            <td>
                                <input type="file" id="file${idx}" name="file${idx}" class="file-button"/>
                            </td>
                        </tr>`
                )
                .join("")}
                </table>
            </form>
            <p class="mt-3"><span>Payment Status: </span>
            <button class="payment-status" style="background-color: ${status.text === 'Complete' ? '#4CAF50' : 'gray'}">
                ${status.text === 'Complete' ? 'Released' : 'Pending'}
            </button>
        `;

        console.log("Milestone loaded successfully:", milestone);
    } catch (error) {
        console.error("Error loading milestone details:", error);
        alert("Unable to load milestone details. Check console for more information.");
    }
};

// Navigation buttons
document.getElementById("back-btn").addEventListener("click", function () {
    window.location.href = `ap_progress.html?tenderID=${tenderID}`;
});

document.getElementById("next-btn").addEventListener("click", function () {
    const nextIndex = parseInt(milestoneIndex) + 1;
    window.location.href = `project-milestone-details.html?tenderID=${tenderID}&index=${nextIndex}`;
});
