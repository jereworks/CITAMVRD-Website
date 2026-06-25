/**
 * CITAM Valley Road - Unified Grid Sermon Engine
 */
document.addEventListener('DOMContentLoaded', () => {
    const channelId = 'UCufb-AsN3BhG-UAXz00f68w'; 
    const rssUrl = encodeURIComponent(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`;

    const sermonGrid = document.getElementById('dynamic-sermon-grid');

    if (!sermonGrid) return;

    const dynamicRevealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) throw new Error('Feed connection failure');
            return response.json();
        })
        .then(data => {
            if (data.status === 'ok' && data.items && data.items.length > 0) {
                sermonGrid.innerHTML = '';

                // Capture the top 4 structural elements
                const latestSermons = data.items.slice(0, 4);

                latestSermons.forEach((sermon, index) => {
                    let videoId = '';
                    if (sermon.guid && sermon.guid.includes('yt:video:')) {
                        videoId = sermon.guid.split('yt:video:')[1];
                    } else if (sermon.link && sermon.link.includes('v=')) {
                        videoId = sermon.link.split('v=')[1].split('&')[0];
                    }

                    const thumbnailUrl = videoId 
                        ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` 
                        : 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80';

                    const pubDate = new Date(sermon.pubDate);
                    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
                    const formattedDate = !isNaN(pubDate) ? pubDate.toLocaleDateString('en-US', dateOptions) : 'Recent Stream';

                    // Clean the channel metadata suffix cleanly
                    let cleanTitle = sermon.title ? sermon.title.split('||')[0].split('#')[0].trim() : 'Sunday Service Live Stream';

                    const delayClass = index === 0 ? '' : `delay-${index}`;
                    
                    // Unified dynamic card structural template
                    const cardHTML = `
                        <article class="sermon-card animate-on-scroll reveal-up ${delayClass}">
                            <div class="sermon-thumbnail">
                                <img src="${thumbnailUrl}" alt="${cleanTitle}" loading="lazy" onerror="this.src='https://i.ytimg.com/vi/${videoId}/hqdefault.jpg'">
                                <div class="sermon-overlay">
                                    <a href="${sermon.link}" target="_blank" rel="noopener noreferrer" class="play-trigger" aria-label="Play Sermon on YouTube">
                                        <i class="fas fa-play"></i>
                                    </a>
                                </div>
                                <span class="sermon-tag">Service Stream</span>
                            </div>
                            <div class="sermon-details">
                                <div>
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
                                </div>
                            </div>
                        </article>
                    `;

                    sermonGrid.insertAdjacentHTML('beforeend', cardHTML);
                });

                const freshCards = sermonGrid.querySelectorAll('.sermon-card');
                freshCards.forEach(card => dynamicRevealObserver.observe(card));
            }
        })
        .catch(error => console.error('Layout alignment execution error:', error));
});