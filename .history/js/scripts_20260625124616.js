
// Cookie Consent Logic
document.addEventListener('DOMContentLoaded', () => {
    const cookieBanner = document.getElementById('cookie-consent-banner');
    const acceptBtn = document.getElementById('accept-cookies');
    const declineBtn = document.getElementById('decline-cookies');

    // Check if the user has already made a choice
    const cookieConsent = localStorage.getItem('citam_cookie_consent');

    if (!cookieConsent && cookieBanner) {
        // Delay showing the banner slightly so it doesn't fight with the preloader
        setTimeout(() => {
            cookieBanner.classList.add('show-banner');
        }, 2000); // Shows 2 seconds after page load
    }

    // Handle Accept
    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
            localStorage.setItem('citam_cookie_consent', 'accepted');
            cookieBanner.classList.remove('show-banner');
        });
    }

    // Handle Decline
    if (declineBtn) {
        declineBtn.addEventListener('click', () => {
            localStorage.setItem('citam_cookie_consent', 'declined');
            cookieBanner.classList.remove('show-banner');
        });
    }
});

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