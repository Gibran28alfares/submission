import HomePage from '../pages/home/home-page';
import AboutPage from '../pages/about/about-page';
import AddPage from '../pages/add/add-page';
import LoginPage from '../pages/login/login-page';
import RegisterPage from '../pages/register/register-page';
import DetailPage from '../pages/detail/detail-page';
import FavoritesPage from '../pages/favorites/favorites-page';

const routes = {
  '/': HomePage,
  '/home': HomePage,
  '/about': AboutPage,
  '/add': AddPage,
  '/login': LoginPage,
  '/register': RegisterPage,
  '/detail/:id': DetailPage,
  '/favorites': FavoritesPage,
};

export default routes;
