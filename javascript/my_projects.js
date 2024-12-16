const filterForm = document.getElementById('filterForm');
const filterSummary = document.getElementById('filter-summary');
const applyFilterButton = document.getElementById('applyFilter');
const projectContainer = document.getElementById("project-container");
const tabs = document.querySelectorAll('.tab');

let countdownInterval; 
let awardedProjects = [];
let biddingProjects = [];

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

    tabs[0].classList.add('active');

    awardedProjects = await fetchAwardedProjects(contract, signer); // Fetch awarded projects
    biddingProjects = await fetchBiddingProjects(contract, signer);
    startCountdown(); // Start rendering projects and countdown
  } else {
    alert("Please install MetaMask to interact with the blockchain.");
  }
};

// Fetch awarded projects
async function fetchAwardedProjects(contract, signer) {
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

      const projectWinner = tenderData[10]; // Winner address
      const status = tenderData[9]; // Status (e.g., awarded)

      const randomStatus = Math.floor(Math.random() * (90 - 20 + 1)) + 20;

      if (status === 3 && projectWinner === signerAddress) { 
        awardedProjects.push({
          title: tenderData[2], 
          tenderId: tenderData[1], 
          deadline: new Date(tenderData[7] * 1000).toISOString().split('T')[0], 
          progress: randomStatus, 
          progressText: `Progress ${randomStatus}%`,
          progressColor: getProgressColor(randomStatus)
        });
      }
    }
    console.log('Awarded projects:', awardedProjects);
    return awardedProjects;
  } catch (error) {
    console.error("Error fetching awarded projects:", error);
    return [];
  }
}

// Fetch bidding projects that belong to the signer and are Open
async function fetchBiddingProjects(contract, signer) {
  try {
    const signerAddress = await signer.getAddress();
    
    // Fetch the total number of tenders
    const count = await contract.getTenderCount();
    const tenderCount = count.toNumber();
    const biddingProjects = [];
    
    // Iterate through all tenders to get the bids for each one
    for (let i = 0; i < tenderCount; i++) {
      // Get the tender ID (or any identifier for each tender)
      const tenderID = await contract.tenderIDs(i);
      
      // Get the basic information of the tender, including its status
      const tenderInfo = await contract.getTenderBasicInfo(tenderID);
      const tenderStatus = tenderInfo[9]; // Assuming the status is at index 9 in the return values (based on your contract structure)
      const validDate = tenderInfo[8];

      // Only process the tender if it's Open (status 0)
      if (tenderStatus === 0) {
        // Get all bids for this tender
        const bids = await contract.getBids(tenderID);
        
        // Filter bids that belong to the signer
        const userBids = bids.filter(bid => bid.bidder.toLowerCase() === signerAddress.toLowerCase());
        
        // Map the filtered bids to a simpler structure
        const mappedBids = userBids.map(bid => ({
          title: bid.title,
          tenderId: tenderID,
          bidAmount: bid.amount/1000000000000000000,
          proposalValidityExpiry: new Date(validDate * 1000).toISOString().split('T')[0],
          status: bid.status,  
          subStatus: bid.subStatus || '' 
        }));
        
        // Add to the bidding projects
        biddingProjects.push(...mappedBids);
      }
    }
    console.log('Bidding projects:', biddingProjects);
    return biddingProjects;
  } catch (error) {
    console.error("Error fetching bidding projects:", error);
    return [];
  }
}

function calculateTimeLeft(deadline) {
  const currentDate = new Date();
  const deadlineDate = new Date(deadline);
  const timeDiff = deadlineDate - currentDate;

  if (timeDiff <= 0) return "Deadline passed";

  const months = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 30));
  const days = Math.floor((timeDiff % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24));
  return months >= 1 ? `${months} month${months > 1 ? 's' : ''} ${days} day${days > 1 ? 's' : ''}` : `${days} day${days > 1 ? 's' : ''}`;
}

function formatDeadline(dateString) {
  const date = new Date(dateString);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`;
}

function renderProjects(projects, type) {
  projectContainer.innerHTML = '';

  // Check if there are no projects to display
  if (projects.length === 0) {
    projectContainer.innerHTML = '<p class="no-projects-message">Currently, there are no projects available to display.</p>';
    return;
  }

  projects.forEach((project, index) => {
    let projectDiv = document.createElement("div");
    projectDiv.classList.add("project");

    if (type === 'awarded') {
      const radius = 27.5;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (project.progress / 100) * circumference;
      projectDiv.innerHTML = `
  <a href="ap_progress.html?tenderID=${project.tenderId}" style="text-decoration: none; color: inherit;">
    <div class="project-content">
      <div class="project-left">
        <div class="project-title">${project.title}</div>
        <div class="project-details">Tender ID: ${project.tenderId}</div>
        <div class="project-details">Deadline: ${formatDeadline(project.deadline)}</div>
        <div class="project-details" id="time-left-${index}">
          <i class="fas fa-clock"></i> Calculating...
        </div>
      </div>
      <div class="project-right">
        <div class="progress-circle ${project.progressColor}">
          <svg width="120" height="120" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="${radius}" stroke="#e6e6e6" stroke-width="5" fill="none"></circle>
            <circle cx="30" cy="30" r="${radius}" stroke="${project.progressColor}" stroke-width="5" fill="none"
              stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"></circle>
          </svg>
          <p class="progress-percent" style="color: ${project.progressColor};">${project.progressText}</p>
        </div>
      </div>
    </div>
  </a>`;

    } else {
      projectDiv.innerHTML = `
        <a href="bp_progress.html?tenderID=${project.tenderId}" style="text-decoration: none; color: inherit;">
          <div class="project-content-a">
            <div class="project-left">
              <div class="project-title">${project.title}</div>
              <div class="project-details">Tender ID: ${project.tenderId}</div>
              <div class="project-details">Bid Amount: RM ${project.bidAmount}</div>
              <div class="project-details">Proposal Validity Expiry: ${formatDeadline(project.proposalValidityExpiry)}</div>
              <div class="project-details" id="time-left-${index}">
                <i class="fas fa-clock"></i> Calculating...
              </div>
            </div>
            <div class="project-status">
              <span class="status-text">${project.status || 'Pending'}</span>
            </div>
          </div>
        </a>`;
    }
    projectContainer.appendChild(projectDiv);
  });
}

function startCountdown() {
  const activeTab = document.querySelector('.tab.active').dataset.tab;

  const projectsToRender = activeTab === 'awarded' ? awardedProjects : biddingProjects;

  if (countdownInterval) clearInterval(countdownInterval);

  renderProjects(projectsToRender, activeTab);

  countdownInterval = setInterval(() => {
    projectsToRender.forEach((project, index) => {
      const timeLeftElement = document.getElementById(`time-left-${index}`);
      if (timeLeftElement) {
        timeLeftElement.innerHTML = `<i class="fas fa-clock"></i> ${calculateTimeLeft(project.deadline || project.proposalValidityExpiry)}`;
      }
    });
  }, 1000);
}

function getProgressColor(progress){
  if (progress >= 80 ){
    return 'green';
  }else if (progress >= 50 && progress < 80){
    return 'lightblue';
  }else if (progress >=30 && progress < 50){
    return 'orange';
  }else{
    return 'red';
  }
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    startCountdown();
  });
});

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