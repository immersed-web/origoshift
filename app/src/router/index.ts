import { useClientStore } from '@/stores/clientStore';
import { useSenderStore } from '@/stores/senderStore';
import { hasAtLeastSecurityLevel, type UserRole } from 'schemas';
import { createRouter, createWebHistory } from 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    noAuth?: boolean
    requiresAuth?: boolean
    requiredRole?: UserRole
    loginRedirect?: string
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
      children: [
        {
          name: 'cameraLogin', path: 'login', component: () => import('@/components/LoginBox.vue'),
        },
        {
          name: 'cameraHome', path: '', component: () => import('@/views/CameraView.vue'),
          meta: { requiredRole: 'sender', loginRedirect: 'cameraLogin'},
        },
      ],
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

  // const clientStore = useSenderStore();
  // if (to.meta.requiredRole) {
  //   if(!clientStore.clientState. || !hasAtLeastSecurityLevel(clientStore.clientState.role, to.meta.requiredRole)){
  //     console.log('Reroute to login', from, to);
  //     return { name: 'cameraLogin' /*, query: { next: to.fullPath } */ };
  //   }
  // }

  if (to.meta.requiresAuth && !clientStore.loggedIn) {
    console.log('Reroute to login', from, to);
    return { name: 'login' /*, query: { next: to.fullPath } */ };
  } else if (to.meta.noAuth && clientStore.loggedIn) {
    console.log('Reroute to login', from, to);
    return { name: 'userHome' /*, query: { next: to.fullPath } */ };
  }
});

export default router;
