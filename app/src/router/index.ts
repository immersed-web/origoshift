import { useAuthStore } from '@/stores/authStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { useClientStore } from '@/stores/clientStore';
// import { useSenderStore } from '@/stores/senderStore';
import { hasAtLeastSecurityLevel, type UserRole, type ClientType } from 'schemas/esm';
import { createRouter, createWebHistory } from 'vue-router';
import { useVenueStore } from '@/stores/venueStore';
import { useAdminStore } from '@/stores/adminStore';
import { useSenderStore } from '@/stores/senderStore';

declare module 'vue-router' {
  interface RouteMeta {
    requiredConnection?: ClientType
    requiredRole?: UserRole
    afterLoginRedirect?: string
    loginNeededRedirect?: 'cameraLogin' | 'login'
    mustBeInVenue?: boolean
    pickVenueRouteName?: string
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
              component: () => import('@/components/AFrameScene.vue'),
              children: [
                {
                  path: '',
                  name: 'userCamera',
                  props: route => route.params,
                  component: () => import('@/components/CameraView.vue'),

                },
              ],
            },
          ],
        },
        {
          path: '',
          name: 'userHome',
          component:  () => import('@/views/user/UserHomeView.vue'),
        },
        // {
        //   path: 'lobby',
        //   name: 'userLobby',
        //   component:  () => import('@/views/user/UserLobbyView.vue'),
        // },
        {
          path: 'vr',
          component:  () => import('@/components/AFrameScene.vue'),
          children: [
            {
              path: 'lobby',
              name: 'userLobby',
              component:  () => import('@/components/lobby/VrAFrame.vue'),
            },
            {
              path: 'basic',
              name: 'basicVR',
              component: () => import('@/components/lobby/BasicAFrameScene.vue'),
            },
            {
              path: 'basic-2',
              name: 'basicVR2',
              component: () => import('@/components/lobby/BasicAFrameScene2.vue'),
            },
          ],
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
          meta: {mustBeInVenue: true, pickVenueRouteName: 'adminHome'},
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
      component:  () => import('@/layouts/HeaderLayout.vue'),
      children: [
        {
          name: 'senderHome', path: '',
          meta: { mustBeInVenue: true, pickVenueRouteName: 'senderPickVenue' },
          component: () => import('@/views/sender/SenderCameraView.vue'),
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
    { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/components/NotFound.vue') },
  ],
});

router.beforeEach(async (to, from) => {
  // console.log('beforeEach: ', to, from);
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
    if(!authStore.isAuthenticated && to.meta.requiredRole === 'guest'){
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
        const senderStore = useSenderStore();
        // TODO: Here is a possible race conditon where we currently rely on the set/get senderId being called on the server before the server handles the later joinVenue.
        // We currently dont await that the senderId is correctly agreed between server and client before proceeding.
        // Perhaps we should remove the initialization of senderId from being autotriggered in store and explicitly call it here?
        // await senderStore.initSenderId();
      }
      // console.log('CONNECTED STATE IN NAV GUARD: ', connectionStore.connected);
    } else if(connectionStore.connectionType !== to.meta.requiredConnection){
      throw Error('you are already connected to the backend as the wrong type of client. Close the current connection before going to this route.');
    }
  }
  if(to.meta.mustBeInVenue){
    console.log('Entering route that requires to be in a venue.');
    const venueStore = useVenueStore();

    if(!venueStore.currentVenue || venueStore.currentVenue.venueId !== venueStore.savedVenueId){
      // await connectionStore.firstConnectionEstablished;
      if(!venueStore.savedVenueId){
        if(to.meta.pickVenueRouteName) return { name: to.meta.pickVenueRouteName};
        const routeName = `${authStore.routePrefix}Home`;
        return { name: routeName};
      }
      const connection = useConnectionStore();
      if(connection.connectionType === 'client' && hasAtLeastSecurityLevel(authStore.role, 'moderator')){
        const adminStore = useAdminStore();
        try{
          console.log('Trying to loadAndJoinVenueAsAdmin');
          await adminStore.loadAndJoinVenueAsAdmin(venueStore.savedVenueId);
        } catch (e) {
          console.log(e);
          if(to.meta.pickVenueRouteName) return { name: to.meta.pickVenueRouteName};
          const routeName = `${authStore.routePrefix}Home`;
          return { name: routeName};
          // console.warn('nav guard tried to load venue that was already loaded');
        }
      }else{
        console.log('Trying to loadAndJoinVenue');
        // await venueStore.joinVenue(venueStore.savedVenueId);
        await venueStore.loadAndJoinVenue(venueStore.savedVenueId);
      }
    }
  }
});

export default router;
