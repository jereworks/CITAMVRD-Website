

// Run the check on page load
document.addEventListener('DOMContentLoaded', () => {
    const popup = document.getElementById('announcement-popup');
    const ignoreBtn = document.getElementById('nudge-ignore');
    
    const checkVisibility = () => {
        const lastDismissed = localStorage.getItem('nudgeDismissed');
        const now = new Date().getTime();
        
        // 3 minutes = 180,000 milliseconds
        if (!lastDismissed || (now - lastDismissed > 180000)) {
            setTimeout(() => { popup.classList.add('show'); }, 3000); // Show after 3s delay
        }
    };

    ignoreBtn.addEventListener('click', () => {
        localStorage.setItem('nudgeDismissed', new Date().getTime());
        popup.classList.remove('show');
    });

    // Run the check
    checkVisibility();
});