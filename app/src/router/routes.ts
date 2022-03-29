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
    path: '',
    component: () => import('layouts/NoScrollLayout.vue'),
    children: [
      { path: '', redirect: '/login' },
      { path: '/login', component: () => import('pages/LoginPage.vue'), meta: { lowestAccessLevel: 'guest' } },
      { path: '/logout', component: () => import('pages/LogoutPage.vue') },
      { path: '/editor', component: () => import('pages/EditorGateway.vue'), meta: { lowestAccessLevel: 'gatheringEditor' } },
      { path: '/camera', component: () => import('pages/CameraPage.vue'), meta: { lowestAccessLevel: 'sender' } },
      { path: '/teacher', component: () => import('pages/RoomControlPage.vue'), meta: { lowestAccessLevel: 'sender' } },
      { path: '/edit-users', component: () => import('pages/ManageUsersPage.vue'), meta: { lowestAccessLevel: 'gatheringEditor' } },
      { path: '/join', component: () => import('pages/JoinPage.vue'), alias: '' },
      { path: '/roomlist', component: () => import('pages/RoomListPage.vue') },
      // { path: '/client', component: () => import('pages/ClientPage.vue') },
      { path: '/room/:roomId', component: () => import('pages/ClientPage.vue') },
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
