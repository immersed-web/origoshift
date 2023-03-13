import { createPinia } from 'pinia';
import piniaPersisted from 'pinia-plugin-persistedstate';
//
// We want to create the pinia store separately so that we can use stores outside components using the `useStore(pinia)` syntax
export const pinia = createPinia();
pinia.use(piniaPersisted);
