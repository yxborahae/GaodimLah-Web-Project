const projectContainer = document.getElementById("project-container");
const titleContainer = document.getElementById("title");
const deadlineContainer = document.getElementById("deadline");
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

  if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []); 
    const signer = provider.getSigner();
    contract = new ethers.Contract(contractAddress, contractABI, signer);
    console.log("Connected to contract:", contractAddress);

    projects = await fetchBiddingProjects(contract, signer); // Fetch projects
    
    let tenderData = await contract.getTenderBasicInfo(tenderID);
    title = tenderData[2];
    deadline = new Date(tenderData[7] * 1000);

    calculateDeadline(deadline);

    renderProjects(title, projects);
  } else {
    alert("Please install MetaMask to interact with the blockchain.");
  }
};

// Fetch bidding projects that belong to the signer and are Open
async function fetchBiddingProjects(contract, signer) {
  console.log('Fetching bids for tenderID: ' + tenderID);

  const projects = []; // To store mapped bid data

  try {
    // Fetch all bids for the specified tenderID
    const bids = await contract.getBids(tenderID);
    const bidCount = bids.length;

    console.log('Number of bids for this tender: ' + bidCount);

    // Map each bid to a simpler structure
    for (let i = 0; i < bidCount; i++) {
      const bid = bids[i];
      
      projects.push({
        bidID: bid.bidID,
        bidder: bid.bidder,
        amount: Number(bid.amount) / 1e18, 
        submitDate: new Date(Number(bid.submitDate) * 1000).toLocaleString(),
        status: 'Pending'
      });
    }

    console.log('Bidding projects:', projects);
    return projects;
  } catch (error) {
    console.error("Error fetching bidding projects:", error);
    return [];
  }
}

function renderProjects(title, projects) {
    projectContainer.innerHTML = '';

    titleContainer.innerHTML = `<h3 class="fw-bold" id="title">${title}</h3>`;

    // Check if there are no projects to display
    if (projects.length === 0) {
      projectContainer.innerHTML = '<p class="no-projects-message">Sorry, there is no bid submitted for this project.</p>';
      return;
    }

    projects.forEach((project) => {
      const projectDiv = document.createElement("div");
      projectDiv.classList.add("project");
      
      const isCompleted = project.status === "Evaluation Completed";
      const backgroundColor = isCompleted ? "rgba(0, 207, 45, 0.41)" : "rgba(252, 194, 27, 0.34)";
      const textColor = isCompleted ? "#00A424" : "#F79329";
      
      projectDiv.innerHTML = `
        <a href="evaluation.html?tenderID=${project.tenderId}" style="text-decoration: none; color: inherit;">
          <div class="project-content">
            <div class="project-left">
              <div class="project-title">Bidder ID: ${project.bidder}</div>
              <div class="project-details">Bid Amount: RM ${project.amount}</div>
              <div class="project-details">Submit Date:: ${project.submitDate}</div>
              <div class="project-details">Bid ID: ${project.bidID}</div>
            </div>
            <div class="project-right">
              <div class="status fw-bold" 
                  style="background-color: ${backgroundColor}; color: ${textColor}; padding: 20px 20px; border-radius: 10px; white-space: nowrap; text-align: center;">
                ${project.status}
              </div>
            </div>
          </div>
        </a>
      `;
  
      projectContainer.appendChild(projectDiv);
    });
  }

const backButton = document.getElementById('back-btn');

backButton.addEventListener('click', function () {
    window.location.href = 'evaluate_project.html';
});

function calculateDeadline(deadline) {

    const now = new Date();
    const timeDiff = deadline - now;
    const daysLeft = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const monthsLeft = Math.floor(daysLeft / 30);
    const remainingDays = daysLeft % 30;
    const date= deadline.toISOString().split('T')[0];
    deadlineContainer.innerHTML = `<p id="deadline">Deadline: ${date} </p>`;
    document.getElementById('deadline-timer').textContent =
        `${monthsLeft} months ${remainingDays} days`;
}
