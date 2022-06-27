import { RouteRecordRaw } from 'vue-router';
import { UserRole } from 'shared-types/CustomTypes';

import { useUserStore } from 'src/stores/userStore';

// type CustomMeta = RouteMeta |

declare module 'vue-router' {
  interface RouteMeta {
    lowestAccessLevel?: UserRole,
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '',
    component: () => import('layouts/NoScrollLayout.vue'),
    children: [
      {
        name: 'index',
        path: '',
        redirect: () => {
          // console.log('INDEX ROUTE REDIRECT TRIGGERED');
          const userStore = useUserStore();
          const role = userStore.userData?.role;
          if (!role) return { name: 'login' };

          switch (role) {
            case 'host':
            case 'admin': {
              return { name: 'controlStart' };
            }
            case 'client': {
              return { name: 'lobby' };
            }
          }

          return { name: 'login' };
        },
      },
      { name: 'login', path: '/login', component: () => import('pages/LoginPage.vue'), meta: { lowestAccessLevel: 'guest' } },
      { path: '/logout', component: () => import('pages/LogoutPage.vue') },
      { name: 'controlStart', path: '/teacher', component: () => import('pages/ControlStartPage.vue'), meta: { lowestAccessLevel: 'host' } },
      { name: 'camera', path: '/teacher/camera', component: () => import('pages/CameraPage.vue'), meta: { lowestAccessLevel: 'sender' } },
      { name: 'controlRoom', path: '/teacher/room/:roomId', component: () => import('pages/RoomControlPage.vue'), meta: { lowestAccessLevel: 'sender' } },
      { name: 'userManager', path: '/teacher/users', component: () => import('pages/ManageUsersPage.vue'), meta: { lowestAccessLevel: 'host' } },
      { name: 'lobby', path: '/roomlist', component: () => import('pages/RoomListPage.vue') },
      {
        name: 'controlLobby',
        path: '/teacher/roomlist',
        component: () => import('pages/RoomListPage.vue'),
        props: {
          sendToRoomOverview: true,
        },
      },
      { path: '/room/:roomId', component: () => import('pages/ClientPage.vue') },
      { name: 'themeTest', path: '/theme', component: () => import('pages/ThemeTest.vue') },
    ],
  },
  {
    path: '',
    component: () => import('layouts/EmptyLayout.vue'),
    children: [
      { path: '/admin', component: () => import('pages/AdminPage.vue'), meta: { lowestAccessLevel: 'admin' } },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorPage404.vue'),
  },
];

export default routes;
