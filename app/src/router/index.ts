import { useAuthStore } from '@/stores/authStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { useClientStore } from '@/stores/clientStore';
// import { useSenderStore } from '@/stores/senderStore';
import { hasAtLeastSecurityLevel, type UserRole } from 'schemas';
import { createRouter, createWebHistory } from 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    // noAuth?: boolean
    // requiresAuth?: boolean
    requiredConnection?: 'sender' | 'user'
    requiredRole?: UserRole
    afterLoginRedirect?: string
    loginNeededRedirect?: 'cameraLogin' | 'login'
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: {name: 'userHome'},
    },
    {
      path: '/login',
      name: 'login',
      component:  () => import('../views/LoginView.vue'),
    },
    {
      path: '/user/',
      meta: { requiredRole: 'user', loginNeededRedirect: 'login', requiredConnection: 'user' },
      component:  () => import('@/layouts/LoggedInLayout.vue'),
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
      path: '/admin/',
      meta: { requiredRole: 'admin', loginNeededRedirect: 'login', requiredConnection: 'user' },
      component:  () => import('@/layouts/LoggedInLayout.vue'),
      children: [
        {
          path: '',
          name: 'adminHome',
          component:  () => import('../views/AdminHomeView.vue'),
        },
        {
          path: 'venue',
          name: 'adminVenue',
          component:  () => import('../views/AdminVenueView.vue'),
        },
      ],
    },
    {
      name: 'cameraLogin', path: '/camera/login', component: () => import('@/views/LoginView.vue'),
    },
    {
      name: 'camera',
      path: '/camera',
      meta: { requiredRole: 'sender', requiredConnection: 'sender', loginNeededRedirect: 'cameraLogin'},
      children: [
        {
          name: 'cameraHome', path: '', component: () => import('@/views/camera/CameraView.vue'),
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

router.beforeEach(async (to, from) => {
  console.log('beforeEach: ', to, from);
  const connectionStore = useConnectionStore();
  const clientStore = useClientStore();
  const authStore = useAuthStore();

  if(to.path === '/' && authStore.role){
    return { name: hasAtLeastSecurityLevel(authStore.role, 'admin') ? 'adminHome' : 'userHome'};
  }

  if (to.meta.requiredRole) {
    // if not logged in we can try to restore from session
    if(!authStore.isLoggedIn && authStore.hasCookie) {
      await authStore.restoreFromSession();
    }

    if(!authStore.role || !hasAtLeastSecurityLevel(authStore.role, to.meta.requiredRole)){
      console.log('Reroute to login', from, to);
      return { name: to.meta.loginNeededRedirect || 'login'  /*, query: { next: to.fullPath } */ };
    }
  }
  if(to.meta.requiredConnection) {

    if(!authStore.isLoggedIn){
      throw Error('eeeeh. You are not logged but you shouldnt reach this code without being logged in. Something is wrooong');
    }
    if(!connectionStore.connected){
      if(to.meta.requiredConnection === 'user'){
        connectionStore.createUserClient();
        clientStore.updateClientState();
      } else {
        connectionStore.createSenderClient();
      }
    }
  }
});

export default router;
