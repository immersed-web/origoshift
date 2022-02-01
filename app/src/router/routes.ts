import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/EmptyLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: '/join', component: () => import('pages/JoinPage.vue') },
      { path: '/client', component: () => import('pages/ClientPage.vue') },
      { path: '/admin', component: () => import('pages/AdminPage.vue') },
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
