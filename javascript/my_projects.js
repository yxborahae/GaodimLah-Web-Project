const projects = [
    {
      title: "EDUCATION SOFTWARE SYSTEM",
      tenderId: "T2023-002",
      deadline: "17/01/2025",
      timeLeft: "1months 07days",
      progress: 90,
      progressText: "Progress 90%",
      progressColor: 'green'
    },
    {
      title: "WEB APP DEVELOPMENT",
      tenderId: "T2023-037",
      deadline: "20/06/2025",
      timeLeft: "6months 20days",
      progress: 65,
      progressText: "Progress 65%",
      progressColor: 'yellow'
    },
    {
      title: "CITIZEN ENGAGEMENT PORTAL",
      tenderId: "T2024-054",
      deadline: "01/12/2025",
      timeLeft: "11months 08days",
      progress: 25,
      progressText: "Progress 25%",
      progressColor: 'orange'
    },
    {
      title: "PUBLIC BUDGET TRACKER APPLICATION",
      tenderId: "T2024-102",
      deadline: "05/05/2026",
      timeLeft: "1year",
      progress: 5,
      progressText: "Progress 5%",
      progressColor: 'red'
    }
  ];
  
  const projectContainer = document.getElementById("project-container");
  
  function renderProjects() {
    projectContainer.innerHTML = '';
  
    projects.forEach(project => {
      const projectDiv = document.createElement("div");
      projectDiv.classList.add("project");
      const radius = 27.5; 
      const circumference = 2 * Math.PI * radius; 
      const offset = circumference - (project.progress / 100) * circumference; 
  
      projectDiv.innerHTML = `
      <div class="project-content">
      <div class="project-left">
        <div class="project-title">${project.title}</div>
        <div class="project-details">Tender ID: ${project.tenderId}</div>
        <div class="project-details">Deadline: ${project.deadline}</div>
        <div class="project-details">
          <i class="fas fa-clock"></i> ${project.timeLeft}
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
        <div class="next-button">
          <i class="fas fa-arrow-right"></i>
        </div>
      </div>
    </div>
      `;
  
      projectContainer.appendChild(projectDiv);
    });
  }
  
  renderProjects();
  
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });