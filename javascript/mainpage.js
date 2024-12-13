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
