document.addEventListener('DOMContentLoaded', () => {
    // Sticky Header Functionality
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Mobile Menu Toggle
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    if(hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('show');
        });
    }

    // =========================================================================
    // DYNAMIC 28-SERMON MEDIA CATALOG ENGINE
    // =========================================================================
    const channelId = 'UCufb-AsN3BhG-UAXz00f68w'; // CITAM Valley Road NPC Target ID
    const maxItems = 28; // Enforce exact layout size cap
    
    // Utilizing a cross-origin parsing pipeline to ingest XML as standard JSON
    const rssUrl = encodeURIComponent(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}&count=${maxItems}`;

    const catalogGrid = document.getElementById('catalog-sermon-grid');

    // Smooth Scroll Reveal Animation Framework Setup
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    if (catalogGrid) {
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) throw new Error('Network stream breakdown');
                return response.json();
            })
            .then(data => {
                if (data.status === 'ok' && data.items && data.items.length > 0) {
                    catalogGrid.innerHTML = ''; // Wipe out loader component Safely

                    // Limit item pull strictly to requested threshold loop bounds
                    const streamCollection = data.items.slice(0, maxItems);

                    streamCollection.forEach((stream, index) => {
                        // Isolate the video string parameter cleanly from unique ID markers
                        let videoId = '';
                        if (stream.guid && stream.guid.includes('yt:video:')) {
                            videoId = stream.guid.split('yt:video:')[1];
                        } else if (stream.link && stream.link.includes('v=')) {
                            videoId = stream.link.split('v=')[1].split('&')[0];
                        }

                        // Select cinematic high-def widescreen dimensions automatically
                        const highResThumbnail = videoId 
                            ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` 
                            : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80';

                        // Process timestamps cleanly to uniform local date formats
                        const broadcastDate = new Date(stream.pubDate);
                        const formattingSettings = { year: 'numeric', month: 'long', day: 'numeric' };
                        const localizedDate = !isNaN(broadcastDate) 
                            ? broadcastDate.toLocaleDateString('en-US', formattingSettings) 
                            : 'Live Stream Archive';

                        // Clean metadata parameters to separate sermon content from station tags
                        let sanitizedTitle = stream.title ? stream.title.split('||')[0].split('#')[0].trim() : 'Sunday Celebration Stream';

                        // Calculate progressive delay offset classes (1 to 4) dynamically for smooth rows stagger
                        const horizontalDelayOffset = (index % 4) + 1;

                        const compiledCardMarkup = `
                            <article class="sermon-card animate-on-scroll reveal-up delay-${horizontalDelayOffset}">
                                <div class="sermon-thumbnail">
                                    <img src="${highResThumbnail}" alt="${sanitizedTitle}" loading="lazy" onerror="this.src='https://i.ytimg.com/vi/${videoId}/hqdefault.jpg'">
                                    <div class="sermon-overlay">
                                        <a href="${stream.link}" target="_blank" rel="noopener noreferrer" class="play-trigger" aria-label="Stream Sermon Content on YouTube">
                                            <i class="fas fa-play"></i>
                                        </a>
                                    </div>
                                    <span class="sermon-tag">${index === 0 ? 'Latest Service' : 'Archive'}</span>
                                </div>
                                <div class="sermon-details">
                                    <div>
                                        <span class="sermon-meta"><i class="far fa-calendar-alt"></i> ${localizedDate}</span>
                                        <h3>${sanitizedTitle}</h3>
                                        <p class="speaker">CITAM Valley Road</p>
                                    </div>
                                    <div class="sermon-actions">
                                        <a href="${stream.link}" target="_blank" rel="noopener noreferrer" class="action-link">
                                            <i class="fab fa-youtube"></i> Watch Video
                                        </a>
                                        <a href="#" class="action-link download" aria-label="Download Study Assets">
                                            <i class="fas fa-file-pdf"></i> Notes
                                        </a>
                                    </div>
                                </div>
                            </article>
                        `;

                        catalogGrid.insertAdjacentHTML('beforeend', compiledCardMarkup);
                    });

                    // Reactivate observer monitoring targeting dynamically generated components
                    const freshlyRenderedCards = catalogGrid.querySelectorAll('.sermon-card');
                    freshlyRenderedCards.forEach(card => revealObserver.observe(card));
                } else {
                    throw new Error('Empty data arrays returned');
                }
            })
            .catch(error => {
                console.error('Dynamic Catalog Connection Interrupted:', error);
                catalogGrid.innerHTML = `
                    <div class="text-center" style="grid-column: 1 / -1; padding: 40px 0; color: var(--primary);">
                        <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                        <p style="font-weight: 600;">Unable to connect to YouTube media stream feed right now.</p>
                        <a href="https://www.youtube.com/@CITAMValleyRoadNPC/streams" target="_blank" rel="noopener noreferrer" class="btn btn-primary mt-2" style="padding: 10px 24px; font-size:0.75rem;">
                            Go to YouTube Directly
                        </a>
                    </div>
                `;
            });
    }
});