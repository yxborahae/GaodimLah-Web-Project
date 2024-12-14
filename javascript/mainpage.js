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
        await provider.send("eth_requestAccounts", []); 
        const signer = provider.getSigner();
        contract = new ethers.Contract(contractAddress, contractABI, signer);
        console.log("Connected to contract:", contractAddress);

        loadTenders(contract);
    } else {
        alert("Please install MetaMask to interact with the blockchain.");
    }
}

async function loadTenders(contract) {
    try {
        // Get the length of the tenderIDs array
        const count = await contract.getTenderCount();  // Get the total count of tenders
        const tenderCount = count.toNumber();
        console.log("Number of Tender:", tenderCount);
        
        // Loop through the tenderIDs and fetch each tender
        for (let i = 0; i < tenderCount; i++) {
            // Get the tender ID at index 'i'
            const tenderID = await contract.tenderIDs(i);  // Access each tender ID by index

            const tenderData = await contract.getTenderBasicInfo(tenderID);
            console.log("Tender Data:", tenderData);
            const tenderStatus = tenderData[9]; 
            console.log(tenderStatus);
            const tenderCard = createTenderCard(tenderData, tenderID);

            // Append the tender card to the appropriate section based on its status
            switch (tenderStatus) {
                case 0: // Open
                    document.getElementById('Ongoing').appendChild(tenderCard);
                    break;
                case 1: // Closed
                    document.getElementById('Closed').appendChild(tenderCard);
                    break;
                case 2: // Cancelled
                    document.getElementById('Cancelled').appendChild(tenderCard);
                    break;
                case 3: // Awarded
                    document.getElementById('Awarded').appendChild(tenderCard);
                    break;
                default:
                    break;
            }
            
        }
        // Display "No tender" messages for empty sections
        ['Ongoing', 'Closed', 'Awarded', 'Cancelled'].forEach(displayNoTenderMessage);
        

    } catch (error) {
        console.error("Error loading tenders: ", error);
    }
}

// Function to create a tender card element dynamically
function createTenderCard(tenderData, tenderID) {
    const card = document.createElement('div');
    card.classList.add('project-card');

    const cardImage = document.createElement('img');
    cardImage.src = "../images/satellite.jpg"; // Placeholder image, update as needed
    cardImage.alt = tenderData[2];

    const cardContent = document.createElement('div');
    const title = document.createElement('h4');
    title.innerText = tenderData[2]; // Tender title

    const date = document.createElement('span');
    date.innerText = new Date(tenderData[6] * 1000).toLocaleDateString(); // Convert timestamp to date

    // Apply status color styles dynamically based on tender status
    switch (tenderData[9]) {
        case 0: // Open
            date.style.color = '#4651E3'; // Blue color for open tenders
            break;
        case 1: // Closed
            date.style.color = '#A40000'; // Red color for closed tenders
            break;
        case 2: // Cancelled
            date.style.color = '#D9D9D9'; // Grey color for cancelled tenders
            title.style.color = '#D9D9D9'; // Strikethrough cancelled tenders
            title.style.textDecoration = 'line-through';
            break;
        case 3: // Awarded
            date.style.color = '#4651E3'; // Blue color for awarded tenders
            break;
        default:
            break;
    }

    cardContent.appendChild(title);
    cardContent.appendChild(date);
    card.appendChild(cardImage);
    card.appendChild(cardContent);

    card.addEventListener('click', () => {
        window.location.href = `ongoing_project.html?tenderID=${tenderID}`; // Redirect to the project details page
    });

    return card;
}


// Function to display "No Tender Project Yet" message if there are no tenders in a section
function displayNoTenderMessage(sectionId) {
    const div = document.getElementById(sectionId);
    console.log('Div:', div);  // Debugging log to check if the element is found
    if (!div.children.length) {
        const message = document.createElement('div');
        message.classList.add('no-tender-message');
        message.innerText = "No tender projects available.";
        div.appendChild(message);
    }
}


function navigateTo(sectionId, button) {
    // Scroll to the section
    document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });

    // Update active class on the buttons
    const tabs = document.querySelectorAll('.tabs button');
    tabs.forEach(tab => tab.classList.remove('active'));
    button.classList.add('active');
}

function redirectToProject() {
    window.location.href = "ongoing_project.html";
}