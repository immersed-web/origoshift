import { RouteRecordRaw } from 'vue-router';
import { UserRole } from 'shared-types/CustomTypes';

// type CustomMeta = RouteMeta |

declare module 'vue-router' {
  interface RouteMeta {
    lowestAccessLevel: UserRole,
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/EmptyLayout.vue'),
    children: [
      { path: '/admin', component: () => import('pages/AdminPage.vue'), meta: { lowestAccessLevel: 'admin' } },
    ],
  },
  {
    path: '/',
    component: () => import('layouts/NoScrollLayout.vue'),
    children: [
      { path: '', component: () => import('pages/JoinPage.vue') },
      { path: '/login', component: () => import('pages/LoginPage.vue'), meta: { lowestAccessLevel: 'guest' } },
      { path: '/logout', component: () => import('pages/LogoutPage.vue') },
      { path: '/send', component: () => import('pages/SenderPage.vue'), meta: { lowestAccessLevel: 'sender' } },
      { path: '/join', component: () => import('pages/JoinPage.vue') },
      { path: '/roomlist', component: () => import('pages/RoomList.vue') },
      // { path: '/client', component: () => import('pages/ClientPage.vue') },
      { path: '/room/:roomId', component: () => import('pages/ClientPage.vue') },
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
