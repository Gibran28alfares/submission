import StoryApi from '../../data/api.js';
import { showMessage } from '../../utils/index.js';

export default class RegisterPage {
  async render() {
    return `
      <section class="container flex justify-center py-20">
        <div class="card-minimal w-full max-w-[420px] p-12 space-y-10">
          <div class="space-y-4">
            <h1 class="text-4xl font-black tracking-tight text-[#141414]">Daftar</h1>
            <p class="text-sm text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Buat akun untuk berkontribusi pada laporan.</p>
          </div>

          <form id="register-form" class="space-y-8">
            <div class="space-y-2">
              <label for="name" class="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">Nama Lengkap</label>
              <input type="text" id="name" name="name" required placeholder="John Doe" class="w-full px-5 py-4 bg-[#f9f9f9] border border-[#eeeeee] rounded-2xl text-sm focus:ring-2 focus:ring-black outline-none transition-all">
            </div>
            <div class="space-y-2">
              <label for="email" class="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">Email</label>
              <input type="email" id="email" name="email" required placeholder="name@email.com" class="w-full px-5 py-4 bg-[#f9f9f9] border border-[#eeeeee] rounded-2xl text-sm focus:ring-2 focus:ring-black outline-none transition-all">
            </div>
            <div class="space-y-2">
              <label for="password" class="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">Password</label>
              <input type="password" id="password" name="password" required placeholder="••••••••" class="w-full px-5 py-4 bg-[#f9f9f9] border border-[#eeeeee] rounded-2xl text-sm focus:ring-2 focus:ring-black outline-none transition-all">
            </div>
            <button type="submit" id="btn-register" class="w-full py-5 bg-[#141414] text-white rounded-[2rem] font-bold text-sm shadow-2xl hover:bg-[#333333] transition-all">DAFTAR SEKARANG</button>
          </form>

          <p class="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Sudah ada akun? <a href="#/login" class="text-blue-600 hover:underline">Masuk di sini</a>
          </p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const form = document.querySelector('#register-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const registerBtn = document.querySelector('#btn-register');
      registerBtn.disabled = true;
      registerBtn.innerText = 'MENDAFTAR...';

      try {
        const response = await StoryApi.register({
          name: form.name.value,
          email: form.email.value,
          password: form.password.value,
        });

        if (response.error) throw new Error(response.message);

        showMessage('Pendaftaran berhasil! Silakan masuk.');
        window.location.hash = '#/login';
      } catch (err) {
        showMessage(err.message, true);
        registerBtn.disabled = false;
        registerBtn.innerText = 'DAFTAR SEKARANG';
      }
    });
  }
}
