/**
 * CITAM Valley Road - Premium Sermon Architecture
 * Powered by YouTube Data API v3
 */

const YT_CONFIG = {
    API_KEY: 'AIzaSyA0oLA2ZUd_HWtLVjOM8M2Qyv_BJliFXnw',
    CHANNEL_ID: 'UCufb-AsN3BhG-UAXz00f68w',
    ITEMS_PER_PAGE: 12,
    CACHE_HOURS: 0.25
};

class SermonApp {
    constructor() {
        this.cacheKey = 'citam_sermons_v2';
        this.cacheExpiry = 1000 * 60 * 60 * YT_CONFIG.CACHE_HOURS;

        this.state = {
            allVideos: [],
            filteredVideos: [],
            playlists: [],
            currentPage: 1,
            searchQuery: '',
            sortOrder: 'newest',
            activePlaylist: 'All'
        };

        this.elements = {
            grid: document.getElementById('dynamic-sermon-grid'),
            featuredContainer: document.getElementById('featured-sermon-container'),
            featured: document.getElementById('featured-sermon'),
            pagination: document.getElementById('pagination-container'),
            search: document.getElementById('sermon-search'),
            filters: document.getElementById('category-filters'),
            sort: document.getElementById('sermon-sort')
        };

        this.init();
    }

    async init() {
        this.renderLoading();
        this.setupListeners();

        try {
            await this.loadData();
            this.applyFilters();
        } catch (err) {
            console.error(err);
            this.showError();
        }
    }

    async loadData() {
        const cached = sessionStorage.getItem(this.cacheKey);

        if (cached) {
            try {
                const data = JSON.parse(cached);
                if (Date.now() - data.timestamp < this.cacheExpiry) {
                    this.state.allVideos = data.videos;
                    this.state.playlists = data.playlists;
                    this.renderCategories();
                    return;
                }
            } catch (e) {
                console.warn('Cache corrupted, loading fresh data');
            }
        }

        try {
            // Fetch playlists
            const playlistsRes = await fetch(
                `https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${YT_CONFIG.CHANNEL_ID}&maxResults=50&key=${YT_CONFIG.API_KEY}`
            );
            
            if (playlistsRes.ok) {
                const playlistData = await playlistsRes.json();
                if (playlistData.items) {
                    this.state.playlists = playlistData.items.map(p => ({
                        id: p.id,
                        title: p.snippet.title
                    }));
                }
            }

            // Fetch videos from ALL playlists so we have playlist info for filtering
            const videos = [];
            const videoIds = new Set(); // To avoid duplicates

            // First get uploads playlist for all videos
            const channelRes = await fetch(
                `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${YT_CONFIG.CHANNEL_ID}&key=${YT_CONFIG.API_KEY}`
            );
            
            if (channelRes.ok) {
                const channelData = await channelRes.json();
                if (channelData.items && channelData.items.length > 0) {
                    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
                    await this.fetchVideosFromPlaylist(videos, videoIds, uploadsPlaylistId, 'All');
                }
            }

            // Now fetch from each individual playlist
            for (const playlist of this.state.playlists) {
                await this.fetchVideosFromPlaylist(videos, videoIds, playlist.id, playlist.title);
            }

            // Sort videos newest first
            videos.sort((a, b) => b.date - a.date);
            
            this.state.allVideos = videos;

            // Save to cache
            try {
                sessionStorage.setItem(
                    this.cacheKey,
                    JSON.stringify({
                        timestamp: Date.now(),
                        videos: this.state.allVideos,
                        playlists: this.state.playlists
                    })
                );
            } catch (e) {
                console.warn('Could not save to cache:', e);
            }

            this.renderCategories();
            
        } catch (error) {
            console.error('Error loading YouTube data:', error);
            
            // Fallback to expired cache
            if (cached) {
                try {
                    const data = JSON.parse(cached);
                    this.state.allVideos = data.videos;
                    this.state.playlists = data.playlists;
                    this.renderCategories();
                    return;
                } catch (e) {}
            }
            
            throw error;
        }
    }

