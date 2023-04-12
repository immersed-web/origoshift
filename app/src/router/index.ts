import { useAuthStore } from '@/stores/authStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { useClientStore } from '@/stores/clientStore';
// import { useSenderStore } from '@/stores/senderStore';
import { hasAtLeastSecurityLevel, type UserRole, type ClientType } from 'schemas';
import { createRouter, createWebHistory } from 'vue-router';
import { useVenueStore } from '@/stores/venueStore';
import { useAdminStore } from '@/stores/adminStore';

declare module 'vue-router' {
  interface RouteMeta {
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
    // {
    //   path: '/',
    //   redirect: {name: 'publicVenueList'},
    // },
    {
      path: '/login',
      name: 'login',
      component:  () => import('@/views/LoginView.vue'),
    },
    // public routes
    {
      path: '/',
      component: () => import('@/layouts/SimpleLayout.vue'),
      children: [
        // {
        //   name: 'startPage',
        //   path: '',
        //   component: () => import('@/views/StartPage.vue'),
        // },
        {
          name: 'venueList',
          path: '',
          meta: { requiredRole: 'guest', requiredConnection: 'client' },
          component: () => import('@/views/public/VenueListView.vue'),
        },
      ],
    },
    // guest/user routes
    {
      path: '/',
      meta: { requiredRole: 'guest', loginNeededRedirect: 'login', requiredConnection: 'client' },
      component:  () => import('@/layouts/HeaderLayout.vue'),
      children: [
        {
          path: 'venue/:venueId',
          props: true,
          children: [
            {
              path: '',
              name: 'userVenue',
              component:  () => import('@/views/user/UserVenueView.vue'),
              props: true,
            },
            {
              path: ':cameraId',
              name: 'userCamera',
              props: true,
              component: () => import('@/views/user/UserCameraView.vue'),
            },
          ],
        },
        {
          path: '',
          name: 'userHome',
          component:  () => import('@/views/user/UserHomeView.vue'),
        },
        {
          path: 'lobby',
          name: 'userLobby',
          component:  () => import('@/views/user/UserLobbyView.vue'),
        },
      ],
    },
    {
      path: '/admin/',
      meta: { requiredRole: 'admin', loginNeededRedirect: 'login', requiredConnection: 'client' },
      component:  () => import('@/layouts/HeaderLayout.vue'),
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
              path: 'lobby',
              name: 'adminLobby',
              component:  () => import('@/views/admin/AdminLobbyView.vue'),
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
      name: 'cameraLogin',
      path: '/send/login',
      meta: {afterLoginRedirect: 'senderHome'},
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/send',
      meta: { requiredRole: 'sender', requiredConnection: 'sender', loginNeededRedirect: 'cameraLogin'},
      children: [
        {
          name: 'senderHome', path: '', component: () => import('@/views/sender/SenderCameraView.vue'),
        },
        {
          name: 'senderPickVenue', path: 'choose-venue', component: () => import('@/views/sender/SenderPickVenueView.vue'),
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
  console.log('beforeEach: ', to, from);
  const authStore = useAuthStore();

  // if(to.path === '/' && authStore.role){
  //   return { name: hasAtLeastSecurityLevel(authStore.role, 'admin') ? 'adminHome' : 'userHome'};
  // }

  if (to.meta.requiredRole) {
    // if not logged in we can try to restore from session
    if(!authStore.isAuthenticated && authStore.hasCookie) {
      console.log('some kind of user role required. Found cookie. Trying to restore session.');
      await authStore.restoreFromSession();
    }
    if(!authStore.isNotGuest && to.meta.requiredRole === 'guest'){
      console.log('creating guest because not logged in and route requires at least guest');
      await authStore.autoGuest();
    }

    if(!authStore.role || !hasAtLeastSecurityLevel(authStore.role, to.meta.requiredRole)){
      const redirect = to.meta.loginNeededRedirect || 'login';
      console.log('No role or role too low. Redirecting to:', redirect);
      return { name: redirect /*, query: { next: to.fullPath } */ };
    }
  }
  if(to.meta.requiredConnection) {
    const connectionStore = useConnectionStore();
    // console.log('Connection required. Creating if doesn\'t exist');

    if(!authStore.isAuthenticated){
      throw Error('Eeeeh. You are not logged but you shouldnt even reach this code without being logged in. Something is wrooong');
    }
    if(!connectionStore.clientExists){
      console.log('Connection required. Creating one');
      if(to.meta.requiredConnection === 'client'){
        connectionStore.createUserClient();
        const clientStore = useClientStore();
        clientStore.fetchClientState();
      } else {
        connectionStore.createSenderClient();
      }
      // console.log('CONNECTED STATE IN NAV GUARD: ', connectionStore.connected);
    } else if(connectionStore.connectionType !== to.meta.requiredConnection){
      throw Error('you are already connected to the backend as the wrong type of client. Close the current connection before going to this route.');
    }
  }
  if(to.meta.mustBeInVenue){
    console.log('MUST BE IN VENUE FOR THIS ROUTE');
    const venueStore = useVenueStore();

    if(!venueStore.currentVenue){
      // await connectionStore.firstConnectionEstablished;
      if(!venueStore.savedVenueId){
        const routeName = `${authStore.routePrefix}Home`;
        return { name: routeName};
      }
      if(hasAtLeastSecurityLevel(authStore.role, 'moderator')){
        const adminStore = useAdminStore();
        try{
          await adminStore.loadAndJoinVenue(venueStore.savedVenueId);
        } catch (e) {
          console.warn('nav guard tried to load venue that was already loaded');
        }
      }else{
        await venueStore.joinVenue(venueStore.savedVenueId);
      }
    }
  }
});

export default router;
