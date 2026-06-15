document.addEventListener('DOMContentLoaded', () => {
    // CITAM Valley Road Official YouTube Channel ID
    const channelId = 'UCufb-AsN3BhG-UAXz00f68w'; 
    const rssUrl = encodeURIComponent(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`;

    const sermonGrid = document.getElementById('dynamic-sermon-grid');

    if (!sermonGrid) {
        console.error("Error: #dynamic-sermon-grid container element not found in the HTML DOM.");
        return;
    }

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) throw new Error('Network response connection failed');
            return response.json();
        })
        .then(data => {
            if (data.status === 'ok' && data.items && data.items.length > 0) {
                // Clear out the loading spinner completely
                sermonGrid.innerHTML = '';

                // Slice the array to get exactly the 4 most recent streams/uploads
                const latestSermons = data.items.slice(0, 4);

                latestSermons.forEach((sermon, index) => {
                    // Fail-safe extraction of unique YouTube Video ID
                    let videoId = '';
                    if (sermon.guid && sermon.guid.includes('yt:video:')) {
                        videoId = sermon.guid.split('yt:video:')[1];
                    } else if (sermon.link && sermon.link.includes('v=')) {
                        videoId = sermon.link.split('v=')[1].split('&')[0];
                    }

                    // Fallback visual asset if videoId extraction completely fails
                    const thumbnailUrl = videoId 
                        ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` 
                        : 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=600';

                    // Format publication date beautifully (e.g., "May 29, 2026")
                    const pubDate = new Date(sermon.pubDate);
                    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
                    const formattedDate = !isNaN(pubDate) 
                        ? pubDate.toLocaleDateString('en-US', dateOptions) 
                        : 'Recent Stream';

                    // Clean up title strings if they contain typical live stream suffixes
                    let cleanTitle = sermon.title ? sermon.title.split('||')[0].split('#')[0].trim() : 'Sunday Service Live Stream';

                    // Generate progressive animation delay class based on item index
                    const delayClass = index === 0 ? '' : `delay-${index}`;
                    
                    // Generate specific tag labels for the modern layout
                    const tagMarkup = index === 0 
                        ? `<span class="sermon-tag live" style="background-color: #c1121f; color: #ffffff; position: absolute; top: 15px; left: 15px; padding: 4px 10px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; border-radius: 4px; z-index: 2;">Latest Service</span>` 
                        : '';

                    // Construct the structural semantic HTML card element
                    // Note: 'opacity: 1 !important' ensures visibility even if the scroll observer misses the injection.
                    const cardHTML = `
                        <article class="sermon-card reveal-up ${delayClass}" style="opacity: 1 !important; transform: none !important; visibility: visible !important;">
                            <div class="sermon-thumbnail" style="position: relative; overflow: hidden; border-radius: 8px; background-color: #111111; aspect-ratio: 16/9;">
                                <img src="${thumbnailUrl}" alt="${cleanTitle}" class="img-fluid" loading="lazy" style="width: 100%; height: 100%; display: block; object-fit: cover;" onerror="this.src='https://i.ytimg.com/vi/${videoId}/hqdefault.jpg'">
                                <div class="sermon-overlay">
                                    <a href="${sermon.link}" target="_blank" rel="noopener noreferrer" class="play-trigger" aria-label="Play Sermon on YouTube"><i class="fas fa-play"></i></a>
                                </div>
                                ${tagMarkup}
                            </div>
                            <div class="sermon-details" style="padding: 20px 0;">
                                <span class="sermon-meta" style="font-size: 0.85rem; color: #777777; display: block; margin-bottom: 8px;">
                                    <i class="far fa-calendar-alt"></i> ${formattedDate}
                                </span>
                                <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 10px; line-height: 1.4; color: #111111; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${cleanTitle}</h3>
                                <p class="speaker" style="font-size: 0.9rem; color: #555555; margin-bottom: 15px; font-weight: 500;">CITAM Valley Road</p>
                                <div class="sermon-actions" style="display: flex; gap: 15px;">
                                    <a href="${sermon.link}" target="_blank" rel="noopener noreferrer" class="action-link" style="font-size: 0.85rem; font-weight: 600; text-decoration: none; color: #c1121f;"><i class="fab fa-youtube"></i> Watch Stream</a>
                                    <a href="#" class="action-link download" aria-label="Download Sermon Notes" style="font-size: 0.85rem; font-weight: 600; text-decoration: none; color: #666666;"><i class="fas fa-file-pdf"></i> Notes</a>
                                </div>
                            </div>
                        </article>
                    `;

                    // Append the built component directly into the grid wrapper
                    sermonGrid.insertAdjacentHTML('beforeend', cardHTML);
                });
            } else {
                throw new Error('Invalid or empty data returned from API feed.');
            }
        })
        .catch(error => {
            console.error('Automation Error:', error);
            handleFetchError();
        });

    function handleFetchError() {
        sermonGrid.innerHTML = `
            <div style="grid-column: span 4; text-align: center; padding: 40px; color: #666666; width: 100%;">
                <p><i class="fas fa-exclamation-circle" style="color: #c1121f; margin-right: 5px;"></i> Unable to sync live stream archive dynamically right now.</p>
                <a href="https://www.youtube.com/@CITAMValleyRoadNPC/streams" target="_blank" rel="noopener noreferrer" class="action-link" style="margin-top: 15px; display: inline-block; color: #c1121f; font-weight: 600; text-decoration: none;">
                    <i class="fab fa-youtube"></i> View Channels Streams Directly
                </a>
            </div>
        `;
    }
});