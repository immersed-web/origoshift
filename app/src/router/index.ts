import { useClientStore } from '@/stores/clientStore';
import type { UserRole } from 'schemas';
import { createRouter, createWebHistory } from 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    noAuth?: boolean
    requiresAuth?: boolean
    requiredRole?: UserRole
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '',
      redirect: {name: 'login'},
    },
    {
      path: '/login',
      name: 'login',
      meta: { noAuth: true },
      component:  () => import('../views/LoginView.vue'),
    },
    {
      path: '/user/',
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'userHome',
          component:  () => import('../views/UserHomeView.vue'),
        },
        {
          path: 'venue',
          name: 'userVenue',
          component:  () => import('../views/UserVenueView.vue'),
        },
        {
          path: 'lobby',
          name: 'lobby',
          component:  () => import('../views/LobbyView.vue'),
        },
      ],
    },
    {
      name: 'camera',
      path: '/camera',
      meta: { requiredRole: 'sender'},
      component: () => import('@/views/Camera.vue'),
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/test-client',
      name: 'testClient',
      component: () => import('../views/TestBackend.vue'),
    },
  ],
});

router.beforeEach((to, from) => {
  const clientStore = useClientStore();
  console.log('Logged in', clientStore.loggedIn, clientStore.clientState);

  if (to.matched.some(record => {
    if(!record.meta.requiredRole) return;
    // TODO: WHYYYYY cant we import this function from the schemas package!!!
    // return hasAtLeastSecurityLevel(clientStore.clientState.role, record.meta.requiredRole);
  })) {
    console.log(from, to, 'Reroute to login');
    return { name: 'login' /*, query: { next: to.fullPath } */ };
  } else if (to.matched.some(record => record.meta.requiresAuth === true) && !clientStore.loggedIn) {
    console.log(from, to, 'Reroute to login');
    return { name: 'login' /*, query: { next: to.fullPath } */ };
  } else if (to.matched.some(record => record.meta.noAuth) && clientStore.loggedIn) {
    console.log(from, to, 'Reroute to user home');
    return { name: 'userHome' /*, query: { next: to.fullPath } */ };
  }
});

export default router;
