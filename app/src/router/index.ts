import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component:  () => import('../views/LoginView.vue'),
    },
    {
      path: '/',
      name: 'home',
      component:  () => import('../views/HomeView.vue'),
    },
    {
      path: '/lobby',
      name: 'lobby',
      component:  () => import('../views/LobbyView.vue'),
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

export default router;
