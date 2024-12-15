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
    const tenderID = new URLSearchParams(window.location.search).get('tenderID');

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


        document.getElementById('p-title').innerHTML = projectTitle;
        document.getElementById('tender-id').innerHTML = tenderID;
        document.getElementById('deadline').innerHTML = deadline.toLocaleDateString();

        // Timer Logic
        calculateDeadline(deadline);
        
    } catch (err) {
        console.error("Error fetching tender details:", err);
        alert("Unable to fetch tender details. Check console for more info.");
    }
}

// Function to calculate and display the deadline timer
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

// Back button functionality
const backButton = document.getElementById('back-btn');
backButton.addEventListener('click', function () {
    window.location.href = 'my_project.html';
});

