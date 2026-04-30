import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { createIcons, Camera, Folder, X } from 'lucide';

// Fix Leaflet default icon issue with build tools
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIconRetina,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
import StoryApi from '../../data/api.js';
import StoryDb from '../../data/db.js';
import CONFIG from '../../config.js';
import { showMessage } from '../../utils/index.js';

export default class AddPage {
  #map = null;
  #marker = null;
  #stream = null;

  async render() {
    return `
      <section class="container flex justify-center py-12">
        <div class="card-minimal w-full max-w-[520px] p-10 space-y-8">
          <div class="flex items-center justify-between">
            <h1 class="text-3xl font-black tracking-tight text-[#141414]">Tambah Cerita</h1>
            <a href="#/" class="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-black hover:bg-slate-50 transition-all">
              <i data-lucide="x" class="w-6 h-6"></i>
            </a>
          </div>

          <form id="add-form" class="space-y-6">
            <div class="space-y-2">
              <label for="description" class="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">Deskripsi Cerita</label>
              <textarea id="description" name="description" rows="4" required placeholder="Tuliskan pengalaman atau cerita menarik Anda di sini..." class="w-full px-5 py-4 bg-[#f9f9f9] border border-[#eeeeee] rounded-2xl text-sm focus:ring-2 focus:ring-black outline-none transition-all"></textarea>
            </div>

            <div class="space-y-4">
              <span class="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">Lampiran Foto</span>
              <div id="media-options" class="grid grid-cols-2 gap-4">
                <button type="button" id="btn-camera" class="h-28 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 hover:border-black hover:text-black transition-all bg-slate-50/50">
                  <i data-lucide="camera" class="w-8 h-8 mb-2"></i>
                  <span class="text-[9px] font-bold uppercase tracking-widest">Kamera</span>
                </button>
                <label for="photo" class="h-28 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 hover:border-black hover:text-black transition-all cursor-pointer bg-slate-50/50">
                  <i data-lucide="folder" class="w-8 h-8 mb-2"></i>
                  <span class="text-[9px] font-bold uppercase tracking-widest">Unggah</span>
                </label>
                <input type="file" id="photo" name="photo" accept="image/*" class="hidden">
              </div>

              <div id="camera-section" class="hidden space-y-4">
                 <div class="relative rounded-3xl overflow-hidden bg-black aspect-square">
                    <video id="video-preview" autoplay playsinline class="w-full h-full object-cover"></video>
                    <canvas id="canvas-capture" class="hidden"></canvas>
                    <button type="button" id="btn-capture" class="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white border-4 border-slate-200 shadow-2xl active:scale-90 transition-transform"></button>
                 </div>
                 <button type="button" id="btn-cancel-camera" class="w-full py-2 text-xs font-bold text-red-500 uppercase">Batalkan</button>
              </div>

              <div id="preview-container" class="hidden relative rounded-3xl overflow-hidden border border-slate-100 shadow-xl">
                 <img id="photo-preview" alt="Pratinjau foto cerita" class="w-full h-auto object-cover max-h-80">
                 <button type="button" id="btn-remove-photo" class="absolute top-4 right-4 bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all">
                    <i data-lucide="x" class="w-4 h-4"></i>
                 </button>
              </div>
            </div>

            <div class="space-y-3">
               <span class="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">Titik Lokasi</span>
               <div class="h-48 w-full rounded-2xl overflow-hidden border border-[#eeeeee]">
                  <div id="map-picker" class="h-full w-full"></div>
               </div>
               <div class="flex gap-4 px-1">
                  <div class="flex-1">
                    <label for="lat" class="text-[8px] uppercase font-bold text-slate-300 block">Lat</label>
                    <input type="text" id="lat" readonly class="w-full text-xs font-mono font-bold text-slate-500 bg-transparent outline-none">
                  </div>
                  <div class="flex-1">
                    <label for="lon" class="text-[8px] uppercase font-bold text-slate-300 block">Lon</label>
                    <input type="text" id="lon" readonly class="w-full text-xs font-mono font-bold text-slate-500 bg-transparent outline-none">
                  </div>
               </div>
            </div>

            <button type="submit" id="btn-submit" class="w-full py-5 bg-[#141414] text-white rounded-[2rem] font-bold text-sm shadow-2xl hover:bg-[#333333] transition-all disabled:opacity-50">
              Bagikan Cerita
            </button>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    createIcons({
      icons: { Camera, Folder, X }
    });
    this.#initMapPicker();
    this.#setupPhotoHandling();
    this.#setupFormSubmission();
  }

  #initMapPicker() {
    this.#map = L.map('map-picker').setView([-6.2088, 106.8456], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.#map);
    
    // Fix for blank map in SPAs
    setTimeout(() => {
      this.#map.invalidateSize();
    }, 100);

    this.#map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      if (this.#marker) this.#map.removeLayer(this.#marker);
      this.#marker = L.marker([lat, lng]).addTo(this.#map);
      document.querySelector('#lat').value = lat.toFixed(6);
      document.querySelector('#lon').value = lng.toFixed(6);
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        this.#map.setView([latitude, longitude], 15);
      });
    }
  }

  #setupPhotoHandling() {
    const fileInput = document.querySelector('#photo');
    const previewContainer = document.querySelector('#preview-container');
    const previewImg = document.querySelector('#photo-preview');
    const mediaOptions = document.querySelector('#media-options');
    const cameraSection = document.querySelector('#camera-section');

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          previewImg.src = event.target.result;
          previewContainer.classList.remove('hidden');
          mediaOptions.classList.add('hidden');
        };
        reader.readAsDataURL(file);
      }
    });

    document.querySelector('#btn-remove-photo').addEventListener('click', () => {
      fileInput.value = '';
      previewContainer.classList.add('hidden');
      mediaOptions.classList.remove('hidden');
    });

    // Camera logic
    document.querySelector('#btn-camera').addEventListener('click', async () => {
      try {
        this.#stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = document.querySelector('#video-preview');
        video.srcObject = this.#stream;
        cameraSection.classList.remove('hidden');
        mediaOptions.classList.add('hidden');
      } catch (err) {
        showMessage('Akses kamera ditolak', true);
      }
    });

    document.querySelector('#btn-capture').addEventListener('click', () => {
      const video = document.querySelector('#video-preview');
      const canvas = document.querySelector('#canvas-capture');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        
        previewImg.src = canvas.toDataURL('image/jpeg');
        previewContainer.classList.remove('hidden');
        this.#stopCamera();
      }, 'image/jpeg');
    });

    document.querySelector('#btn-cancel-camera').addEventListener('click', () => this.#stopCamera());
  }

  #stopCamera() {
    if (this.#stream) {
      this.#stream.getTracks().forEach(track => track.stop());
      this.#stream = null;
      
      const cameraSection = document.querySelector('#camera-section');
      const mediaOptions = document.querySelector('#media-options');
      if (cameraSection) cameraSection.classList.add('hidden');
      if (mediaOptions) mediaOptions.classList.remove('hidden');
    }
  }

  #setupFormSubmission() {
    const form = document.querySelector('#add-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.querySelector('#btn-submit');
      btn.disabled = true;
      btn.innerText = 'Mengirim...';

      const photoFile = form.photo.files[0];
      const description = form.description.value;
      const lat = form.lat.value;
      const lon = form.lon.value;

      const formData = new FormData();
      formData.append('description', description);
      formData.append('photo', photoFile);
      formData.append('lat', lat);
      formData.append('lon', lon);

      const token = localStorage.getItem(CONFIG.DEFAULT_TOKEN_KEY);
      
      try {
        if (!navigator.onLine) {
          throw new Error('Offline');
        }

        const response = await StoryApi.addStory(token, formData);
        if (response.error) throw new Error(response.message);
        
        // Show local notification if permitted
        if (Notification.permission === 'granted') {
          const registration = await navigator.serviceWorker.ready;
          registration.showNotification('Cerita Berhasil Dikirim', {
            body: 'Cerita Anda sudah tayang! Klik untuk melihat.',
            icon: '/images/logo.png',
            badge: '/favicon.png',
            data: { url: '/#/' }
          });
        }

        showMessage('Cerita Anda berhasil dibagikan!');
        window.location.hash = '#/';
      } catch (err) {
        if (err.message === 'Offline' || err.name === 'TypeError') {
          // Store for background sync
          try {
            await StoryDb.addPendingSync({
              description,
              photo: photoFile,
              lat,
              lon,
              token,
              createdAt: new Date().toISOString()
            });

            if ('serviceWorker' in navigator && 'SyncManager' in window) {
              const registration = await navigator.serviceWorker.ready;
              await registration.sync.register('sync-stories');
              showMessage('Anda sedang offline. Cerita disimpan dan akan diunggah saat online.');
              window.location.hash = '#/';
            } else {
              showMessage('Gagal mengirim. Silakan coba lagi saat online.', true);
              btn.disabled = false;
              btn.innerText = 'Bagikan Cerita';
            }
          } catch (dbErr) {
            console.error('Failed to save to IDB:', dbErr);
            showMessage('Gagal menyimpan cerita offline.', true);
            btn.disabled = false;
            btn.innerText = 'Bagikan Cerita';
          }
        } else {
          showMessage(err.message, true);
          btn.disabled = false;
          btn.innerText = 'Bagikan Cerita';
        }
      }
    });
  }

  destroy() {
    this.#stopCamera();
    if (this.#map) {
      this.#map.remove();
      this.#map = null;
    }
  }
}
