import { route } from 'quasar/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
// import { StateInterface } from '../store';
import routes from './routes';

import { useUserStore } from 'src/stores/userStore';
import { securityLevels } from 'app/../packages/shared-types/CustomTypes';

import { Notify } from 'quasar';

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
    const userStore = useUserStore();
    const ignoredRoutes = ['/login', '/logout'];
    if (ignoredRoutes.includes(to.path)) {
      // userStore.$reset();
      console.log('non userdata route');
      return;
    }
    console.log('Running navigation guard');
    const role = userStore.userData?.role;
    if (!role) {
      return { name: 'index' };
    }
    console.log('role is: ', role);
    if (!to.meta.lowestAccessLevel || to.meta.lowestAccessLevel === 'guest') {
      console.log('route not protected. Letting through');
      return;
    }
    const routeLevel = securityLevels.indexOf(to.meta.lowestAccessLevel);
    const clientLevel = securityLevels.indexOf(role);

    if (clientLevel < routeLevel) {
      Notify.create({
        type: 'negative',
        message: 'saknar behörighet till den sidan. Du har blivit omdirigerad!',
      });
      console.error('route not allowed. Redirecting to index');
      // hack to unset guest from userStore if directed to login:
      // userStore.$reset();

      return { name: 'index' };
    }
  });

  return Router;
});
