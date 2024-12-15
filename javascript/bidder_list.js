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

        console.log('project title: ' + projectTitle);

        document.getElementById('p-title').innerHTML = projectTitle;
        document.getElementById('tender-id').innerHTML = tenderID;
        
        // Fetch the bids for the tender
        const bids = await contract.getBids(tenderID);
        
        // Get the table body element
        const tbody = document.querySelector('table.bidder-table tbody');
        tbody.innerHTML = ''; // Clear the table body first

        for (let i = 0; i < bids.length; i++) {
            const bid = bids[i];

            // Fetch bidder's company name using the bidder address (from the bid)
            const bidderDetails = await contract.getUser(bid.bidder);
            const companyName = bidderDetails.companyName; // Get the company name from the User struct

            // Create a row for the table
            const row = document.createElement('tr');
            
            // Add the columns for bid number, bidder company (company name), and bid amount
            row.innerHTML = `
                <td>${i + 1}</td>
                <td>${companyName}</td> <!-- Display the bidder's company name -->
                <td>RM ${ethers.utils.formatUnits(bid.amount, 18)}</td>
            `;
            
            // Append the row to the table body
            tbody.appendChild(row);
        }

        const backButton = document.getElementById('back-btn');
        backButton.addEventListener('click', function () {
            window.location.href = `bp_progress.html?tenderID=${tenderID}`;
        });

    } catch (err) {
        console.error("Error fetching tender details:", err);
        alert("Unable to fetch tender details. Check console for more info.");
    }
}
