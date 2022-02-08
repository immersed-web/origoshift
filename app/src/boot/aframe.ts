import { boot } from 'quasar/wrappers';
// import 'aframe';

// Vue.
// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async ({ app }) => {
  app.config.compilerOptions.isCustomElement = tag => {
    return tag.startsWith('a-');
  };
});
// import something here

// // "async" is optional;
// // more info on params: https://quasar.dev/quasar-cli/cli-documentation/boot-files#Anatomy-of-a-boot-file
// export default ({ Vue }) => {
//   // ignore a frame elements!!
//   Vue.config.ignoredElements = [/a-*/];
// };
