/**
 * CITAM Valley Road - Native DOMParser YouTube RSS Engine
 */
document.addEventListener('DOMContentLoaded', () => {
    const channelId = 'UCufb-AsN3BhG-UAXz00f68w'; 
    const youtubeRssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    
    // Using a public CORS proxy to allow direct browser fetching of YouTube's XML feed
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(youtubeRssUrl)}`;

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

    fetch(proxyUrl)
        .then(response => {
            if (!response.ok) throw new Error('Feed connection failure');
            return response.text();
        })
        .then(xmlString => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
            const entries = xmlDoc.querySelectorAll('entry');

            if (entries && entries.length > 0) {
                sermonGrid.innerHTML = '';

                // Capture the top 4 structural elements
                const latestEntries = Array.from(entries).slice(0, 4);

                latestEntries.forEach((entry, index) => {
                    // Extract video ID safely from YouTube's <yt:videoId> tag
                    const videoIdNode = entry.querySelector('yt\\:videoId');
                    const videoId = videoIdNode ? videoIdNode.textContent : '';

                    const titleNode = entry.querySelector('title');
                    let rawTitle = titleNode ? titleNode.textContent : 'Sunday Service Live Stream';

                    const linkNode = entry.querySelector('link');
                    const sermonLink = linkNode ? linkNode.getAttribute('href') : `https://www.youtube.com/watch?v=${videoId}`;

                    const publishedNode = entry.querySelector('published');
                    const pubDate = publishedNode ? new Date(publishedNode.textContent) : new Date();
                    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
                    const formattedDate = !isNaN(pubDate) ? pubDate.toLocaleDateString('en-US', dateOptions) : 'Recent Stream';

                    const thumbnailUrl = videoId 
                        ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` 
                        : 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80';

                    // Clean the channel metadata suffix cleanly
                    let cleanTitle = rawTitle.split('||')[0].split('#')[0].trim();

                    const delayClass = index === 0 ? '' : `delay-${index}`;
                    
                    const cardHTML = `
                        <article class="sermon-card animate-on-scroll reveal-up ${delayClass}">
                            <div class="sermon-thumbnail">
                                <img src="${thumbnailUrl}" alt="${cleanTitle}" loading="lazy" onerror="this.src='https://i.ytimg.com/vi/${videoId}/hqdefault.jpg'">
                                <div class="sermon-overlay">
                                    <a href="${sermonLink}" target="_blank" rel="noopener noreferrer" class="play-trigger" aria-label="Play Sermon on YouTube">
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
                                    <a href="${sermonLink}" target="_blank" rel="noopener noreferrer" class="action-link">
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