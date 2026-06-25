document.addEventListener('DOMContentLoaded', () => {
            // 1. Sticky Header Functionality
            const header = document.getElementById('header');
            window.addEventListener('scroll', () => {
                if (window.scrollY > 50) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            });

            // 2. Mobile Menu Toggle
            const hamburger = document.getElementById('hamburger');
            const navMenu = document.getElementById('nav-menu');
            hamburger.addEventListener('click', () => {
                navMenu.classList.toggle('show');
                const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
                hamburger.setAttribute('aria-expanded', !isExpanded);
            });

            // 3. Cinematic Hero Slider Logic
            const slides = document.querySelectorAll('.slide');
            const nextBtn = document.querySelector('.slider-btn.next');
            const prevBtn = document.querySelector('.slider-btn.prev');
            let currentSlide = 0;

            function goToSlide(index) {
                slides[currentSlide].classList.remove('active');
                currentSlide = (index + slides.length) % slides.length;
                slides[currentSlide].classList.add('active');
            }

            nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));
            prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));

            // Auto-advance slider every 7 seconds
            setInterval(() => {
                goToSlide(currentSlide + 1);
            }, 7000);

            

            // 4. Scroll Reveal Animations via Intersection Observer
            const observerOptions = {
                root: null,
                rootMargin: '0px',
                threshold: 0.15
            };

            const revealObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                        observer.unobserve(entry.target); // Run once
                    }
                });
            }, observerOptions);

            const animatableElements = document.querySelectorAll('.animate-on-scroll');
            animatableElements.forEach(el => revealObserver.observe(el));
        });

        // Artistic Preloader Logic
        window.addEventListener('load', () => {
            const preloader = document.getElementById('citam-preloader');
            
            if (preloader) {
                // Wait an extra 800ms so the text blur-reveal finishes nicely
                setTimeout(() => {
                    preloader.classList.add('preloader-hidden');
                    
                    // Remove from DOM strictly after the 1-second CSS fade completes
                    setTimeout(() => {
                        preloader.style.display = 'none';
                    }, 1000); 
                }, 800); 
            }
        });

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