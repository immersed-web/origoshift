import { createApp } from 'vue';

import App from './App.vue';
import router from './router';

import './main.css';
import { pinia } from '@/stores/piniaInstance';

const app = createApp(App);

app.use(pinia);
app.use(router);

app.mount('#app');
