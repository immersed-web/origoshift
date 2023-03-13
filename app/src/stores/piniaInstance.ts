import { createPinia } from 'pinia';
import { createPersistedState } from 'pinia-plugin-persistedstate';
import {stringify, parse } from 'devalue';

// We want to create the pinia store separately so that we can use stores outside components using the `useStore(pinia)` syntax
export const pinia = createPinia();
pinia.use(createPersistedState({
  serializer: {
    serialize: stringify,
    deserialize: parse,
  },
}));
