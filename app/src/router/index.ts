import { route } from 'quasar/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
// import { StateInterface } from '../store';
import routes from './routes';

import { getMe } from 'src/modules/authClient';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory);

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(
      process.env.MODE === 'ssr' ? void 0 : process.env.VUE_ROUTER_BASE,
    ),
  });

  Router.beforeEach(async (to) => {
    console.log('Running navigation guard');
    // At this point we only distinguish between logged in or not. Different types of logged in users is treated the same here!
    try {
      if (!to.meta.lowestAccessLevel || to.meta.lowestAccessLevel === 'guest') {
        console.log('route not protected. Letting through');
        return;
      }
      const me = await getMe();
      if (!me.uuid) {
        throw new Error('response contained no user uuid');
      }
      return;
    } catch (e) {
      console.error('route not allowed. Redirecting to login');
      console.error(e);
      window.sessionStorage.setItem('loginRedirect', to.fullPath);
      return '/login';
    }
  });

  return Router;
});
