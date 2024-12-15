const filterForm = document.getElementById('filterForm');
const filterSummary = document.getElementById('filter-summary');
const applyFilterButton = document.getElementById('applyFilter');
const projectContainer = document.getElementById("project-container");

let countdownInterval; 
let projects = [];

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

    projects = await fetchProjects(contract, signer); // Fetch projects
    startCountdown(); // Start rendering projects and countdown
  } else {
    alert("Please install MetaMask to interact with the blockchain.");
  }
};

// Fetch awarded projects
async function fetchProjects(contract, signer) {
  try {
    const signerAddress = await signer.getAddress(); // Get current user's address
    const count = await contract.getTenderCount(); // Get total tender count
    const tenderCount = count.toNumber();

    const awardedProjects = [];
    console.log('Number of tenders: ' + tenderCount);

    // Loop through all tenders and filter awarded ones
    for (let i = 0; i < tenderCount; i++) {
      const tenderID = await contract.tenderIDs(i);
      const tenderData = await contract.getTenderBasicInfo(tenderID); // Fetch tender details

      const bids = await contract.getBids(tenderID);
      const bidCount = bids.length;

      console.log('total number of bid: ' + bidCount);

      const projectCreator = tenderData[0]; // Winner address
      const status = tenderData[9]; // Status (e.g., awarded)

      if ((status === 0 || status === 1) && projectCreator === signerAddress) { // Check status and winner
        projects.push({
          title: tenderData[2],
          tenderId: tenderData[1], 
          proposalValidityExpiry: new Date(tenderData[8] * 1000).toISOString().split('T')[0],
          totalBidder: bidCount
        });
      }
    }
    console.log('Projects:', projects);
    return projects;
  } catch (error) {
    console.error("Error fetching awarded projects:", error);
    return [];
  }
}

applyFilterButton.addEventListener('click', () => {
  const category = document.getElementById('category').value;
  const date = document.getElementById('date').value;

  const categoryText = category ? `Category: ${category}` : 'No category selected';
  const dateText = date ? `Proposal Validity Expiry: ${new Date(date).toLocaleString('default', { month: 'long', year: 'numeric' })}` : 'No date selected';

  let categorySummary = document.getElementById('category-summary');
  if (!categorySummary) {
    categorySummary = document.createElement('div');
    categorySummary.id = 'category-summary';
    filterSummary.appendChild(categorySummary);
  }
  categorySummary.textContent = categoryText;

  let dateSummary = document.getElementById('date-summary');
  if (!dateSummary) {
    dateSummary = document.createElement('div');
    dateSummary.id = 'date-summary';
    filterSummary.appendChild(dateSummary);
  }
  dateSummary.textContent = dateText;

  if (category || date) {
    filterSummary.style.display = 'flex';
  } else {
    filterSummary.style.display = 'none';
  }

  const modal = document.getElementById('filterModal');
  const bootstrapModal = bootstrap.Modal.getInstance(modal);
  bootstrapModal.hide();
});

function calculateTimeLeft(deadline) {
  const currentDate = new Date();
  const deadlineDate = new Date(deadline);
  const timeDiff = deadlineDate - currentDate;

  if (timeDiff <= 0) {
    return "Deadline passed";
  }

  const months = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 30)); 
  const years = Math.floor(months / 12); 
  const remainingMonths = months % 12; 

  const days = Math.floor((timeDiff % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24)); 

  if (years > 0 || months >= 1) { 
    if (remainingMonths > 0) {
      return `${years > 0 ? `${years} year${years > 1 ? 's' : ''} ` : ''}${remainingMonths} month${remainingMonths > 1 ? 's' : ''} ${days} day${days > 1 ? 's' : ''}`;
    } else {
      return `${years > 0 ? `${years} year${years > 1 ? 's' : ''} ` : ''}${days} day${days > 1 ? 's' : ''}`;
    }
  } else { 
    return `${days} day${days > 1 ? 's' : ''}`;
  }
}

function formatDeadline(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

function renderProjects(projects) {
  projectContainer.innerHTML = '';

  // Check if there are no projects to display
  if (projects.length === 0) {
    projectContainer.innerHTML = '<p class="no-projects-message">Currently, there are no projects available to display.</p>';
    return;
  }

  projects.forEach((project, index) => {
    const projectDiv = document.createElement("div");
    projectDiv.classList.add("project");
    projectDiv.innerHTML = `
      <a href="evaluate_list.html?tenderID=${project.tenderId}" style="text-decoration: none; color: inherit;">
        <div class="project-content">
          <div class="project-left">
            <div class="project-title">${project.title}</div>
            <div class="project-details">Tender ID: ${project.tenderId}</div>
            <div class="project-details">Total Bidder: ${project.totalBidder}</div>
            <div class="project-details">Number of Bidders Passing Preliminary Evaluation: ${project.totalBidder}</div>
          </div>
          <div class="project-right">
            <div style="background-color: #CEB8F0; padding: 20px 20px; border-radius: 10px; white-space: nowrap; text-align: center;"><div style="color: black; font-weight: 100; font-size: 12px;">Proposal Validity Expiry: ${formatDeadline(project.proposalValidityExpiry)}</div>
              <div class="status fw-bold" id="time-left-${index}" style="color: #4550DA; margin-top: 10px; font-size: 18px;"></div>
            </div>
          </div>
        </div>
      </a>
    `;

    projectContainer.appendChild(projectDiv);
  });
}


function startCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  renderProjects(projects);

  countdownInterval = setInterval(() => {
    projects.forEach((project, index) => {
      const timeLeftElement = document.getElementById(`time-left-${index}`);
      timeLeftElement.innerHTML = `<i class="fas fa-clock"></i> ${calculateTimeLeft(project.proposalValidityExpiry)}`;
    });
  }, 1000); 
}

