import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';

import './main.css';

import TestComponent from './components/TestComponent.vue';

const app = createApp(App);

app.component('TestComponent', TestComponent);

app.use(createPinia());
app.use(router);

app.mount('#app');
