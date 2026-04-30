import { createIcons, PenTool, Map } from 'lucide';

export default class AboutPage {
  async render() {
    return `
      <section class="container max-w-2xl py-12 space-y-16">
        <div class="text-center space-y-6">
          <h1 class="text-5xl font-black tracking-tighter text-[#141414]">Berbagi Kisah</h1>
          <p class="text-xl text-[#4a4a4a] leading-relaxed">Platform minimalis untuk mengabadikan momen dan berbagi inspirasi dengan komunitas di seluruh dunia.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="card-minimal p-8 flex flex-col gap-6 transition-all hover:scale-[1.02]">
            <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <i data-lucide="pen-tool" class="w-6 h-6"></i>
            </div>
            <h2 class="text-xl font-bold text-[#141414]">Tulis Cerita</h2>
            <p class="text-sm text-[#4a4a4a] leading-relaxed">Ekspresikan diri Anda melalui tulisan dan foto yang dapat Anda unggah dengan mudah.</p>
          </div>

          <div class="card-minimal p-8 flex flex-col gap-6 transition-all hover:scale-[1.02]">
            <div class="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center">
              <i data-lucide="map" class="w-6 h-6"></i>
            </div>
            <h2 class="text-xl font-bold text-[#141414]">Peta Visual</h2>
            <p class="text-sm text-[#4a4a4a] leading-relaxed">Lihat sebaran cerita dari berbagai lokasi melalui integrasi peta interaktif yang presisi.</p>
          </div>
        </div>

        <div class="bg-[#141414] rounded-[2.5rem] p-12 text-center space-y-8 text-white relative overflow-hidden">
          <div class="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
          <h2 class="text-3xl font-bold">Siap Menulis?</h2>
          <p class="text-slate-400 max-w-sm mx-auto">Mulai bagikan pengalaman unik Anda hari ini di StoryApp.</p>
          <a href="#/register" class="btn-minimal bg-white text-black hover:bg-slate-100 transition-all font-bold px-10">Daftar Sekarang</a>
        </div>
      </section>
    `;
  }

  async afterRender() {
    createIcons({
      icons: { PenTool, Map }
    });
  }
}
