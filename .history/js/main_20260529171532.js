/**
 * CITAM Valley Road - Core Application Engine
 * Operational Execution Module
 */

document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       1. SCROLL-AWARE NAVIGATION HEADER TRANSITIONS
       ========================================================================== */
    const header = document.getElementById('header');
    const scrollThreshold = 60;
    
    const evaluateHeaderState = () => {
        if (window.scrollY > scrollThreshold) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', evaluateHeaderState, { passive: true });
    evaluateHeaderState(); // Defensive init execution

    /* ==========================================================================
       2. RESPONSIVE NAVIGATION OVERLAY TOGGLE
       ========================================================================== */
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
            hamburger.setAttribute('aria-expanded', !isExpanded);
            navMenu.classList.toggle('show');
            
            // Icon transition swap
            const innerIcon = hamburger.querySelector('i');
            if (navMenu.classList.contains('show')) {
                innerIcon.className = 'fas fa-times';
            } else {
                innerIcon.className = 'fas fa-bars';
            }
        });
    }

    /* ==========================================================================
       3. CINEMATIC HERO SLIDER CONTROLLER
       ========================================================================== */
    const slides = document.querySelectorAll('.slide');
    const nextBtn = document.querySelector('.slider-btn.next');
    const prevBtn = document.querySelector('.slider-btn.prev');
    let activeSlideIndex = 0;
    let autoRotationTimer = null;
    const rotationIntervalMs = 6000; // Optimal content digestion length

    const transitionToSlide = (targetIndex) => {
        slides[activeSlideIndex].classList.remove('active');
        activeSlideIndex = (targetIndex + slides.length) % slides.length;
        slides[activeSlideIndex].classList.add('active');
    };

    const runAutoRotation = () => {
        autoRotationTimer = setInterval(() => {
            transitionToSlide(activeSlideIndex + 1);
        }, rotationIntervalMs);
    };

    const resetRotationTimeout = () => {
        clearInterval(autoRotationTimer);
        runAutoRotation();
    };

    if (slides.length > 0) {
        if (nextBtn && prevBtn) {
            nextBtn.addEventListener('click', () => {
                transitionToSlide(activeSlideIndex + 1);
                resetRotationTimeout();
            });
            prevBtn.addEventListener('click', () => {
                transitionToSlide(activeSlideIndex - 1);
                resetRotationTimeout();
            });
        }
        runAutoRotation(); // Boot slider sequence
    }

    /* ==========================================================================
       4. HIGH-PERFORMANCE INTERSECTION OBSERVER FOR SCROLL REVEALS
       ========================================================================== */
    const elementsToReveal = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');

    const executionConfiguration = {
        threshold: 0.12, // Element visibility ratio before activation trigger
        rootMargin: "0px 0px -40px 0px"
    };

    const processIntersectionEntries = (entries, observerInstance) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observerInstance.unobserve(entry.target); // Kill resource monitoring post-reveal
            }
        });
    };

    const scrollObserver = new IntersectionObserver(processIntersectionEntries, executionConfiguration);

    elementsToReveal.forEach(targetElement => {
        scrollObserver.observe(targetElement);
    });
});