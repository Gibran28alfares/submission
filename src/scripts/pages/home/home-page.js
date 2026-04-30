import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { 
  createIcons, 
  Locate, 
  MapPin,
  RefreshCw, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  User,
  Maximize2,
  Search,
  Heart
} from 'lucide';
import StoryApi from '../../data/api.js';
import FavoriteStoryIdb from '../../data/favorite-idb.js';
import CONFIG from '../../config.js';
import { showMessage, createSkeleton } from '../../utils/index.js';

// Fix Leaflet default icon issue with build tools
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIconRetina,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default class HomePage {
  #map = null;
  #markers = [];
  #stories = [];

  async render() {
    return `
      <section class="container px-0 md:px-6">
        <div class="py-8 px-6 md:px-0 space-y-4 text-center lg:text-left">
          <h1 class="text-4xl font-bold tracking-tight text-[#141414]">Jelajahi Cerita</h1>
          <p class="text-lg text-[#4a4a4a] max-w-2xl leading-relaxed mx-auto lg:mx-0">Berbagi momen dan temukan cerita menarik melalui peta interaktif kami.</p>
        </div>

        <!-- Search & Filter Bar -->
        <div class="px-6 lg:px-0 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="relative">
            <label for="search-input" class="sr-only">Cari Cerita</label>
            <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
            <input type="text" id="search-input" placeholder="Cari cerita..." aria-label="Cari cerita" class="w-full pl-12 pr-4 py-3 bg-white border border-[#eeeeee] rounded-2xl text-sm focus:ring-2 focus:ring-black outline-none transition-all shadow-sm">
          </div>
          <div class="flex items-center gap-4">
            <label for="sort-select" class="sr-only">Urutkan Berdasarkan</label>
            <select id="sort-select" aria-label="Urutkan berdasarkan" class="flex-1 px-4 py-3 bg-white border border-[#eeeeee] rounded-2xl text-sm focus:ring-2 focus:ring-black outline-none transition-all shadow-sm appearance-none">
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="az">A - Z</option>
            </select>
            <button id="btn-refresh" aria-label="Segarkan data cerita" class="flex items-center gap-2 text-[10px] font-black text-[#141414] uppercase tracking-widest hover:bg-slate-50 px-6 py-3 rounded-2xl transition-all border border-slate-100 bg-white shadow-sm">
                <i data-lucide="refresh-cw" class="w-3 h-3"></i> Segarkan
            </button>
          </div>
        </div>

        <div class="flex flex-col lg:flex-row gap-8 items-start relative">
          <!-- Story List Side -->
          <div class="w-full lg:w-1/2 order-2 lg:order-1 space-y-6 pb-20">
            <div class="flex items-center justify-between px-6 lg:px-0">
              <h2 class="text-2xl font-bold text-[#141414]" id="status-title">Semua Cerita</h2>
            </div>
            
            <div id="story-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 px-6 lg:px-0">
               ${createSkeleton(6)}
            </div>
          </div>

          <!-- Map Side (Sticky) -->
          <div class="w-full lg:w-1/2 order-1 lg:order-2 h-[400px] lg:h-[calc(100vh-120px)] lg:sticky lg:top-24 z-10">
            <div class="card-minimal h-full w-full p-2 relative overflow-hidden">
              <div id="map" class="h-full w-full rounded-2xl"></div>
              
              <div class="absolute bottom-6 right-6 z-20 flex flex-col gap-3">
                <button id="btn-focus-user" class="btn-minimal bg-white w-10 h-10 shadow-xl flex items-center justify-center text-[#141414] hover:bg-slate-50 transition-all border border-slate-100" title="Lokasi Saya">
                  <i data-lucide="locate" class="w-5 h-5"></i>
                </button>
              </div>

              <div class="absolute bottom-6 left-6 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-4 text-[9px] font-bold border border-slate-100 z-20 shadow-lg uppercase tracking-widest text-[#4a4a4a]">
                 <div class="flex items-center gap-2">
                   <span class="w-2 h-2 bg-blue-600 rounded-full"></span> 
                   Lokasi Cerita
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    createIcons({
      icons: {
        Locate,
        RefreshCw,
        X,
        ChevronLeft,
        ChevronRight,
        User,
        Maximize2,
        Search,
        Heart
      }
    });

    this.#initMap();
    
    const token = localStorage.getItem(CONFIG.DEFAULT_TOKEN_KEY);
    await this.#loadStories(token);

    document.querySelector('#btn-refresh').addEventListener('click', () => {
      this.#loadStories(token);
    });

    document.querySelector('#btn-focus-user').addEventListener('click', () => {
      this.#focusToUser();
    });

    // Search and Filter Listeners
    const searchInput = document.querySelector('#search-input');
    const sortSelect = document.querySelector('#sort-select');

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.#filterAndRender();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        this.#filterAndRender();
      });
    }
  }

  #filterAndRender() {
    const searchInput = document.querySelector('#search-input');
    const sortSelect = document.querySelector('#sort-select');
    
    const searchQuery = searchInput ? searchInput.value.toLowerCase() : '';
    const sortBy = sortSelect ? sortSelect.value : 'newest';

    let filtered = this.#stories.filter(s => 
      s.name.toLowerCase().includes(searchQuery) || 
      s.description.toLowerCase().includes(searchQuery)
    );

    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'az') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    this.#renderStories(filtered);
  }

  #initMap() {
    if (this.#map) return;
    
    const street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
    });

    this.#map = L.map('map', {
      layers: [street]
    }).setView([-2.5489, 118.0149], 5);

    // Place layer control at topleft (stacked below zoom)
    L.control.layers(
      { "Peta Jalan": street, "Satelit": satellite },
      null, 
      { position: 'topleft' }
    ).addTo(this.#map);

    // Fix for blank map in SPAs
    setTimeout(() => {
      if (this.#map) this.#map.invalidateSize();
    }, 200);
  }

  async #loadStories(token) {
    try {
      const response = await StoryApi.getAllStories(token);
      if (response.error) throw new Error(response.message);
      this.#stories = response.listStory;
      this.#filterAndRender();
    } catch (err) {
      showMessage(`Gagal: ${err.message}`, true);
    }
  }

  async #renderStories(stories) {
    const list = document.querySelector('#story-list');
    list.innerHTML = '';
    
    this.#markers.forEach(m => this.#map.removeLayer(m));
    this.#markers = [];

    const storiesWithStatus = await Promise.all(stories.map(async (story) => {
      const isFavorite = !!(await FavoriteStoryIdb.getStory(story.id));
      return { ...story, isFavorite };
    }));

    storiesWithStatus.forEach((story) => {
      // Add to List
      const card = document.createElement('article');
      card.className = 'card-minimal flex flex-col group relative';
      card.innerHTML = `
        <div class="relative overflow-hidden h-52">
          <img src="${story.photoUrl}" alt="Foto cerita oleh ${story.name}" class="w-full h-full object-cover group-hover:scale-105 transition-all duration-500">
          <button class="btn-favorite absolute top-4 right-4 w-12 h-12 rounded-full bg-white flex items-center justify-center transition-all hover:scale-110 shadow-2xl z-20 border-2 border-slate-50" aria-label="${story.isFavorite ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}">
            <i data-lucide="heart" class="w-6 h-6 ${story.isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-900'}"></i>
          </button>
        </div>
        <div class="p-6 space-y-4 flex flex-col flex-grow">
          <div class="space-y-1">
            <h3 class="font-bold text-lg leading-tight group-hover:text-blue-600 transition-colors">${story.name}</h3>
            <p class="text-[10px] uppercase font-bold text-slate-400 tracking-widest">${new Date(story.createdAt).toLocaleDateString()}</p>
          </div>
          <p class="text-sm text-[#4a4a4a] line-clamp-3 leading-relaxed">${story.description}</p>
          <div class="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
            <button class="btn-focus text-xs font-black uppercase tracking-tighter hover:underline">Lokasi Peta</button>
            <span class="text-[9px] text-slate-300 font-mono italic">ID: ${story.id.substring(0,6)}</span>
          </div>
        </div>
      `;
      list.appendChild(card);
      
      const favoriteBtn = card.querySelector('.btn-favorite');
      favoriteBtn.onclick = async (e) => {
        e.stopPropagation();
        const currentIsFavorite = story.isFavorite;
        if (currentIsFavorite) {
          await FavoriteStoryIdb.deleteStory(story.id);
          story.isFavorite = false;
          showMessage('Dihapus dari favorit');
        } else {
          await FavoriteStoryIdb.putStory({ ...story, isFavorite: true });
          story.isFavorite = true;
          showMessage('Ditambahkan ke favorit');
        }
        await this.#renderStories(stories); // Re-render to update UI
      };

      const focusBtn = card.querySelector('.btn-focus');
      focusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (story.lat && story.lon) {
           this.#map.flyTo([story.lat, story.lon], 15);
           // On small screens, we might still want to scroll up to the map
           if (window.innerWidth < 1024) {
             window.scrollTo({ top: 300, behavior: 'smooth' });
           }
        } else {
           showMessage('Koordinat tidak tersedia', true);
        }
      });

      card.addEventListener('click', () => {
        this.#showModal(story);
      });

      if (story.lat && story.lon) {
        const marker = L.marker([story.lat, story.lon]).addTo(this.#map);
        marker.bindPopup(`
          <div class="p-2 space-y-2">
            <img src="${story.photoUrl}" alt="Thumbnail cerita ${story.name}" class="w-full h-24 object-cover rounded-lg">
            <h4 class="font-bold text-sm">${story.name}</h4>
            <button class="w-full py-1.5 bg-black text-white text-[10px] font-bold rounded-lg uppercase tracking-widest mt-1">Lihat Detail</button>
          </div>
        `);
        
        marker.on('click', () => {
          this.#map.flyTo([story.lat, story.lon], 15);
        });

        marker.getPopup().on('add', () => {
           const btn = document.querySelector('.leaflet-popup-content button');
           if (btn) btn.onclick = () => this.#showModal(story);
        });

        this.#markers.push(marker);
      }
    });

    createIcons({
      icons: { Heart }
    });
  }

  async #showModal(story) {
    const isFavorite = !!(await FavoriteStoryIdb.getStory(story.id));
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <button class="modal-close group" aria-label="Tutup Detail Cerita">
          <i data-lucide="x" class="w-5 h-5 text-slate-800 transition-colors group-hover:text-red-500"></i>
        </button>
        <div class="overflow-y-auto custom-scrollbar">
          <div class="relative">
            <img src="${story.photoUrl}" alt="Foto lengkap cerita oleh ${story.name}" class="w-full h-[400px] object-cover">
            <button class="btn-favorite-modal absolute bottom-6 right-6 lg:right-10 w-16 h-16 rounded-full bg-white flex items-center justify-center transition-all hover:scale-110 shadow-2xl z-20 border-2 border-slate-100" aria-label="${isFavorite ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}">
               <i data-lucide="heart" class="w-8 h-8 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-900'}"></i>
            </button>
          </div>
          <div class="p-10 space-y-6">
            <div class="space-y-2">
               <div class="flex items-center gap-3">
                 <h2 class="text-3xl font-black tracking-tight">${story.name}</h2>
                 <span class="px-3 py-1 bg-slate-100 text-[10px] font-bold rounded-full uppercase tracking-widest">Community Story</span>
               </div>
               <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">${new Date(story.createdAt).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</p>
            </div>
            
            <p class="text-lg text-[#4a4a4a] leading-relaxed">${story.description}</p>
            
            <div class="pt-8 border-t border-slate-50 flex items-center justify-between">
               <div class="flex items-center gap-4">
                  <div class="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-400">
                    <i data-lucide="user" class="w-5 h-5"></i>
                  </div>
                  <div>
                    <p class="text-xs font-bold font-mono uppercase text-slate-400">Contributor</p>
                    <p class="text-sm font-bold">${story.name}</p>
                  </div>
               </div>
               
               ${story.lat ? `
                <button class="btn-minimal bg-black text-white text-[10px] uppercase font-black tracking-widest px-8 py-4 flex items-center gap-3 shadow-2xl hover:bg-slate-800 transition-all" id="modal-focus-map">
                   <i data-lucide="map-pin" class="w-4 h-4 text-blue-400"></i> Lihat di Peta
                </button>
               ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    createIcons({
      icons: { X, User, MapPin, Heart }
    });

    const closeModal = () => {
      modal.remove();
      document.body.style.overflow = '';
    };

    const favoriteModalBtn = modal.querySelector('.btn-favorite-modal');
    favoriteModalBtn.onclick = async () => {
      const currentStatus = !!(await FavoriteStoryIdb.getStory(story.id));
      if (currentStatus) {
        await FavoriteStoryIdb.deleteStory(story.id);
        story.isFavorite = false;
        showMessage('Dihapus dari favorit');
      } else {
        await FavoriteStoryIdb.putStory({ ...story, isFavorite: true });
        story.isFavorite = true;
        showMessage('Ditambahkan ke favorit');
      }
      await this.#renderStories(this.#stories); // Refresh list underlying
      // UI update inside modal
      const icon = favoriteModalBtn.querySelector('i');
      if (currentStatus) {
        icon.classList.remove('fill-red-500', 'text-red-500');
        icon.classList.add('text-slate-900');
      } else {
        icon.classList.add('fill-red-500', 'text-red-500');
        icon.classList.remove('text-slate-900');
      }
    };

    modal.querySelector('.modal-close').onclick = closeModal;
    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };

    const mapBtn = modal.querySelector('#modal-focus-map');
    if (mapBtn) {
      mapBtn.onclick = () => {
        this.#map.flyTo([story.lat, story.lon], 15);
        closeModal();
        if (window.innerWidth < 1024) {
          window.scrollTo({ top: 300, behavior: 'smooth' });
        }
      };
    }
  }

  #focusToUser() {
    if (!navigator.geolocation) return showMessage('GPS tidak tersedia', true);
    navigator.geolocation.getCurrentPosition((pos) => {
      this.#map.flyTo([pos.coords.latitude, pos.coords.longitude], 13);
      L.circle([pos.coords.latitude, pos.coords.longitude], { radius: 200, color: '#2563eb' }).addTo(this.#map);
    });
  }

  destroy() {
    if (this.#map) {
      this.#map.remove();
      this.#map = null;
    }
  }
}
