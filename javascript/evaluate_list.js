const projectContainer = document.getElementById("project-container");

const evaluateList = [
  {
    bidderID: "Bidder ID: Bid_TB4011",
    bidAmount: "Bid Amount: RM38,500",
    status: "Evaluation Pending"
  },
  {
    bidderID: "Bidder ID: Bid_TB3625",
    bidAmount: "Bid Amount: RM 23,200",
    status: "Evaluation Pending"
  },
  {
    bidderID: "Bidder ID: Bid_TB2966",
    bidAmount: "Bid Amount: RM 29,100",
    status: "Evaluation Pending"
  },
  {
    bidderID: "Bidder ID: Bid_TB2034",
    bidAmount: "Bid Amount: RM 19,500",
    status: "Evaluation Pending"
  },
  {
    bidderID: "Bidder ID: Bid_TB1966",
    bidAmount: "Bid Amount: RM 32,700",
    status: "Evaluation Completed"
  },
];

function renderProjects(projects) {
    projectContainer.innerHTML = '';
  
    projects.forEach((project) => {
      const projectDiv = document.createElement("div");
      projectDiv.classList.add("project");
      
      const isCompleted = project.status === "Evaluation Completed";
      const backgroundColor = isCompleted ? "rgba(0, 207, 45, 0.41)" : "rgba(252, 194, 27, 0.34)";
      const textColor = isCompleted ? "#00A424" : "#F79329";
      
      projectDiv.innerHTML = `
        <div class="project-content">
          <div class="project-left">
            <div class="project-title">${project.bidderID}</div>
            <div class="project-details">Tender ID: ${project.bidAmount}</div>
          </div>
          <div class="project-right">
            <div class="status fw-bold" 
                 style="background-color: ${backgroundColor}; color: ${textColor}; padding: 20px 20px; border-radius: 10px; white-space: nowrap; text-align: center;">
              ${project.status}
            </div>
            <div class="next-button" onclick="navigateToProject('${project.bidderID}')">
              <i class="fas fa-arrow-right"></i>
            </div>
          </div>
        </div>
      `;
  
      projectContainer.appendChild(projectDiv);
    });
  }
  

function navigateToProject(bidderID) {
  if (bidderID === "Bidder ID: Bid_TB2034") {
    window.location.href = 'evaluation.html';
  }
}

renderProjects(evaluateList);