    async fetchVideosFromPlaylist(videos, videoIds, playlistId, playlistTitle) {
        let pageToken = '';
        
        for (let i = 0; i < 2; i++) {
            const pageParam = pageToken ? `&pageToken=${pageToken}` : '';
            const vidRes = await fetch(
                `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50${pageParam}&key=${YT_CONFIG.API_KEY}`
            );
            
            if (!vidRes.ok) break;
            
            const vidData = await vidRes.json();
            
            if (vidData.items) {
                vidData.items.forEach(item => {
                    if (item.contentDetails && item.snippet) {
                        const videoId = item.contentDetails.videoId;
                        
                        // Get best available thumbnail
                        let thumbUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
                        if (item.snippet.thumbnails) {
                            if (item.snippet.thumbnails.maxres) {
                                thumbUrl = item.snippet.thumbnails.maxres.url;
                            } else if (item.snippet.thumbnails.standard) {
                                thumbUrl = item.snippet.thumbnails.standard.url;
                            } else if (item.snippet.thumbnails.high) {
                                thumbUrl = item.snippet.thumbnails.high.url;
                            }
                        }
                        
                        if (!videoIds.has(videoId)) {
                            videoIds.add(videoId);
                            videos.push({
                                id: videoId,
                                title: item.snippet.title,
                                description: item.snippet.description || '',
                                playlist: playlistTitle,
                                playlistId: playlistId,
                                thumb: thumbUrl,
                                date: new Date(item.snippet.publishedAt)
                            });
                        }
                    }
                });
            }
            
            pageToken = vidData.nextPageToken;
            if (!pageToken) break;
        }
    }

    applyFilters() {
        let videos = [...this.state.allVideos];

        if (this.state.searchQuery) {
            const q = this.state.searchQuery.toLowerCase();
            videos = videos.filter(v =>
                v.title.toLowerCase().includes(q) ||
                v.description.toLowerCase().includes(q)
            );
        }

        if (this.state.activePlaylist !== 'All') {
            videos = videos.filter(v => v.playlist === this.state.activePlaylist);
        }

        videos.sort((a, b) =>
            this.state.sortOrder === 'newest' ? b.date - a.date : a.date - b.date
        );

        this.state.filteredVideos = videos;
        this.render();
    }

    render() {
        this.renderFeatured();
        this.renderGrid();
        this.renderPagination();
    }

    renderFeatured() {
        const item = this.state.filteredVideos[0];
        if (!item) {
            this.elements.featuredContainer.style.display = 'none';
            return;
        }
        
        const formattedDate = item.date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        this.elements.featuredContainer.style.display = 'block';
        this.elements.featured.innerHTML = `
            <div class="featured-video-frame" onclick="window.playVideo(this, '${item.id}')" role="button" tabindex="0" aria-label="Play ${item.title}">
                <img src="${item.thumb}" alt="${item.title}" loading="lazy">
                <div class="sermon-overlay" style="opacity: 1; background: rgba(0,0,0,0.2);">
                    <div class="play-trigger" style="transform: scale(1.2);">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
            </div>
            <div class="featured-info">
                <span class="hero-pre-tag">Latest Release</span>
                <h3>${item.title}</h3>
                <p class="sermon-meta"><i class="far fa-calendar-alt"></i> ${formattedDate}</p>
                <p>${item.description.substring(0, 180)}${item.description.length > 180 ? '...' : ''}</p>
                <div>
                    <button class="btn btn-primary" onclick="window.open('https://youtube.com/watch?v=${item.id}', '_blank')">Watch on YouTube</button>
                </div>
            </div>
        `;
    }

    renderGrid() {
        this.elements.grid.innerHTML = '';
        
        // Skip featured video from grid on page 1
        const isFeaturedShowing = this.elements.featuredContainer.style.display === 'block';
        let videosToRender = [...this.state.filteredVideos];
        
        if (isFeaturedShowing && this.state.currentPage === 1 && videosToRender.length > 0) {
            videosToRender.shift();
        }
        
        const start = (this.state.currentPage - 1) * YT_CONFIG.ITEMS_PER_PAGE;
        const rows = videosToRender.slice(start, start + YT_CONFIG.ITEMS_PER_PAGE);

        rows.forEach(v => {
            const formattedDate = v.date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            
            this.elements.grid.insertAdjacentHTML(
                'beforeend',
                `
                <article class="sermon-card animate-on-scroll slide-up active">
                    <div class="sermon-thumbnail" onclick="window.playVideo(this, '${v.id}')" role="button" tabindex="0" aria-label="Play ${v.title}">
                        <img src="${v.thumb}" alt="${v.title}" loading="lazy">
                        <div class="sermon-overlay">
                            <div class="play-trigger">
                                <i class="fas fa-play"></i>
                            </div>
                        </div>
                    </div>
                    <div class="sermon-details">
                        <h3 title="${v.title}">${v.title}</h3>
                        <p class="sermon-meta"><i class="far fa-calendar-alt"></i> ${formattedDate}</p>
                        <div class="sermon-actions">
                            <a href="https://youtube.com/watch?v=${v.id}" target="_blank" class="action-link text-primary">
                                Watch <i class="fas fa-external-link-alt ml-1"></i>
                            </a>
                        </div>
                    </div>
                </article>
                `
            );
        });
    }

