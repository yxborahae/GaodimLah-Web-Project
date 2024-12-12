function calculateDeadline() {
    const deadline = new Date("2025-01-17");
    const now = new Date();
    const timeDiff = deadline - now;
    const daysLeft = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const monthsLeft = Math.floor(daysLeft / 30);
    const remainingDays = daysLeft % 30;

    document.getElementById('deadline-timer').textContent =
        `${monthsLeft} months ${remainingDays} days`;
}

calculateDeadline();