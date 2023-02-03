import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';

import './main.css';

import TestComponent from '@/components/TestComponent.vue';

import UI, { colors } from '@indielayer/ui';

const app = createApp(App);

app.use(UI, {
  prefix: 'X',
  colors: {
    primary: colors.lime,
    secondary: colors.cyan,
    success: colors.teal,
    warning: colors.fuchsia,
    error: colors.rose,
  },
});

app.component('TestComponent', TestComponent);

app.use(createPinia());
app.use(router);

app.mount('#app');
