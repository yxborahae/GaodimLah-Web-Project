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
        const [tenderFields] = await contract.getTenderFieldsAndLocality(tenderID);
        const [, locality] = await contract.getTenderFieldsAndLocality(tenderID);
        
        console.log("Tender details fetched:", result); // Debugging: log result

        console.log("Qualification Fields:", tenderFields);
        
        console.log("Locality", locality);

        // Destructure the result based on the smart contract return values
        const [creator, tenderIDFromContract, title, ministry, budget, publishDate, closingDate, deadline, validDate, status, projectWinner] = result;

        // Update HTML with fetched data
        document.getElementById('procurement-title').innerHTML = `<strong>Procurement Title:</strong> [FTA(CPTPP)] TENDER FOR CLOUD INFRASTRUCTURE AND DATA HOSTING SERVICES FOR THREE (3) YEARS FOR THE DEPARTMENT OF BROADCASTING MALAYSIA `;
        document.getElementById('tender-details').innerHTML = `
            <p>Tender ID: ${tenderID}</p>
            <p>Tender Project Name: ${title}</p>
            <p>Ministry: ${ministry}</p>
            <p>PTJ: Information Technology Division</p>
            <p>Procurement Method: Quotation</p>
            <p>Briefing / Site Visit: No</p>
            <p>Estimated Price: RM ${formatPrice(budget)}</p>
        `;

        const publishDateFormatted = new Date(publishDate * 1000);
        const closingDateFormatted = new Date(closingDate * 1000);
        const validDateFormatted = new Date(validDate * 1000);

        document.getElementById('dates').innerHTML = `
            Publish Date: ${publishDateFormatted.toLocaleDateString()} <br>
            Closing Date: ${closingDateFormatted.toLocaleDateString()}
        `;

        document.getElementById('proposal-validity').innerHTML = `
            Proposal Validity Expiry:: ${validDateFormatted.toLocaleDateString()}
        `;

        // Supplier Qualification - Check if qualificationCriteria is an array
        if (Array.isArray(tenderFields) && tenderFields.length > 0) {
            const criteriaHTML = tenderFields.map(criteria => `<p>${criteria}</p>`).join('');
            document.getElementById('supplier-criteria').innerHTML = criteriaHTML;
        } else {
            console.warn("Qualification criteria is not an array or is empty:", qualifiedFields);
            document.getElementById('supplier-criteria').innerHTML = "<p>No qualification criteria available.</p>";
        }

        // Locality - Check if locality is an array
        if (Array.isArray(locality) && locality.length > 0) {
            const localityHTML = locality.map(locality => `<p>${locality}</p>`).join('');
            document.getElementById('locality').innerHTML = localityHTML;
        } else {
            console.warn("locality is not an array or is empty:", qualifiedFields);
            document.getElementById('locality').innerHTML = "<p>No locality available.</p>";
        }

        // Timer Logic
        calculateDeadline(new Date(closingDate * 1000), "deadline-timer-1");
        calculateDeadline(new Date(validDate * 1000), "deadline-timer-2");

        // Bid Button Logic
        const bidButton = document.getElementById("bid-btn");

        if (status === 0) { // Tender is open (status = 0)
            bidButton.style.display = "block"; // Show the bid button
        } else {
            bidButton.style.display = "none"; // Hide the bid button
        }
        
    } catch (err) {
        console.error("Error fetching tender details:", err);
        alert("Unable to fetch tender details. Check console for more info.");
    }
}

function calculateDeadline(deadlineDate, elementId) {
    const deadline = new Date(deadlineDate);
    const now = new Date();
    const timeDiff = deadline - now;

    // Ensure the element exists
    const deadlineElement = document.getElementById(elementId);
    if (!deadlineElement) {
        console.error(`Element with id ${elementId} not found.`);
        return;
    }

    if (timeDiff < 0) {
        deadlineElement.textContent = "Deadline passed";
        return;
    }

    const daysLeft = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const monthsLeft = Math.floor(daysLeft / 30);
    const yearsLeft = Math.floor(monthsLeft / 12);
    const remainingMonths = monthsLeft % 12;
    const remainingDays = daysLeft % 30;

    if (yearsLeft > 0) {
        if (remainingMonths > 0) {
            deadlineElement.textContent = `${yearsLeft} year${yearsLeft > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''} ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
        } else {
            deadlineElement.textContent = `${yearsLeft} year${yearsLeft > 1 ? 's' : ''} ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
        }
    } else if (monthsLeft >= 1) {
        deadlineElement.textContent = `${remainingMonths} month${remainingMonths > 1 ? 's' : ''} ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
    } else {
        deadlineElement.textContent = `${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
    }
}


function formatPrice(price) {
    if (price === undefined || price === null) {
        return "Not available";  // Provide a fallback if price is missing
    }

    try {
        // Convert price to a BigNumber and then format it
        return ethers.utils.formatUnits(price, "ether");
    } catch (error) {
        console.error("Error formatting price:", error);
        return "Invalid price format";
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const bidButton = document.getElementById("bid-btn");

    let provider;
    let signer;
    let contractAddress;
    let contractABI;
    let contract;

    // Load ABI and address from abi.json
    try {
        const response = await fetch("../abi.json");
        if (!response.ok) {
            throw new Error("Failed to load ABI file.");
        }
        const contractData = await response.json();
        contractAddress = contractData.address;
        contractABI = contractData.abi;
        console.log("Contract data loaded successfully:", contractData);
    } catch (error) {
        console.error("Error loading ABI file:", error);
        return; // Prevent further execution if ABI can't be loaded
    }

    // Check if the bidButton exists in the DOM
    if (!bidButton) {
        console.error("Error: The bid button was not found in the DOM.");
        return; // Prevent further code execution if the button is not found
    }

    bidButton.addEventListener("click", async () => {
        try {
            if (window.ethereum) {
                // Request connection to MetaMask
                provider = new ethers.providers.Web3Provider(window.ethereum);
                await provider.send("eth_requestAccounts", []);
                signer = provider.getSigner();
                const address = await signer.getAddress();
                console.log(`Wallet connected: ${address}`);

                // Instantiate the contract
                contract = new ethers.Contract(contractAddress, contractABI, signer);

                // Check if user is registered
                const userData = await contract.getUser(address);

                const tenderID = new URLSearchParams(window.location.search).get('tenderID');
                
                if (userData.isRegistered) {
                        window.location.href = `./bid_participation_form.html?tenderID=${tenderID}`; // Redirect to form page
                } else {
                    alert("You don't have an account. Please sign up.");
                }
            } else {
                alert("MetaMask is not installed. Please install MetaMask and try again.");
            }
        } catch (error) {
            console.error("Error connecting wallet:", error);
            alert("An error occurred. Please check the console for details.");
        }
    });
});
