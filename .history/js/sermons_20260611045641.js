

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
            const data = JSON.parse(cached);
            if (Date.now() - data.timestamp < this.cacheExpiry) {
                this.state.allVideos = data.videos;
                this.state.playlists = data.playlists;
                this.renderCategories();
                return;
            }
        }

        const playlists = await fetch(
            `https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${YT_CONFIG.CHANNEL_ID}&maxResults=50&key=${YT_CONFIG.API_KEY}`
        );

        const playlistData = await playlists.json();
        this.state.playlists = playlistData.items.map(p => ({
            id: p.id,
            title: p.snippet.title
        }));

        const collection = [];
        for (const playlist of this.state.playlists) {
            let pageToken = '';
            do {
                const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlist.id}&maxResults=50${pageToken ? '&pageToken=' + pageToken : ''}&key=${YT_CONFIG.API_KEY}`;
                const response = await fetch(url);
                const data = await response.json();

                data.items.forEach(item => {
                    if (item.contentDetails) {
                        collection.push({
                            id: item.contentDetails.videoId,
                            title: item.snippet.title,
                            description: item.snippet.description,
                            playlist: playlist.title,
                            playlistId: playlist.id,
                            thumb: `https://i.ytimg.com/vi/${item.contentDetails.videoId}/hqdefault.jpg`,
                            date: new Date(item.snippet.publishedAt)
                        });
                    }
                });

                pageToken = data.nextPageToken;
            } while (pageToken);
        }

        const unique = new Map();
        collection.forEach(v => {
            if (!unique.has(v.id)) {
                unique.set(v.id, v);
            }
        });

        this.state.allVideos = [...unique.values()];

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
        this.elements.featuredContainer.style.display = 'block';
        this.elements.featured.innerHTML = `
            <div class="featured-video-frame">
                <iframe width="100%" height="450" src="https://www.youtube.com/embed/${item.id}" allowfullscreen></iframe>
            </div>
            <div class="featured-info">
                <span class="hero-pre-tag">${item.playlist}</span>
                <h3>${item.title}</h3>
                <p>${item.description.slice(0, 220)}</p>
            </div>
        `;
    }

    renderGrid() {
        this.elements.grid.innerHTML = '';
        const start = (this.state.currentPage - 1) * YT_CONFIG.ITEMS_PER_PAGE;
        const rows = this.state.filteredVideos.slice(start, start + YT_CONFIG.ITEMS_PER_PAGE);

        rows.forEach(v => {
            this.elements.grid.insertAdjacentHTML(
                'beforeend',
                `
                <article class="sermon-card">
                    <div class="sermon-thumbnail">
                        <a target="_blank" href="https://youtube.com/watch?v=${v.id}">
                            <img src="${v.thumb}" alt="${v.title}">
                        </a>
                    </div>
                    <div class="sermon-details">
                        <h3>${v.title}</h3>
                        <p class="sermon-meta">${v.playlist}</p>
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

        const prevBtn = document.createElement('button');
        prevBtn.textContent = 'Previous';
        prevBtn.disabled = this.state.currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (this.state.currentPage > 1) {
                this.state.currentPage--;
                this.render();
            }
        });
        this.elements.pagination.appendChild(prevBtn);

        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Next';
        nextBtn.disabled = this.state.currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (this.state.currentPage < totalPages) {
                this.state.currentPage++;
                this.render();
            }
        });
        this.elements.pagination.appendChild(nextBtn);
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
