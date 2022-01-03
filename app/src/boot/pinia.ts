import { boot } from 'quasar/wrappers';

import { createPinia } from 'pinia';

const pinia = createPinia();
// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(({ app }) => {
  // something to do
  app.use(pinia);
  // return pinia;
});

export { pinia };
