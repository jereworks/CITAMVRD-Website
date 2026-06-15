/**
 * CITAM Valley Road - Premium Sermon Architecture
 * Powered by YouTube Data API v3
 */

/const YT_CONFIG = {
    API_KEY: 'https://api.rss2json.com/v1/api.json?rss_url=https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}', // Replace with your actual key
    CHANNEL_ID: 'UCufb-AsN3BhG-UAXz00f68w',
    MAX_RESULTS_PER_FETCH: 50,
    TOTAL_PAGES_TO_CACHE: 3, // Fetches up to 150 latest videos for instant client-side filtering
    ITEMS_PER_PAGE: 12
};

class SermonApp {
    constructor() {
        this.cacheKey = 'citam_sermons_cache';
        this.cacheExpiry = 1000 * 60 * 60 * 4; // 4 Hours Cache

        this.state = {
            allVideos: [],
            filteredVideos: [],
            playlists: [],
            searchQuery: '',
            activePlaylist: 'All',
            sortOrder: 'newest',
            currentPage: 1
        };

        this.elements = {
            grid: document.getElementById('dynamic-sermon-grid'),
            pagination: document.getElementById('pagination-container'),
            featuredContainer: document.getElementById('featured-sermon-container'),
            featuredCard: document.getElementById('featured-sermon'),
            statsSection: document.getElementById('sermon-stats'),
            searchInput: document.getElementById('sermon-search'),
            categoryWrapper: document.getElementById('category-filters'),
            sortSelect: document.getElementById('sermon-sort')
        };

        this.init();
    }

    async init() {
        this.renderSkeletons();
        this.readURLState();
        this.setupEventListeners();

        try {
            await this.loadData();
            this.applyFilters();
            this.updateStats();
        } catch (error) {
            console.error('Initialization Error:', error);
            this.showError('Unable to load sermons. Please check your connection or try again later.');
        }
    }

    // ==========================================
    // STATE & URL MANAGEMENT
    // ==========================================
    readURLState() {
        const params = new URLSearchParams(window.location.search);
        this.state.searchQuery = params.get('q') || '';
        this.state.activePlaylist = params.get('playlist') || 'All';
        this.state.sortOrder = params.get('sort') || 'newest';
        this.state.currentPage = parseInt(params.get('page')) || 1;

        if (this.state.searchQuery) this.elements.searchInput.value = this.state.searchQuery;
        this.elements.sortSelect.value = this.state.sortOrder;
    }

    updateURL() {
        const params = new URLSearchParams();
        if (this.state.searchQuery) params.set('q', this.state.searchQuery);
        if (this.state.activePlaylist !== 'All') params.set('playlist', this.state.activePlaylist);
        if (this.state.sortOrder !== 'newest') params.set('sort', this.state.sortOrder);
        if (this.state.currentPage > 1) params.set('page', this.state.currentPage);

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
    }

