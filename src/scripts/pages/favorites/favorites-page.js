import { 
  createIcons, 
  Trash2, 
  Heart, 
  MapPin, 
  User, 
  X, 
  Edit3,
  Save,
  MessageSquare
} from 'lucide';
import FavoriteStoryIdb from '../../data/favorite-idb.js';
import { showMessage } from '../../utils/index.js';

export default class FavoritesPage {
  async render() {
    return `
      <section class="container px-6 py-12">
        <div class="mb-12 space-y-4">
          <h1 class="text-4xl font-black tracking-tight text-[#141414]">Cerita Favorit</h1>
          <p class="text-lg text-[#4a4a4a] max-w-2xl leading-relaxed">Daftar cerita pilihan Anda yang tersimpan secara lokal dan dapat diakses kapan saja.</p>
        </div>

        <div id="favorites-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           <div class="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4">
              <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                 <i data-lucide="heart" class="w-10 h-10 text-slate-900"></i>
              </div>
              <p class="text-slate-400 font-medium">Belum ada cerita favorit yang disimpan.</p>
              <a href="#/" class="text-sm font-bold uppercase tracking-widest text-blue-600 hover:underline">Cari Cerita Menarik</a>
           </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    createIcons({
      icons: { Trash2, Heart, MapPin, User, X, Edit3, Save, MessageSquare }
    });

    await this.#loadFavorites();
  }

  async #loadFavorites() {
    const listContainer = document.querySelector('#favorites-list');
    const stories = await FavoriteStoryIdb.getAllStories();

    if (stories.length === 0) {
      listContainer.innerHTML = `
        <div class="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4">
            <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                <i data-lucide="heart" class="w-10 h-10 text-slate-900"></i>
            </div>
            <p class="text-slate-400 font-medium">Belum ada cerita favorit yang disimpan.</p>
            <a href="#/" class="text-sm font-bold uppercase tracking-widest text-blue-600 hover:underline">Cari Cerita Menarik</a>
        </div>
      `;
      createIcons({ icons: { Heart } });
      return;
    }

    listContainer.innerHTML = '';
    stories.forEach((story) => {
      const card = document.createElement('article');
      card.className = 'card-minimal flex flex-col group overflow-hidden bg-white shadow-sm border border-[#eeeeee] rounded-3xl transition-all hover:shadow-xl';
      card.innerHTML = `
        <div class="relative h-64 overflow-hidden">
          <img src="${story.photoUrl}" alt="Foto ${story.name}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
          <button class="btn-delete absolute top-6 right-6 w-12 h-12 rounded-2xl bg-white/95 backdrop-blur-md flex items-center justify-center text-red-500 shadow-2xl transition-all hover:bg-red-500 hover:text-white z-30" title="Hapus dari Favorit">
            <i data-lucide="trash-2" class="w-5 h-5"></i>
          </button>
        </div>
        <div class="p-8 space-y-6 flex flex-col flex-grow">
          <div class="space-y-2">
            <h3 class="text-xl font-bold text-[#141414] leading-tight">${story.name}</h3>
            <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">${new Date(story.createdAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
          </div>
          
          <div class="space-y-4">
             <p class="text-sm text-[#4a4a4a] leading-relaxed line-clamp-3">${story.description}</p>
             
             <div class="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col gap-3 group/note">
                <div class="flex items-center justify-between">
                   <div class="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-slate-400">
                      <i data-lucide="message-square" class="w-3 h-3"></i> Catatan Lokal
                   </div>
                   <button class="btn-edit-note text-[10px] font-black uppercase text-blue-600 hover:underline hidden group-hover/note:block">
                      Edit
                   </button>
                </div>
                <p id="note-${story.id}" class="text-xs text-slate-600 italic">
                   ${story.localNote || 'Tambahkan catatan pribadi Anda di sini...'}
                </p>
             </div>
          </div>

          <div class="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
            <button class="btn-view-detail text-xs font-black uppercase tracking-widest text-[#141414] flex items-center gap-2 hover:translate-x-2 transition-transform">
               Detail <i data-lucide="chevron-right" class="w-3 h-3"></i>
            </button>
            <span class="text-[9px] text-slate-300 font-mono font-bold tracking-tighter">FAV#${story.id.substring(0,8)}</span>
          </div>
        </div>
      `;
      listContainer.appendChild(card);

      // Delete logic
      const btnDelete = card.querySelector('.btn-delete');
      btnDelete.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
          await FavoriteStoryIdb.deleteStory(story.id);
          showMessage('Berhasil dihapus dari favorit');
          await this.#loadFavorites();
        } catch (err) {
          console.error('Failed to delete story:', err);
          showMessage('Gagal menghapus cerita', true);
        }
      };

      // Edit Note logic (Update part of CRUD)
      card.querySelector('.btn-edit-note').onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.#showEditNoteModal(story);
      };

      // View Detail logic
      card.querySelector('.btn-view-detail').onclick = (e) => {
        e.preventDefault();
        this.#showDetailModal(story);
      };
    });

    createIcons({
      icons: { Trash2, Heart, Edit3, MessageSquare, MapPin, User, X, Save }
    });
  }

  #showEditNoteModal(story) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content max-w-lg">
        <button class="modal-close group" aria-label="Tutup">
          <i data-lucide="x" class="w-5 h-5 transition-colors group-hover:text-red-500"></i>
        </button>
        <div class="p-10 space-y-6">
           <div class="space-y-2">
              <h2 class="text-2xl font-black italic tracking-tighter">Edit Catatan Pribadi</h2>
              <p class="text-xs text-slate-400 font-bold uppercase tracking-widest">Catatan ini hanya tersimpan di perangkat Anda.</p>
           </div>
           
           <div class="space-y-2">
             <label for="local-note-input" class="sr-only">Catatan Pribadi</label>
             <textarea id="local-note-input" class="w-full min-h-[150px] p-6 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-2 focus:ring-black transition-all text-sm leading-relaxed" placeholder="Tulis sesuatu tentang cerita ini...">${story.localNote || ''}</textarea>
           </div>
           
           <button id="btn-save-note" class="w-full py-4 bg-black text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
              <i data-lucide="save" class="w-4 h-4"></i> Simpan Catatan
           </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    createIcons({ icons: { X, Save } });

    const closeModal = () => modal.remove();
    modal.querySelector('.modal-close').onclick = closeModal;
    
    modal.querySelector('#btn-save-note').onclick = async () => {
      const note = modal.querySelector('#local-note-input').value;
      await FavoriteStoryIdb.updateStory({ id: story.id, localNote: note });
      showMessage('Catatan diperbarui');
      closeModal();
      await this.#loadFavorites();
    };
  }

  #showDetailModal(story) {
    // Reuse detail modal logic but simpler for favorites
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <button class="modal-close group" aria-label="Tutup">
          <i data-lucide="x" class="w-5 h-5 transition-colors group-hover:text-red-500"></i>
        </button>
        <div class="overflow-y-auto max-h-[80vh]">
          <img src="${story.photoUrl}" alt="${story.name}" class="w-full h-96 object-cover">
          <div class="p-10 space-y-6">
            <h2 class="text-3xl font-black tracking-tight">${story.name}</h2>
            <p class="text-lg text-[#4a4a4a] leading-relaxed">${story.description}</p>
            ${story.localNote ? `
              <div class="p-6 bg-blue-50 border border-blue-100 rounded-3xl space-y-2">
                 <p class="text-[10px] font-black uppercase tracking-widest text-blue-400">Catatan Favorit Anda</p>
                 <p class="text-sm text-blue-800 italic leading-relaxed">"${story.localNote}"</p>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    createIcons({ icons: { X } });
    modal.querySelector('.modal-close').onclick = () => modal.remove();
  }
}
