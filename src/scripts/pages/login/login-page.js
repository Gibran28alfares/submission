import StoryApi from '../../data/api.js';
import CONFIG from '../../config.js';
import { showMessage } from '../../utils/index.js';

export default class LoginPage {
  async render() {
    return `
      <section class="container flex justify-center py-20">
        <div class="card-minimal w-full max-w-[420px] p-12 space-y-10">
          <div class="space-y-4">
            <h1 class="text-4xl font-black tracking-tight text-[#141414]">Masuk</h1>
            <p class="text-sm text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Gunakan akun Anda untuk memantau situasi.</p>
          </div>

          <form id="login-form" class="space-y-8">
            <div class="space-y-2">
              <label for="email" class="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">Email</label>
              <input type="email" id="email" name="email" required placeholder="name@email.com" class="w-full px-5 py-4 bg-[#f9f9f9] border border-[#eeeeee] rounded-2xl text-sm focus:ring-2 focus:ring-black outline-none transition-all">
            </div>
            <div class="space-y-2">
              <label for="password" class="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">Password</label>
              <input type="password" id="password" name="password" required placeholder="••••••••" class="w-full px-5 py-4 bg-[#f9f9f9] border border-[#eeeeee] rounded-2xl text-sm focus:ring-2 focus:ring-black outline-none transition-all">
            </div>
            <button type="submit" id="btn-login" class="w-full py-5 bg-[#141414] text-white rounded-[2rem] font-bold text-sm shadow-2xl hover:bg-[#333333] transition-all">MASUK</button>
          </form>

          <p class="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Belum punya akun? <a href="#/register" class="text-blue-600 hover:underline">Daftar sekarang</a>
          </p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const form = document.querySelector('#login-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const loginBtn = document.querySelector('#btn-login');
      loginBtn.disabled = true;
      loginBtn.innerText = 'MEMPROSES...';

      try {
        const response = await StoryApi.login({
          email: form.email.value,
          password: form.password.value,
        });

        if (response.error) throw new Error(response.message);

        localStorage.setItem(CONFIG.DEFAULT_TOKEN_KEY, response.loginResult.token);
        localStorage.setItem(CONFIG.USER_DATA_KEY, JSON.stringify({
          userId: response.loginResult.userId,
          name: response.loginResult.name,
        }));

        showMessage('Selamat datang kembali!');
        window.location.hash = '#/';
      } catch (err) {
        showMessage(err.message, true);
        loginBtn.disabled = false;
        loginBtn.innerText = 'MASUK';
      }
    });
  }
}