    // ==========================================
    // DATA FETCHING & CACHING
    // ==========================================
    async loadData() {
        const cached = sessionStorage.getItem(this.cacheKey);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < this.cacheExpiry) {
                this.state.allVideos = parsed.videos;
                this.state.playlists = parsed.playlists;
                this.renderCategories();
                return;
            }
        }

        // 1. Get Channel Uploads ID & Playlists concurrently
        const [channelRes, playlistsRes] = await Promise.all([
            fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${YT_CONFIG.CHANNEL_ID}&key=${YT_CONFIG.API_KEY}`),
            fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${YT_CONFIG.CHANNEL_ID}&maxResults=50&key=${YT_CONFIG.API_KEY}`)
        ]);

        if (!channelRes.ok || !playlistsRes.ok) throw new Error('API Quota or Network Failure');

        const channelData = await channelRes.json();
        const playlistsData = await playlistsRes.json();
        
        const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
        
        // Map Playlists
        this.state.playlists = playlistsData.items.map(p => ({
            id: p.id,
            title: p.snippet.title
        }));

        // 2. Fetch recent videos from Uploads
        let videos = [];
        let pageToken = '';
        
        for (let i = 0; i < YT_CONFIG.TOTAL_PAGES_TO_CACHE; i++) {
            const pageParam = pageToken ? `&pageToken=${pageToken}` : '';
            const vidRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${YT_CONFIG.MAX_RESULTS_PER_FETCH}${pageParam}&key=${YT_CONFIG.API_KEY}`);
            const vidData = await vidRes.json();
            
            const mapped = vidData.items.map(item => ({
                id: item.contentDetails.videoId,
                title: item.snippet.title,
                description: item.snippet.description,
                date: new Date(item.snippet.publishedAt),
                thumb: `https://i.ytimg.com/vi/${item.contentDetails.videoId}/maxresdefault.jpg`
            }));
            
            videos = [...videos, ...mapped];
            pageToken = vidData.nextPageToken;
            if (!pageToken) break;
        }

        this.state.allVideos = videos;

        // Save to Cache
        sessionStorage.setItem(this.cacheKey, JSON.stringify({
            timestamp: Date.now(),
            videos: this.state.allVideos,
            playlists: this.state.playlists
        }));

        this.renderCategories();
    }

    // ==========================================
    // FILTERING, SORTING, AND SEARCH
    // ==========================================
    applyFilters() {
        let result = [...this.state.allVideos];

        // Apply Search
        if (this.state.searchQuery) {
            const lowerQ = this.state.searchQuery.toLowerCase();
            result = result.filter(v => 
                v.title.toLowerCase().includes(lowerQ) || 
                v.description.toLowerCase().includes(lowerQ)
            );
        }

        // Apply Playlist Filter (Note: For precise playlist mapping, a secondary API call per category is ideal. 
        // Here we do title matching as a fast client-side heuristic, or fallback to API if strict playlist required).
        // Since we fetched from generic uploads, we filter by keyword in title if a playlist is selected.
        if (this.state.activePlaylist !== 'All') {
            const activeTitle = this.state.activePlaylist.toLowerCase().replace(' ministry', '').replace(' services', '');
            result = result.filter(v => v.title.toLowerCase().includes(activeTitle) || v.description.toLowerCase().includes(activeTitle));
        }

        // Apply Sort
        result.sort((a, b) => {
            return this.state.sortOrder === 'newest' ? b.date - a.date : a.date - b.date;
        });

        this.state.filteredVideos = result;
        
        // Ensure page is valid
        const maxPage = Math.ceil(result.length / YT_CONFIG.ITEMS_PER_PAGE);
        if (this.state.currentPage > maxPage) this.state.currentPage = maxPage || 1;

        this.updateURL();
        this.renderFeatured();
        this.renderGrid();
        this.renderPagination();
    }

    debounce(func, timeout = 300){
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => { func.apply(this, args); }, timeout);
        };
    }

    setupEventListeners() {
        // Search (Debounced)
        const processSearch = this.debounce((e) => {
            this.state.searchQuery = e.target.value;
            this.state.currentPage = 1;
            this.applyFilters();
        });
        this.elements.searchInput.addEventListener('input', processSearch);

        // Sort
        this.elements.sortSelect.addEventListener('change', (e) => {
            this.state.sortOrder = e.target.value;
            this.state.currentPage = 1;
            this.applyFilters();
        });

        // Categories (Event Delegation)
        this.elements.categoryWrapper.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-btn')) {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.state.activePlaylist = e.target.dataset.id;
                this.state.currentPage = 1;
                this.applyFilters();
            }
        });
    }

    // ==========================================
    // RENDERING & DOM MANIPULATION
    // ==========================================
    renderCategories() {
        this.elements.categoryWrapper.innerHTML = `<button class="btn btn-outline category-btn ${this.state.activePlaylist === 'All' ? 'active' : ''}" data-id="All">All Sermons</button>`;
        
        this.state.playlists.forEach(playlist => {
            const isActive = this.state.activePlaylist === playlist.title ? 'active' : '';
            this.elements.categoryWrapper.insertAdjacentHTML('beforeend', 
                `<button class="btn btn-outline category-btn ${isActive}" data-id="${playlist.title}">${playlist.title}</button>`
            );
        });
    }

    renderFeatured() {
        if (this.state.filteredVideos.length === 0 || this.state.searchQuery !== '' || this.state.currentPage !== 1) {
            this.elements.featuredContainer.style.display = 'none';
            return;
        }

        const featured = this.state.filteredVideos[0];
        this.elements.featuredContainer.style.display = 'block';
        
        this.elements.featuredCard.innerHTML = `
            <div class="featured-video-frame" onclick="playVideo(this, '${featured.id}')" aria-label="Play ${featured.title}" tabindex="0" role="button">
                <img src="${featured.thumb}" alt="${featured.title}" loading="lazy">
                <div class="sermon-overlay" style="opacity: 1; background: rgba(0,0,0,0.2);"><div class="play-trigger" style="transform: scale(1.2)"><i class="fas fa-play"></i></div></div>
            </div>
            <div class="featured-info">
                <span class="hero-pre-tag">Latest Release</span>
                <h3>${featured.title}</h3>
                <p class="sermon-meta"><i class="far fa-calendar-alt"></i> ${featured.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p>${featured.description.substring(0, 180)}...</p>
                <div>
                    <button class="btn btn-primary" onclick="window.open('https://youtube.com/watch?v=${featured.id}', '_blank')">Watch on YouTube</button>
                </div>
            </div>
        `;
    }

    renderGrid() {
        this.elements.grid.innerHTML = '';
        
        if (this.state.filteredVideos.length === 0) {
            this.elements.grid.innerHTML = `<div class="error-card"><i class="fas fa-search"></i><h3>No sermons found</h3><p>Try adjusting your search or category filters.</p></div>`;
            return;
        }

        // Calculate offset
        // If featured is showing, we skip index 0 in the grid on page 1.
        const isFeaturedShowing = this.elements.featuredContainer.style.display === 'block';
        let itemsToRender = [...this.state.filteredVideos];
        
        if (isFeaturedShowing && this.state.currentPage === 1) {
            itemsToRender.shift(); // Remove the featured video from the grid
        }

        const start = (this.state.currentPage - 1) * YT_CONFIG.ITEMS_PER_PAGE;
        const paginatedItems = itemsToRender.slice(start, start + YT_CONFIG.ITEMS_PER_PAGE);

        paginatedItems.forEach(video => {
            const card = `
                <article class="sermon-card animate-on-scroll slide-up active">
                    <div class="sermon-thumbnail" onclick="playVideo(this, '${video.id}')" role="button" tabindex="0" aria-label="Play ${video.title}">
                        <img src="${video.thumb}" alt="${video.title}" loading="lazy">
                        <div class="sermon-overlay"><div class="play-trigger"><i class="fas fa-play"></i></div></div>
                    </div>
                    <div class="sermon-details">
                        <h3 title="${video.title}">${video.title}</h3>
                        <p class="sermon-meta">${video.date.toLocaleDateString()}</p>
                        <div class="sermon-actions">
                            <a href="https://youtube.com/watch?v=${video.id}" target="_blank" class="action-link text-primary">Watch <i class="fas fa-external-link-alt ml-1"></i></a>
                        </div>
                    </div>
                </article>`;
            this.elements.grid.insertAdjacentHTML('beforeend', card);
        });
    }

    renderPagination() {
        this.elements.pagination.innerHTML = '';
        
        const totalItems = this.elements.featuredContainer.style.display === 'block' && this.state.currentPage === 1 
            ? this.state.filteredVideos.length - 1 
            : this.state.filteredVideos.length;
            
        const totalPages = Math.ceil(totalItems / YT_CONFIG.ITEMS_PER_PAGE);
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
                    this.applyFilters();
                    document.getElementById('sermon-controls').scrollIntoView({ behavior: 'smooth' });
                });
            }
            return btn;
        };

        // Prev & First
        this.elements.pagination.appendChild(createBtn('&laquo; First', 1, 'wide', this.state.currentPage === 1));
        this.elements.pagination.appendChild(createBtn('&lsaquo; Prev', this.state.currentPage - 1, 'wide', this.state.currentPage === 1));

        // Pages (Dynamic Range)
        let startPage = Math.max(1, this.state.currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

        for (let i = startPage; i <= endPage; i++) {
            this.elements.pagination.appendChild(createBtn(i, i));
        }

        // Next & Last
        this.elements.pagination.appendChild(createBtn('Next &rsaquo;', this.state.currentPage + 1, 'wide', this.state.currentPage === totalPages));
        this.elements.pagination.appendChild(createBtn('Last &raquo;', totalPages, 'wide', this.state.currentPage === totalPages));
    }

    renderSkeletons() {
        this.elements.grid.innerHTML = '';
        for (let i = 0; i < 8; i++) {
            this.elements.grid.innerHTML += `
                <div class="skeleton-card skeleton-box">
                    <div class="skeleton-thumb"></div>
                    <div class="skeleton-body">
                        <div class="skeleton-line title"></div>
                        <div class="skeleton-line title" style="width: 70%"></div>
                        <div class="skeleton-line meta"></div>
                        <div class="skeleton-line action"></div>
                    </div>
                </div>`;
        }
    }

    showError(msg) {
        this.elements.grid.innerHTML = `
            <div class="error-card">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Service Unavailable</h3>
                <p>${msg}</p>
            </div>
        `;
    }

    // ==========================================
    // STATS ANIMATION
    // ==========================================
    updateStats() {
        this.elements.statsSection.style.display = 'block';
        
        this.animateValue(document.getElementById('stat-total-sermons'), 0, this.state.allVideos.length, 1500);
        this.animateValue(document.getElementById('stat-playlists'), 0, this.state.playlists.length, 1500);
        
        if (this.state.allVideos.length > 0) {
            document.getElementById('stat-latest-date').innerText = this.state.allVideos[0].date.toLocaleDateString();
        }
    }

    animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
}

// Global scope function for iframe injection to support lazy load autoplay
window.playVideo = function(containerElement, videoId) {
    containerElement.classList.add('yt-iframe-container');
    containerElement.innerHTML = `
        <iframe 
            src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" 
            title="YouTube video player" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
        </iframe>
    `;
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    new SermonApp();
});