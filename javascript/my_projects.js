const filterForm = document.getElementById('filterForm');
const filterSummary = document.getElementById('filter-summary');
const applyFilterButton = document.getElementById('applyFilter');
const projectContainer = document.getElementById("project-container");
const tabs = document.querySelectorAll('.tab');

let countdownInterval; 

applyFilterButton.addEventListener('click', () => {
  const category = document.getElementById('category').value;
  const date = document.getElementById('date').value;

  const categoryText = category ? `Category: ${category}` : 'No category selected';
  const dateText = date ? `Project Deadline: ${new Date(date).toLocaleString('default', { month: 'long', year: 'numeric' })}` : 'No date selected';

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

const awardedProjects = [
  {
    title: "EDUCATION SOFTWARE SYSTEM",
    tenderId: "T2023-002",
    deadline: "2025-01-17",
    progress: 90,
    progressText: "Progress 90%",
    progressColor: 'green'
  },
  {
    title: "WEB APP DEVELOPMENT",
    tenderId: "T2023-037",
    deadline: "2025-06-20",
    progress: 65,
    progressText: "Progress 65%",
    progressColor: 'yellow'
  },
  {
    title: "CITIZEN ENGAGEMENT PORTAL",
    tenderId: "T2024-054",
    deadline: "2025-12-01",
    progress: 25,
    progressText: "Progress 25%",
    progressColor: 'orange'
  },
  {
    title: "PUBLIC BUDGET TRACKER APPLICATION",
    tenderId: "T2024-102",
    deadline: "2026-05-05",
    progress: 5,
    progressText: "Progress 5%",
    progressColor: 'red'
  }
];

const biddingProjects = [
  {
    title: "PUBLIC COMPLAINT MANAGEMENT SYSTEM",
    tenderId: "T2024-135",
    bidAmount: "RM 29,500",
    proposalValidityExpiry: "2025-01-07",
    status: "Final Evaluation Pending",
    subStatus: "awaiting final decision from the tender committee"
  },
  {
    title: "CLOUD HOSTING SERVICES FOR BROADCASTING CONTENT STORAGE",
    tenderId: "T2024-148",
    bidAmount: "RM 152,800",
    proposalValidityExpiry: "2025-02-17",
    status: "Proposal Submitted",
    subStatus: ""
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


function renderProjects(projects, type) {
  projectContainer.innerHTML = '';

  projects.forEach((project, index) => {
    let projectDiv;
    if (type === 'awarded') {
      const radius = 27.5;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (project.progress / 100) * circumference;

      projectDiv = document.createElement("div");
      projectDiv.classList.add("project");
      projectDiv.innerHTML = `
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
          <div class="next-button" onclick="navigateToProject('${project.title}')">
            <i class="fas fa-arrow-right"></i>
          </div>
        </div>
      </div>
      `;
    } else if (type === 'bidding') {
      projectDiv = document.createElement("div");
      projectDiv.classList.add("project");
      projectDiv.innerHTML = `
      <div class="project-content">
        <div class="project-left">
          <div class="project-title">${project.title}</div>
          <div class="project-details">Tender ID: ${project.tenderId}</div>
          <div class="project-details">Bid Amount: ${project.bidAmount}</div>
          <div class="project-details">Proposal Validity Expiry: ${formatDeadline(project.proposalValidityExpiry)}</div>
          <div class="project-details" id="time-left-${index}">
            <i class="fas fa-clock"></i> Calculating...
          </div>
        </div>
        <div class="project-right">
        <div class="status fw-bold" style="background-color: #CEB8F0; color: #4550DA; padding: 20px 20px; border-radius: 10px; white-space: nowrap; text-align: center;">
        ${project.status}
        <div style="color: black; font-weight: 100; font-style: italic; font-size: 12px; padding-top:10px;">${project.subStatus}</div>

      </div>
          <div class="next-button">
            <i class="fas fa-arrow-right"></i>
          </div>
        </div>
      </div>
      `;
    }

    projectContainer.appendChild(projectDiv);
  });
}

function navigateToProject(title) {
  if (title === "EDUCATION SOFTWARE SYSTEM") {
    window.location.href = 'ap_progress.html';
  }
}


function startCountdown() {
  const activeTab = document.querySelector('.tab.active').dataset.tab;
  const projectsToRender = activeTab === 'awarded' ? awardedProjects : biddingProjects;
  
 
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  renderProjects(projectsToRender, activeTab);

 
  countdownInterval = setInterval(() => {
    projectsToRender.forEach((project, index) => {
      const timeLeftElement = document.getElementById(`time-left-${index}`);
      timeLeftElement.innerHTML = `<i class="fas fa-clock"></i> ${calculateTimeLeft(project.deadline || project.proposalValidityExpiry)}`;
    });
  }, 1000); 
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    startCountdown(); 
  });
});

startCountdown(); 
