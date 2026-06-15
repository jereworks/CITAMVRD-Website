document.addEventListener('DOMContentLoaded', () => {
    // CITAM Valley Road Official YouTube Channel ID
    const channelId = 'UCufb-AsN3BhG-UAXz00f68w'; 
    const rssUrl = encodeURIComponent(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`;

    const sermonGrid = document.getElementById('dynamic-sermon-grid');

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok' && data.items.length > 0) {
                // Clear out the loading spinner
                sermonGrid.innerHTML = '';

                // Slice the array to get exactly the 4 most recent streams/uploads
                const latestSermons = data.items.slice(0, 4);

                latestSermons.forEach((sermon, index) => {
                    // Extract unique YouTube Video ID safely from the link
                    const videoId = sermon.link.split('v=')[1];
                    
                    // Format publication date beautifully (e.g., "May 24, 2026")
                    const pubDate = new Date(sermon.pubDate);
                    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
                    const formattedDate = pubDate.toLocaleDateString('en-US', dateOptions);

                    // Clean up title strings if they contain typical live stream suffixes
                    let cleanTitle = sermon.title.split('||')[0].split('#')[0].trim();

                    // Generate progressive animation delay class based on item index
                    const delayClass = index === 0 ? '' : `delay-${index}`;
                    
                    // Generate specific tag labels for the modern layout
                    const tagMarkup = index === 0 
                        ? `<span class="sermon-tag live" style="background-color: #c1121f; color: #ffffff; position: absolute; top: 15px; left: 15px; padding: 4px 10px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; border-radius: 4px; z-index: 2;">Latest Service</span>` 
                        : '';

                    // Construct the structural semantic HTML card element
                    const cardHTML = `
                        <article class="sermon-card animate-on-scroll reveal-up ${delayClass}">
                            <div class="sermon-thumbnail" style="position: relative; overflow: hidden; border-radius: 8px;">
                                <img src="https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg" alt="${cleanTitle}" class="img-fluid" loading="lazy" style="width: 100%; display: block; object-fit: cover; aspect-ratio: 16/9;">
                                <div class="sermon-overlay">
                                    <a href="${sermon.link}" target="_blank" rel="noopener noreferrer" class="play-trigger" aria-label="Play Sermon on YouTube"><i class="fas fa-play"></i></a>
                                </div>
                                ${tagMarkup}
                            </div>
                            <div class="sermon-details" style="padding: 20px 0;">
                                <span class="sermon-meta" style="font-size: 0.85rem; color: #777777; display: block; margin-bottom: 8px;">
                                    <i class="far fa-calendar-alt"></i> ${formattedDate}
                                </span>
                                <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 10px; line-height: 1.4; color: #111111;">${cleanTitle}</h3>
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

                // Trigger scroll animation functions if defined globally on your site
                if (typeof initScrollAnimations === 'function') {
                    initScrollAnimations();
                }
            } else {
                handleFetchError();
            }
        })
        .catch(error => {
            console.error('Error automating sermon cards:', error);
            handleFetchError();
        });

    function handleFetchError() {
        sermonGrid.innerHTML = `
            <div style="grid-column: span 4; text-align: center; padding: 40px; color: #666666;">
                <p>Unable to sync live stream archive dynamically.</p>
                <a href="https://www.youtube.com/@CITAMValleyRoadNPC/streams" target="_blank" class="btn btn-primary" style="margin-top: 15px; display: inline-block;">Go To YouTube Channel</a>
            </div>
        `;
    }
});