const tenderID = new URLSearchParams(window.location.search).get('tenderID');

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

        const projectTitle = result[2]; 
        const deadline = new Date(result[7] * 1000); 
        const status = result[9];

        document.getElementById('p-title').innerHTML = projectTitle;
        document.getElementById('tender-id').innerHTML = tenderID;
        document.getElementById('deadline').innerHTML = deadline.toLocaleDateString();

        updateProjectStatus(status);

        calculateDeadline(deadline);
        
    } catch (err) {
        console.error("Error fetching tender details:", err);
        alert("Unable to fetch tender details. Check console for more info.");
    }
}

function updateProjectStatus(tenderStatus) {

    const steps = [
        { id: "step-awarded", requiredStatus: 4 },
        { id: "step-signing", requiredStatus: 5 },
        { id: "step-milestones", requiredStatus: 6 },
        { id: "step-complete", requiredStatus: 7 }
    ];

    steps.forEach(step => {
        const stepElement = document.getElementById(step.id);
        const stepIcon = stepElement.querySelector(".step-icon");
        const smallCircles = stepElement.querySelectorAll(".small-circle");

        if (tenderStatus >= step.requiredStatus) {
            // Mark the step as completed
            stepIcon.classList.remove("undone");
            stepIcon.removeAttribute("id");
            smallCircles.forEach(circle => {
                circle.classList.remove("undone");
                circle.removeAttribute("id");
            });
        } else {
            // Mark the step as undone
            stepIcon.classList.add("undone");
            stepIcon.setAttribute("id", "undone");
            smallCircles.forEach(circle => {
                circle.classList.add("undone");
                circle.setAttribute("id", "undone");
            });
        }
    });
    
    // Select the <a> elements corresponding to each project stage
    const projectAwardedLink = document.getElementById('confirm');
    const contractSigningLink = document.getElementById('signing');
    const projectMilestonesLink = document.getElementById('milestone');
    const projectCompletionLink = document.getElementById('complete');

    // Ensure that the elements exist before attempting to modify them
    if (projectAwardedLink && contractSigningLink && projectMilestonesLink && projectCompletionLink) {
        
        console.log('tender status', tenderStatus);
        // Mapping of status to <a> link color
        switch (tenderStatus) {
            case 4: // Project Awarded
                setLinkColor(projectAwardedLink, 'green');
                setLinkColor(contractSigningLink, 'grey');
                setLinkColor(projectMilestonesLink, 'grey');
                setLinkColor(projectCompletionLink, 'grey');
                break;
            case 5: // Contract Signing
                setLinkColor(projectAwardedLink, 'green');
                setLinkColor(contractSigningLink, 'green');
                setLinkColor(projectMilestonesLink, 'grey');
                setLinkColor(projectCompletionLink, 'grey');
                break;
            case 6: // Project Milestones
                setLinkColor(projectAwardedLink, 'green');
                setLinkColor(contractSigningLink, 'green');
                setLinkColor(projectMilestonesLink, 'green');
                setLinkColor(projectCompletionLink, 'grey');
                break;
            case 7: // Project Completion
                setLinkColor(projectAwardedLink, 'green');
                setLinkColor(contractSigningLink, 'green');
                setLinkColor(projectMilestonesLink, 'green');
                setLinkColor(projectCompletionLink, 'green');
                break;
            default:
                // Default case for unknown or uninitialized status
                setLinkColor(projectAwardedLink, 'grey');
                setLinkColor(contractSigningLink, 'grey');
                setLinkColor(projectMilestonesLink, 'grey');
                setLinkColor(projectCompletionLink, 'grey');
                break;
        }
    }
}

function setLinkColor(link, color) {
    link.style.backgroundColor = color;
    link.style.color = 'white';
    link.style.padding = '10px'; 
    link.style.borderRadius = '20px';
}


function calculateDeadline(deadline) {
    const now = new Date();
    const timeDiff = deadline - now;

    if (timeDiff <= 0) {
        document.getElementById('deadline-timer').textContent = "Deadline passed";
        return;
    }

    const months = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 30));
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    const days = Math.floor((timeDiff % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24));

    if (years > 0) {
        document.getElementById('deadline-timer').textContent =
            `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''} ${days} day${days > 1 ? 's' : ''}`;
    } else if (months >= 1) {
        document.getElementById('deadline-timer').textContent =
            `${remainingMonths} month${remainingMonths > 1 ? 's' : ''} ${days} day${days > 1 ? 's' : ''}`;
    } else {
        document.getElementById('deadline-timer').textContent =
            `${days} day${days > 1 ? 's' : ''}`;
    }
}

const backButton = document.getElementById('back-btn');
backButton.addEventListener('click', function () {
    window.location.href = 'my_project.html';
});

const confirmation = document.getElementById('confirm');
confirmation.addEventListener('click', function () {
    window.location.href = `project_award_confirmation.html?tenderID=${tenderID}`;
});

const signing = document.getElementById('signing');
signing.addEventListener('click', function () {
    window.location.href = `contract_signing.html?tenderID=${tenderID}`;
});

const milestone = document.getElementById('milestone');
milestone.addEventListener('click', function () {
    window.location.href = `project-milestones.html?tenderID=${tenderID}`;
});

const complete = document.getElementById('complete');
complete.addEventListener('click', function () {
    window.location.href = `project_completion.html?tenderID=${tenderID}`;
});
