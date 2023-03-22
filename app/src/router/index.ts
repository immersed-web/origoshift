import { useAuthStore } from '@/stores/authStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { useClientStore } from '@/stores/clientStore';
// import { useSenderStore } from '@/stores/senderStore';
import { hasAtLeastSecurityLevel, type UserRole, type ClientType } from 'schemas';
import { createRouter, createWebHistory } from 'vue-router';
import { useVenueStore } from '@/stores/venueStore';

declare module 'vue-router' {
  interface RouteMeta {
    // noAuth?: boolean
    // requiresAuth?: boolean
    requiredConnection?: ClientType
    requiredRole?: UserRole
    afterLoginRedirect?: string
    loginNeededRedirect?: 'cameraLogin' | 'login'
    mustBeInVenue?: boolean
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
      component:  () => import('@/views/LoginView.vue'),
    },
    {
      path: '/user/',
      meta: { requiredRole: 'user', loginNeededRedirect: 'login', requiredConnection: 'client' },
      component:  () => import('@/layouts/LoggedInLayout.vue'),
      children: [
        {
          path: '',
          name: 'userHome',
          component:  () => import('@/views/UserHomeView.vue'),
        },
        {
          path: 'venue',
          name: 'userVenue',
          component:  () => import('@/views/UserVenueView.vue'),
        },
        {
          path: 'lobby',
          name: 'lobby',
          component:  () => import('@/views/LobbyView.vue'),
        },
      ],
    },
    {
      path: '/admin/',
      meta: { requiredRole: 'admin', loginNeededRedirect: 'login', requiredConnection: 'client' },
      component:  () => import('@/layouts/LoggedInLayout.vue'),
      children: [
        {
          path: '',
          name: 'adminHome',
          component:  () => import('@/views/admin/AdminHomeView.vue'),
        },
        {
          path: '',
          meta: {mustBeInVenue: true},
          children: [

            {
              path: 'venue',
              name: 'adminVenue',
              component:  () => import('@/views/admin/AdminVenueView.vue'),
            },
            {
              path: 'cameras',
              name: 'adminCameras',
              component:  () => import('@/views/admin/AdminCamerasView.vue'),
            },
          ],
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
        {
          name: 'cameraPickVenue', path: 'choose-venue', component: () => import('@/views/camera/VenuePickView.vue'),
        },
      ],
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('@/views/AboutView.vue'),
    },
    // {
    //   path: '/test-client',
    //   name: 'testClient',
    //   component: () => import('@/views/TestBackend.vue'),
    // },
  ],
});

router.beforeEach(async (to, from) => {
  // console.log('beforeEach: ', to, from);
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
      if(to.meta.requiredConnection === 'client'){
        connectionStore.createUserClient();
        clientStore.updateClientState();
      } else {
        connectionStore.createSenderClient();
      }
      console.log('CONNECTED STATE IN NAV GUARD: ', connectionStore.connected);
    } else if(connectionStore.connectionType !== to.meta.requiredConnection){
      throw Error('you are already connected to the backend as the wrong type of client. Close the current connection before going to this route.');
    }
  }
  if(to.meta.mustBeInVenue){
    const venueStore = useVenueStore();
    console.log('MUST BE IN VENUE FOR THIS ROUTE');

    if(!venueStore.currentVenue){
      await connectionStore.firstConnectionEstablished;
      if(!venueStore.savedVenueId){
        const routeName = `${authStore.routePrefix}Home`;
        return { name: routeName};
      }
      if(hasAtLeastSecurityLevel(authStore.role, 'moderator')){
        try{
          await venueStore.loadVenue(venueStore.savedVenueId);
        } catch (e) {
          console.warn('nav guard tried to load venue that was already loaded');
        }
      }
      await venueStore.joinVenue(venueStore.savedVenueId);
    }
  }
});

export default router;
