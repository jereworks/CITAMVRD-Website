document.addEventListener('DOMContentLoaded', () => {

    /* ==============================================
       1. STICKY NAVIGATION
    ============================================== */
    const header = document.getElementById('header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    /* ==============================================
       2. MOBILE MENU TOGGLE
    ============================================== */
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');

    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('show');
        // Toggle icon between bars and times (X)
        const icon = hamburger.querySelector('i');
        if (navMenu.classList.contains('show')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });

    /* ==============================================
       3. HERO SLIDER
    ============================================== */
    const slides = document.querySelectorAll('.slide');
    const nextBtn = document.querySelector('.next');
    const prevBtn = document.querySelector('.prev');
    let currentSlide = 0;
    let slideInterval;

    const nextSlide = () => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    };

    const prevSlide = () => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
    };

    // Auto slide every 5 seconds
    const startSlider = () => {
        slideInterval = setInterval(nextSlide, 5000);
    };

    // Reset interval on manual click
    const resetSlider = () => {
        clearInterval(slideInterval);
        startSlider();
    };

    if(slides.length > 0) {
        nextBtn.addEventListener('click', () => { nextSlide(); resetSlider(); });
        prevBtn.addEventListener('click', () => { prevSlide(); resetSlider(); });
        startSlider();
    }

    /* ==============================================
       4. SCROLL REVEAL ANIMATIONS
    ============================================== */
    const revealElements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');

    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            
            entry.target.classList.add('active');
            observer.unobserve(entry.target); // Only animate once
        });
    }, revealOptions);

    revealElements.forEach(el => {
        revealOnScroll.observe(el);
    });

});