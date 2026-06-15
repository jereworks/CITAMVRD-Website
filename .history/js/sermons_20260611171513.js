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
        this.cacheKey = 'citam_sermons_v4';
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
            console.error('SermonApp error:', err);
            this.showError(err.message || 'Unknown error — check the console.');
        }
    }

    async loadData() {
        const cached = sessionStorage.getItem(this.cacheKey);

        if (cached) {
            const data = JSON.parse(cached);
            if (Date.now() - data.timestamp < this.cacheExpiry) {
                this.state.allVideos = data.videos;
                this.state.playlists = data.playlists;
                this.renderCategories();
                return;
            }
        }

        // Get uploads playlist ID from channel
        const channelRes = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${YT_CONFIG.CHANNEL_ID}&key=${YT_CONFIG.API_KEY}`
        );
        const channelData = await channelRes.json();
        const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

        // Fetch all channel playlists
        const playlistsRes = await fetch(
            `https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${YT_CONFIG.CHANNEL_ID}&maxResults=50&key=${YT_CONFIG.API_KEY}`
        );
        const playlistData = await playlistsRes.json();
        this.state.playlists = playlistData.items.map(p => ({
            id: p.id,
            title: p.snippet.title
        }));

        // Fetch ALL videos from the uploads playlist — loop until YouTube
        // returns no nextPageToken, meaning every video has been retrieved.
        const videos = [];
        let pageToken = '';

        while (true) {
            const pageParam = pageToken ? `&pageToken=${pageToken}` : '';
            const vidRes = await fetch(
                `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50${pageParam}&key=${YT_CONFIG.API_KEY}`
            );
            const vidData = await vidRes.json();

            vidData.items.forEach(item => {
                if (item.contentDetails && item.snippet) {
                    videos.push({
                        id: item.contentDetails.videoId,
                        title: item.snippet.title,
                        description: item.snippet.description,
                        playlists: [],
                        thumb: `https://i.ytimg.com/vi/${item.contentDetails.videoId}/hqdefault.jpg`,
                        date: new Date(item.snippet.publishedAt)
                    });
                }
            });

            pageToken = vidData.nextPageToken || '';
            if (!pageToken) break;
        }

        // For every playlist, fetch ALL its video IDs in parallel.
        const fetchPlaylistItems = async (playlist) => {
            const videoIds = [];
            let plPageToken = '';

            while (true) {
                const pageParam = plPageToken ? `&pageToken=${plPageToken}` : '';
                const res = await fetch(
                    `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${playlist.id}&maxResults=50${pageParam}&key=${YT_CONFIG.API_KEY}`
                );
                const data = await res.json();

                if (data.items) {
                    data.items.forEach(item => videoIds.push(item.contentDetails.videoId));
                }

                plPageToken = data.nextPageToken || '';
                if (!plPageToken) break;
            }

            return { title: playlist.title, videoIds };
        };

        // Run all playlist fetches at the same time
        const playlistResults = await Promise.all(
            this.state.playlists.map(fetchPlaylistItems)
        );

        // Build lookup: videoId → [playlistTitle, ...]
        const videoPlaylistMap = {};
        playlistResults.forEach(({ title, videoIds }) => {
            videoIds.forEach(id => {
                if (!videoPlaylistMap[id]) videoPlaylistMap[id] = [];
                videoPlaylistMap[id].push(title);
            });
        });

        // Stamp each video with the playlists it actually belongs to
        videos.forEach(video => {
            video.playlists = videoPlaylistMap[video.id] || [];
        });

        // Sort newest first
        videos.sort((a, b) => b.date - a.date);

        this.state.allVideos = videos;

        sessionStorage.setItem(
            this.cacheKey,
            JSON.stringify({
                timestamp: Date.now(),
                videos: this.state.allVideos,
                playlists: this.state.playlists
            })
        );

        this.renderCategories();
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
            videos = videos.filter(v => Array.isArray(v.playlists) && v.playlists.includes(this.state.activePlaylist));
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

    // FIX: Replaced eager iframe with click-to-play thumbnail.
    // The original iframe triggered YouTube Error 153 (embedding disabled)
    // for videos that have embedding restrictions. Now:
    //   1. A thumbnail + play button overlay is shown immediately (fast + always works).
    //   2. Clicking the thumbnail injects the iframe with ?autoplay=1.
    //   3. A "Watch on YouTube" link is always visible as a guaranteed fallback.
    //   4. Thumbnail falls back from hqdefault → mqdefault via onerror.
    renderFeatured() {
        const item = this.state.filteredVideos[0];
        if (!item) {
            this.elements.featuredContainer.style.display = 'none';
            return;
        }
        this.elements.featuredContainer.style.display = 'block';

        const thumbUrl = `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;
        const ytUrl   = `https://www.youtube.com/watch?v=${item.id}`;

        this.elements.featured.innerHTML = `
            <div class="featured-video-frame">
                <div class="yt-click-to-play" id="featured-thumb-wrapper"
                     style="position:relative; cursor:pointer; background:#000; aspect-ratio:16/9; overflow:hidden;">
                    <img
                        src="${thumbUrl}"
                        alt="${item.title}"
                        style="width:100%; height:100%; object-fit:cover; display:block; opacity:0.85;"
                        onerror="this.onerror=null; this.src='https://i.ytimg.com/vi/${item.id}/mqdefault.jpg';"
                    >
                    <!-- Play button overlay -->
                    <div style="
                        position:absolute; top:50%; left:50%;
                        transform:translate(-50%,-50%);
                        width:68px; height:68px;
                        background:rgba(204,0,0,0.92);
                        border-radius:50%;
                        display:flex; align-items:center; justify-content:center;
                        pointer-events:none;
                    ">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
                            <polygon points="6,3 21,12 6,21"/>
                        </svg>
                    </div>
                </div>
            </div>
            <div class="featured-info">
                <span class="hero-pre-tag">${item.playlists[0] || 'Sermon'}</span>
                <h3>${item.title}</h3>
                <p>${item.description.slice(0, 220)}</p>
                <a href="${ytUrl}" target="_blank" rel="noopener noreferrer" class="watch-yt-btn"
                   style="display:inline-flex; align-items:center; gap:6px; margin-top:8px; text-decoration:none; color:inherit; font-size:0.875rem; opacity:0.75;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z"/>
                    </svg>
                    Watch on YouTube
                </a>
            </div>
        `;

        // On click: swap thumbnail for the live iframe with autoplay
        document.getElementById('featured-thumb-wrapper').addEventListener('click', () => {
            document.getElementById('featured-thumb-wrapper').innerHTML = `
                <iframe
                    width="100%" height="100%"
                    style="aspect-ratio:16/9; border:none; display:block;"
                    src="https://www.youtube.com/embed/${item.id}?autoplay=1&rel=0"
                    allow="autoplay; encrypted-media; fullscreen"
                    allowfullscreen
                    title="${item.title}"
                ></iframe>
            `;
        });
    }

    renderGrid() {
        this.elements.grid.innerHTML = '';
        const start = (this.state.currentPage - 1) * YT_CONFIG.ITEMS_PER_PAGE;
        const rows  = this.state.filteredVideos.slice(start, start + YT_CONFIG.ITEMS_PER_PAGE);

        rows.forEach(v => {
            this.elements.grid.insertAdjacentHTML(
                'beforeend',
                `
                <article class="sermon-card">
                    <div class="sermon-thumbnail">
                        <a target="_blank" rel="noopener noreferrer" href="https://youtube.com/watch?v=${v.id}">
                            <img
                                src="${v.thumb}"
                                alt="${v.title}"
                                onerror="this.onerror=null; this.src='https://i.ytimg.com/vi/${v.id}/mqdefault.jpg';"
                            >
                        </a>
                    </div>
                    <div class="sermon-details">
                        <h3>${v.title}</h3>
                        <p class="sermon-meta">${v.playlists[0] || ''}</p>
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

        // First and Previous
        this.elements.pagination.appendChild(createBtn('&laquo; First', 1, 'wide', this.state.currentPage === 1));
        this.elements.pagination.appendChild(createBtn('&lsaquo; Prev', this.state.currentPage - 1, 'wide', this.state.currentPage === 1));

        // Page number window
        let startPage = Math.max(1, this.state.currentPage - 2);
        let endPage   = Math.min(totalPages, startPage + 4);
        if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

        for (let i = startPage; i <= endPage; i++) {
            this.elements.pagination.appendChild(createBtn(i, i));
        }

        // Next and Last
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
        this.elements.grid.innerHTML = '<div style="padding:80px;text-align:center;color:green;">Loading sermons… this may take a moment.</div>';
    }

    showError() {
        this.elements.grid.innerHTML = '<div style="padding:80px;text-align:center">Unable to load sermons.</div>';
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

document.addEventListener('DOMContentLoaded', () => {
    new SermonApp();
});