    renderPagination() {
        this.elements.pagination.innerHTML = '';
        const totalPages = Math.ceil(this.state.filteredVideos.length / YT_CONFIG.ITEMS_PER_PAGE);

        if (totalPages <= 1) return;

        const createBtn = (label, pageNum, classes = '', disabled = false) => {
            const btn = document.createElement('button');
            btn.className = `page-btn ${classes} ${pageNum === this.state.currentPage ? 'active' : ''}`;
            btn.innerHTML = label;
            btn.disabled = disabled;
            btn.setAttribute('aria-label', `Go to page ${pageNum}`);
            if (!disabled && pageNum !== this.state.currentPage) {
                btn.addEventListener('click', () => {
                    this.state.currentPage = pageNum;
                    this.render();
                });
            }
            return btn;
        };

        this.elements.pagination.appendChild(createBtn('&laquo; First', 1, 'wide', this.state.currentPage === 1));
        this.elements.pagination.appendChild(createBtn('&lsaquo; Prev', this.state.currentPage - 1, 'wide', this.state.currentPage === 1));

        let startPage = Math.max(1, this.state.currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

        for (let i = startPage; i <= endPage; i++) {
            this.elements.pagination.appendChild(createBtn(i, i));
        }

        this.elements.pagination.appendChild(createBtn('Next &rsaquo;', this.state.currentPage + 1, 'wide', this.state.currentPage === totalPages));
        this.elements.pagination.appendChild(createBtn('Last &raquo;', totalPages, 'wide', this.state.currentPage === totalPages));
    }

    renderCategories() {
        this.elements.filters.innerHTML = '';

        const allBtn = document.createElement('button');
        allBtn.className = 'btn category-btn active';
        allBtn.dataset.id = 'All';
        allBtn.textContent = 'All';
        allBtn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            allBtn.classList.add('active');
            this.state.activePlaylist = 'All';
            this.state.currentPage = 1;
            this.applyFilters();
        });
        this.elements.filters.appendChild(allBtn);

        this.state.playlists.forEach(p => {
            const btn = document.createElement('button');
            btn.className = 'btn category-btn';
            btn.dataset.id = p.title;
            btn.textContent = p.title;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.state.activePlaylist = p.title;
                this.state.currentPage = 1;
                this.applyFilters();
            });
            this.elements.filters.appendChild(btn);
        });
    }

    renderLoading() {
        this.elements.grid.innerHTML = '<div style="padding:80px;text-align:center">Loading sermons…</div>';
    }

    showError() {
        this.elements.grid.innerHTML = `
            <div style="padding:80px;text-align:center">
                <i class="fas fa-exclamation-triangle" style="font-size:48px;color:#d32f2f;margin-bottom:20px;display:block;"></i>
                <h3 style="color:#333;margin-bottom:15px;">Unable to Load Sermons</h3>
                <p style="color:#666;margin-bottom:15px;">There was an error loading the sermon videos. Please try again later.</p>
                <button class="btn btn-primary" onclick="window.location.reload()">Refresh Page</button>
            </div>
        `;
    }

    setupListeners() {
        this.elements.search?.addEventListener('input', e => {
            this.state.searchQuery = e.target.value;
            this.state.currentPage = 1;
            this.applyFilters();
        });

        this.elements.sort?.addEventListener('change', e => {
            this.state.sortOrder = e.target.value;
            this.state.currentPage = 1;
            this.applyFilters();
        });
    }
}

// Global function for video playback
window.playVideo = function(containerElement, videoId) {
    containerElement.classList.add('yt-iframe-container');
    containerElement.innerHTML = `
        <iframe 
            src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" 
            title="YouTube video player" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen
        ></iframe>
    `;
};

document.addEventListener('DOMContentLoaded', () => {
    new SermonApp();
});
