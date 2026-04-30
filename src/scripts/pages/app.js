import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';
import CONFIG from '../config';
import { createIcons, LogOut } from 'lucide';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #currentPage = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this.#setupDrawer();
    this.#setupLogout();
  }

  #setupLogout() {
    const logoutBtn = document.querySelector('#btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem(CONFIG.DEFAULT_TOKEN_KEY);
        localStorage.removeItem(CONFIG.USER_DATA_KEY);
        window.location.hash = '#/login';
      });
    }
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.#navigationDrawer.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove('open');
      }
    });

    this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        this.#navigationDrawer.classList.remove('open');
      });
    });
  }

  async renderPage() {
    // Cleanup previous page before switching
    if (this.#currentPage && typeof this.#currentPage.destroy === 'function') {
      this.#currentPage.destroy();
    }

    const url = getActiveRoute();
    const PageClass = routes[url] || routes['/'];
    this.#currentPage = new PageClass();
    const page = this.#currentPage;

    // Auth Guard
    const token = localStorage.getItem(CONFIG.DEFAULT_TOKEN_KEY);
    const isAuthRoute = ['/login', '/register'].includes(url);
    
    if (!token && !isAuthRoute && url !== '/about') {
      window.location.hash = '#/login';
      return;
    }

    if (token && isAuthRoute) {
      window.location.hash = '#/';
      return;
    }

    this.#updateNavVisibility(token);

    // Render with transition if possible
    if (document.startViewTransition) {
      try {
        const transition = document.startViewTransition(async () => {
          this.#content.innerHTML = await page.render();
          this.#content.classList.add('view-transition');
          await page.afterRender();
          this.#updateActiveLink(url);
        });
        await transition.ready;
      } catch (e) {
        // Fallback for aborted transitions
        this.#content.innerHTML = await page.render();
        await page.afterRender();
        this.#updateActiveLink(url);
      }
    } else {
      this.#content.innerHTML = await page.render();
      await page.afterRender();
      this.#updateActiveLink(url);
    }
    
    window.scrollTo(0, 0);
  }

  #updateNavVisibility(token) {
    const logoutItem = document.querySelector('#logout-item');
    const authLinks = ['#/', '#/add'];
    
    if (token) {
      logoutItem?.classList.remove('hidden');
    } else {
      logoutItem?.classList.add('hidden');
    }

    createIcons({
      icons: { LogOut }
    });
  }

  #updateActiveLink(url) {
    const navLinks = document.querySelectorAll('.nav-list a');
    navLinks.forEach(link => {
      const href = link.getAttribute('href').replace('#', '');
      if (href === url || (url === '/' && href === '/home')) {
        link.classList.add('text-black', 'border-b-2', 'border-black');
        link.classList.remove('text-[#4a4a4a]');
      } else {
        link.classList.remove('text-black', 'border-b-2', 'border-black');
        link.classList.add('text-[#4a4a4a]');
      }
    });
  }
}

export default App;
