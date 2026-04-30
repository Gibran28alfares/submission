import { 
  createIcons, 
  ArrowLeft, 
  Calendar, 
  User, 
  MapPin,
  Heart
} from 'lucide';
import StoryApi from '../../data/api';
import FavoriteStoryIdb from '../../data/favorite-idb';
import CONFIG from '../../config';
import { parseActivePathname } from '../../routes/url-parser';
import { showMessage } from '../../utils';

class DetailPage {
  async render() {
    return `
      <section class="container px-6 max-w-4xl mx-auto py-8">
        <div class="mb-8">
          <a href="#/" class="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-black transition-colors">
            <i data-lucide="arrow-left" class="w-4 h-4"></i> Kembali ke Beranda
          </a>
        </div>

        <div id="detail-content" class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div class="h-96 w-full bg-slate-200 rounded-3xl animate-pulse"></div>
           <div class="space-y-4">
              <div class="h-8 w-1/2 bg-slate-200 rounded animate-pulse"></div>
              <div class="h-4 w-1/4 bg-slate-200 rounded animate-pulse"></div>
              <div class="h-24 w-full bg-slate-200 rounded animate-pulse"></div>
           </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    createIcons({
      icons: { ArrowLeft, Calendar, User, MapPin }
    });

    const { id } = parseActivePathname();
    const token = localStorage.getItem(CONFIG.DEFAULT_TOKEN_KEY);
    
    if (id) {
      await this.#fetchAndRenderDetail(token, id);
    } else {
      showMessage('ID Cerita tidak ditemukan', true);
      window.location.hash = '#/';
    }
  }

  async #fetchAndRenderDetail(token, id) {
    try {
      const response = await StoryApi.getStoryDetail(token, id);
      if (response.error) throw new Error(response.message);
      
      const story = response.story;
      this.#renderStory(story);
    } catch (error) {
      showMessage(`Gagal memuat detail: ${error.message}`, true);
      document.querySelector('#detail-content').innerHTML = `
        <div class="text-center py-20 space-y-4">
          <p class="text-slate-400">Cerita tidak dapat ditemukan atau terjadi kesalahan.</p>
          <a href="#/" class="text-blue-600 font-bold hover:underline">Kembali</a>
        </div>
      `;
    }
  }

  async #renderStory(story) {
    const container = document.querySelector('#detail-content');
    const date = new Date(story.createdAt).toLocaleString('id-ID', { 
      dateStyle: 'full', 
      timeStyle: 'short' 
    });

    const isFavorite = !!(await FavoriteStoryIdb.getStory(story.id));
    
    container.innerHTML = `
      <div class="card-minimal overflow-hidden rounded-3xl shadow-xl relative">
        <button id="btn-favorite-detail" class="absolute top-8 right-8 w-16 h-16 rounded-full bg-white flex items-center justify-center transition-all hover:scale-110 shadow-2xl z-20 border-2 border-slate-100" aria-label="${isFavorite ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}">
            <i data-lucide="heart" class="w-8 h-8 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-900'}"></i>
        </button>
        <img src="${story.photoUrl}" alt="Foto oleh ${story.name}" class="w-full h-[500px] object-cover">
        
        <div class="p-8 md:p-12 space-y-8">
          <div class="space-y-4">
            <div class="flex flex-wrap items-center gap-4">
               <h1 class="text-4xl font-black tracking-tight text-[#141414]">${story.name}</h1>
               <span class="px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-blue-100">Verified Story</span>
            </div>
            
            <div class="flex flex-wrap items-center gap-6 text-slate-400">
               <div class="flex items-center gap-2 text-sm">
                  <i data-lucide="user" class="w-4 h-4"></i>
                  <span class="font-bold text-slate-600">${story.name}</span>
               </div>
               <div class="flex items-center gap-2 text-sm">
                  <i data-lucide="calendar" class="w-4 h-4"></i>
                  <span>${date}</span>
               </div>
               ${story.lat ? `
                 <div class="flex items-center gap-2 text-sm">
                    <i data-lucide="map-pin" class="w-4 h-4 text-red-400"></i>
                    <span class="text-slate-600 font-medium">${story.lat.toFixed(4)}, ${story.lon.toFixed(4)}</span>
                 </div>
               ` : ''}
            </div>
          </div>

          <div class="prose prose-slate max-w-none">
             <p class="text-lg text-[#4a4a4a] leading-relaxed whitespace-pre-wrap">${story.description}</p>
          </div>

          ${story.lat ? `
            <div class="pt-8 border-t border-slate-100">
               <div class="bg-slate-50 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div class="space-y-1 text-center md:text-left">
                     <p class="text-xs font-black uppercase tracking-widest text-slate-400">Lokasi Koordinat</p>
                     <p class="text-sm font-bold text-slate-600">Lihat lokasi tepat ini di peta utama.</p>
                  </div>
                  <a href="#/" class="btn-minimal bg-black text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg">
                    Tampilkan di Peta
                  </a>
               </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    createIcons({
      icons: { Calendar, User, MapPin, Heart }
    });

    const favoriteBtn = document.querySelector('#btn-favorite-detail');
    favoriteBtn.onclick = async () => {
      const currentStatus = !!(await FavoriteStoryIdb.getStory(story.id));
      if (currentStatus) {
        await FavoriteStoryIdb.deleteStory(story.id);
        showMessage('Dihapus dari favorit');
      } else {
        await FavoriteStoryIdb.putStory({ ...story, isFavorite: true });
        showMessage('Ditambahkan ke favorit');
      }
      
      // Update UI
      const icon = favoriteBtn.querySelector('i');
      if (currentStatus) {
        icon.classList.remove('fill-red-500', 'text-red-500');
        icon.classList.add('text-slate-900');
      } else {
        icon.classList.add('fill-red-500', 'text-red-500');
        icon.classList.remove('text-slate-900');
      }
    };
  }
}

export default DetailPage;
