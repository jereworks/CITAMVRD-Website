/**
 * CITAM Valley Road - Premium Sermon Integration Engine
 * Architecture: Vanilla JS, Component-Driven Grid UI, Layout Parity Handlers
 * Syncs seamlessly with the premium design system tokens in style.css
 */
document.addEventListener('DOMContentLoaded', () => {
    // Official CITAM Valley Road Channel ID
    const channelId = 'UCufb-AsN3BhG-UAXz00f68w'; 
    const rssUrl = encodeURIComponent(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`;

    const sermonGrid = document.getElementById('dynamic-sermon-grid');

    if (!sermonGrid) {
        console.error("Design System Error: #dynamic-sermon-grid element wrapper is missing from the DOM tree.");
        return;
    }

    // Initialize an isolated observer specifically for dynamically loaded UI cards
    const dynamicRevealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Execute transition once
            }
        });
    }, {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    });

    // Execute secure feed pull
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) throw new Error('API feed network response connection dropped');
            return response.json();
        })
        .then(data => {
            if (data.status === 'ok' && data.items && data.items.length > 0) {
                // Wipe the loading skeleton cleanly
                sermonGrid.innerHTML = '';

                // Capture the 4 most recent service records for the grid system
                const latestSermons = data.items.slice(0, 4);

                latestSermons.forEach((sermon, index) => {
                    // Fail-safe extraction of unique YouTube Video ID
                    let videoId = '';
                    if (sermon.guid && sermon.guid.includes('yt:video:')) {
                        videoId = sermon.guid.split('yt:video:')[1];
                    } else if (sermon.link && sermon.link.includes('v=')) {
                        videoId = sermon.link.split('v=')[1].split('&')[0];
                    }

                    // Fallback to high-quality stock if asset resolution fails completely
                    const thumbnailUrl = videoId 
                        ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` 
                        : 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80';

                    // Parse structural publication dates into clean layout strings
                    const pubDate = new Date(sermon.pubDate);
                    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
                    const formattedDate = !isNaN(pubDate) 
                        ? pubDate.toLocaleDateString('en-US', dateOptions) 
                        : 'Recent Stream';

                    // Sanitize stream titles to strip raw platform metadata tags
                    let cleanTitle = sermon.title ? sermon.title.split('||')[0].split('#')[0].trim() : 'Sunday Service Live Stream';

                    // Match your exact sequential layout delay variables (delay-1, delay-2, etc.)
                    const delayClass = index === 0 ? '' : `delay-${index}`;
                    
                    // Conditionally append your premium layout badge indicator to the latest record
                    const tagMarkup = index === 0 
                        ? `<span class="sermon-tag">Latest Service</span>` 
                        : '';

                    // Construct component matching your style.css layout rules flawlessly
                    const cardHTML = `
                        <article class="sermon-card animate-on-scroll reveal-up ${delayClass}">
                            <div class="sermon-thumbnail">
                                <img src="${thumbnailUrl}" alt="${cleanTitle}" class="img-fluid" loading="lazy" onerror="this.src='https://i.ytimg.com/vi/${videoId}/hqdefault.jpg'">
                                <div class="sermon-overlay">
                                    <a href="${sermon.link}" target="_blank" rel="noopener noreferrer" class="play-trigger" aria-label="Play Sermon on YouTube">
                                        <i class="fas fa-play"></i>
                                    </a>
                                </div>
                                ${tagMarkup}
                            </div>
                            <div class="sermon-details">
                                <div class="sermon-text-content">
                                    <span class="sermon-meta">
                                        <i class="far fa-calendar-alt"></i> ${formattedDate}
                                    </span>
                                    <h3>${cleanTitle}</h3>
                                    <p class="speaker">CITAM Valley Road</p>
                                </div>
                                <div class="sermon-actions">
                                    <a href="${sermon.link}" target="_blank" rel="noopener noreferrer" class="action-link">
                                        <i class="fab fa-youtube"></i> Watch Stream
                                    </a>
                                    <a href="#" class="action-link download" aria-label="Download Sermon Outline Study Notes">
                                        <i class="fas fa-file-pdf"></i> Notes
                                    </a>
                                </div>
                            </div>
                        </article>
                    `;

                    // Push component into active page structure
                    sermonGrid.insertAdjacentHTML('beforeend', cardHTML);
                });

                // Attach your native layout reveal animation listener to the newly injected elements
                const freshCards = sermonGrid.querySelectorAll('.sermon-card');
                freshCards.forEach(card => dynamicRevealObserver.observe(card));

            } else {
                throw new Error('Data payload returned empty or broken.');
            }
        })
        .catch(error => {
            console.error('Dynamic Component Error:', error);
            handleFetchError();
        });

    // Elegant graceful degradation panel matched to your global design palette
    function handleFetchError() {
        sermonGrid.innerHTML = `
            <div style="grid-column: span 4; text-align: center; padding: 60px 20px; width: 100%;">
                <p style="color: var(--text-muted); font-size: 1rem; margin-bottom: 20px;">
                    <i class="fas fa-exclamation-circle" style="color: var(--primary); margin-right: 8px;"></i> 
                    Our dynamic video archive is undergoing quick maintenance synchronization.
                </p>
                <a href="https://www.youtube.com/@CITAMValleyRoadNPC/streams" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
                    <i class="fab fa-youtube"></i> View Live Channel Directly
                </a>
            </div>
        `;
    }
});