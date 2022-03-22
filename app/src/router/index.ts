import { route } from 'quasar/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
// import { StateInterface } from '../store';
import routes from './routes';

import { getJwt, guestJwt } from 'src/modules/authClient';
import { useUserStore } from 'src/stores/userStore';
import { securityLevels } from 'app/../packages/shared-types/CustomTypes';

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
    console.log('changed route to: ', to);
    const ignoredRoutes = ['/login', '/logout'];
    if (ignoredRoutes.includes(to.path)) {
      console.log('non userdata route');
      return;
    }
    console.log('Running navigation guard');
    // in this hook we only distinguish between logged in or not. Different types of logged in users is treated the same here!
    const userStore = useUserStore();
    if (!userStore.jwt) {
      try {
        userStore.jwt = await getJwt();
        return;
      } catch {
        try {
          userStore.jwt = await guestJwt();
        } catch (e) {
          console.error('couldnt get any jwt (user or guest). Something is wroong');
          console.error(e);
        }
      }
    }
    const role = userStore.userData?.role;
    if (!role) {
      return '/login';
    }
    const guestLevel = securityLevels.indexOf('guest');
    const clientLevel = securityLevels.indexOf(role);
    if (!to.meta.lowestAccessLevel || to.meta.lowestAccessLevel === 'guest') {
      console.log('route not protected. Letting through');
    } else if (clientLevel <= guestLevel) {
      console.error('route not allowed. Redirecting to login');
      window.sessionStorage.setItem('loginRedirect', to.fullPath);
      return '/login';
    }
  });

  return Router;
});
