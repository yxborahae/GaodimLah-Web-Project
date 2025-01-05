// Retrieve `tenderID` and `index` from URL
const urlParams = new URLSearchParams(window.location.search);
const tenderID = urlParams.get("tenderID");
const milestoneIndex = urlParams.get("index");

let provider;
let contract;
let contractAddress;
let contractABI;

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
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner();
            contract = new ethers.Contract(contractAddress, contractABI, signer);
            console.log("Connected to contract:", contractAddress);

            loadMilestone(contract);

        } catch (error) {
            console.error("Error connecting to MetaMask:", error);
            alert("Error connecting to MetaMask. Please try again.");
        }
    } else {
        alert("Please install MetaMask to interact with the blockchain.");
    }
}

async function loadMilestone(contract) {
    // Fetch basic tender information
    const tenderDetails = await contract.getTenderBasicInfo(tenderID);
    const tenderTitle = tenderDetails[2];
    const budget = tenderDetails[4];
    
    // Update the tender title in the HTML
    document.getElementById("milestone-title").textContent = `${tenderTitle}`;

    // Fetch milestones
    const milestones = await contract.getMilestones(tenderID);

    // Validate milestone index
    if (milestoneIndex >= milestones.length) {
        alert("Invalid milestone index.");
        return;
    }
    
    // Get specific milestone data
    const milestone = milestones[milestoneIndex];

    // Handle navigation buttons
    const nextBtn = document.getElementById("next-btn");
    const backBtn = document.getElementById("back-btn");
    const isLastMilestone = parseInt(milestoneIndex) === milestones.length - 1;

    console.log('milestone: ', milestoneIndex, 'milestone length: ', (milestones.length - 1), " Is last milestone? ", isLastMilestone);

    nextBtn.textContent = isLastMilestone ? "DONE" : "NEXT";
    nextBtn.onclick = () => {
        const nextIndex = isLastMilestone
            ? `project-milestones.html?tenderID=${tenderID}`
            : `project-milestone-details.html?tenderID=${tenderID}&index=${parseInt(milestoneIndex) + 1}`;
        window.location.href = nextIndex;
    };

    backBtn.onclick = () => {
        const prevIndex = parseInt(milestoneIndex) === 0
            ? `project-milestones.html?tenderID=${tenderID}`
            : `project-milestone-details.html?tenderID=${tenderID}&index=${parseInt(milestoneIndex) - 1}`;
        window.location.href = prevIndex;
    };

    // Status mapping
    const statusMap = {
        0: { text: "Not Started", color: "#ba68c8", icon: "⏳" },
        1: { text: "On Going", color: "#2196F3", icon: "🔄" },
        2: { text: "Complete", color: "#4CAF50", icon: "✅" },
    };

    console.log("Required Documents:", milestone.requiredDocuments);

    // Populate milestone details
    const paymentPercentage = Number(milestone.paymentPercentage);
    const budgetInEth = parseFloat(ethers.utils.formatEther(budget));
    const paymentReleased = (paymentPercentage / 100) * budgetInEth;
    const uploadedDocs = await contract.getMilestoneDocuments(tenderID, milestoneIndex);
    const m_status = milestone.status;
    const p_status = milestone.paymentStatus;

    console.log('milstone status ',m_status);
    console.log('payment status ',p_status);

    var status;

    if (m_status === 2){
        status = statusMap[2];
    }else{
        if (uploadedDocs.length > 0){
            status = statusMap[1];
        }else{
            status = statusMap[0];
        }
    }
    
    const milestoneNames = [
        "Initial Setup and Requirements Gathering",  // Milestone 1
        "Mid-Project Development Review",            // Milestone 2
        "Final Delivery and Deployment"              // Milestone 3
    ];

    const milestoneName = milestoneNames[milestoneIndex];

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
                    ${m_status === 2 ? "" : "<th>Action</th>"}
                    <th>Document Uploaded</th>
                </tr>
                ${milestone.requiredDocuments.map((doc, index) => {
                    const uploadedDoc = uploadedDocs[index];
                    const approvalStatus = m_status === 2 ? "Approved" : uploadedDoc ? "Pending" : "Not Uploaded";
                    
                    return `
                    <tr>
                        <td class="textColumn">${doc}</td>
                        <td id="approval-status-${index}">${approvalStatus}</td>
                        ${m_status === 2 ? "" : `<td>
                            <input type="file" id="file-${index}" name="file${index}" class="file-button"/>
                            <button id="upload-btn-${index}" class="upload-btn btn-primary">Upload</button>
                        </td>`}
                        <td id="file-link-${index}">
                            ${uploadedDocs[index] ? `<a href="https://gateway.pinata.cloud/ipfs/${uploadedDocs[index]}" target="_blank">View Document</a>` : ''}
                        </td>
                  
                    </tr>`
                }).join("")}
            </table>
        </form>
        <p class="mt-3"><span>Payment Status: </span>
        <button class="payment-status" style="background-color: ${status.text === 'Complete' ? '#4CAF50' : 'gray'}">
            ${status.text === 'Complete' ? 'Released' : 'Pending'}
        </button>
    `;

    document.querySelectorAll('.upload-btn.btn-primary').forEach((button, index) => {
        button.addEventListener('click', async (event) => {
            event.preventDefault(); 
            const fileInput = document.getElementById(`file-${index}`);
            if (fileInput && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                await handleFileUpload(contract, file, index);
            } else {
                alert("Please select a file to upload.");
            }
        });
    });
}

// Function to upload file to Pinata IPFS
const uploadFileToIPFS = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
                'pinata_api_key': '6b268a36cb3efe22a626',
                'pinata_secret_api_key': 'c091a7da9b3ba5a96dba7e795c6fcfabb2061c65fc8f5b152ee9b5df9f72457a'
            },
            body: formData
        });
        const data = await response.json();
        return data.IpfsHash || null;
    } catch (error) {
        console.error('Error uploading file to IPFS:', error);
        alert("File upload failed. Please try again.");
        return null;
    }
};

const handleFileUpload = async (contract, file, docIndex) => {
    console.log('File selected:', file);
    const cid = await uploadFileToIPFS(file);
    if (!cid) return;

    try {
        console.log('tenderID:', tenderID, 'milestoneIndex:', milestoneIndex, 'CID:', cid);
        // Use the contract with signer to send a transaction
        const tx = await contract.uploadDocument(tenderID, milestoneIndex, cid);
        await tx.wait();

        alert("Document uploaded successfully!");
        document.getElementById(`approval-status-${docIndex}`).textContent = 'Uploaded';
        document.getElementById(`file-link-${docIndex}`).innerHTML = `<a href="https://gateway.pinata.cloud/ipfs/${cid}" target="_blank">View Document</a>`;
    } catch (error) {
        console.error("Error storing CID in smart contract:", error);
        alert("Failed to store document CID. Check console for details.");
    }
};

