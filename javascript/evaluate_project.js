const filterForm = document.getElementById('filterForm');
const filterSummary = document.getElementById('filter-summary');
const applyFilterButton = document.getElementById('applyFilter');
const projectContainer = document.getElementById("project-container");

let countdownInterval; 

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

const evaluateProjects = [
  {
    title: "PUBLIC COMPLAINT MANAGEMENT SYSTEM",
    tenderId: "T2024-135",
    totalBidder: "50",
    noBidder_1round: "20",
    proposalValidityExpiry: "2025-01-07",
  },
  {
    title: "CLOUD HOSTING SERVICES FOR BROADCASTING CONTENT STORAGE",
    tenderId: "T2024-148",
    totalBidder: "35",
    noBidder_1round: "15",
    bidAmount: "RM 152,800",
    proposalValidityExpiry: "2025-02-17",
  },
];

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

  projects.forEach((project, index) => {
    const projectDiv = document.createElement("div");
    projectDiv.classList.add("project");
    projectDiv.innerHTML = `
      <div class="project-content">
        <div class="project-left">
          <div class="project-title">${project.title}</div>
          <div class="project-details">Tender ID: ${project.tenderId}</div>
          <div class="project-details">Total Bidder: ${project.totalBidder}</div>
          <div class="project-details">Number of Bidders Passing Preliminary Evaluation: ${project.noBidder_1round}</div>
        </div>
        <div class="project-right">
          
          <div style="background-color: #CEB8F0; padding: 20px 20px; border-radius: 10px; white-space: nowrap; text-align: center;"><div style="color: black; font-weight: 100; font-size: 12px;">Proposal Validity Expiry: ${formatDeadline(project.proposalValidityExpiry)}</div>
            <div class="status fw-bold" id="time-left-${index}" style="color: #4550DA; margin-top: 10px; font-size: 18px;"></div>
          </div>
          <div class="next-button" onclick="navigateToProject('${project.title}')">
            <i class="fas fa-arrow-right"></i>
          </div>
        </div>
      </div>
    `;

    projectContainer.appendChild(projectDiv);
  });
}

function navigateToProject(title) {
  if (title === "CLOUD HOSTING SERVICES FOR BROADCASTING CONTENT STORAGE") {
    window.location.href = 'evaluate_list.html';
  }
}

function startCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  renderProjects(evaluateProjects);

  countdownInterval = setInterval(() => {
    evaluateProjects.forEach((project, index) => {
      const timeLeftElement = document.getElementById(`time-left-${index}`);
      timeLeftElement.innerHTML = `<i class="fas fa-clock"></i> ${calculateTimeLeft(project.proposalValidityExpiry)}`;
    });
  }, 1000); 
}

startCountdown();
