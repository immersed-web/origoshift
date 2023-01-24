import { boot } from 'quasar/wrappers';
import { pinia } from './pinia';
import { useUserStore } from 'src/stores/userStore';

import { getJwt } from 'src/modules/authClient';

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async (/* { app, router, ... } */) => {
  // console.log('Boot file for init user triggered!!!');
  const userStore = useUserStore(pinia);
  try {
    console.log('trying to get userJwt!');
    userStore.jwt = await getJwt();
    // return;
  } catch {
    // try {
    //   console.log('failed to get userJwt. Trying to get guestJwt instead!');
    //   userStore.jwt = await guestJwt();
    // } catch (e) {
    //   console.error('couldnt get any jwt (user or guest). Very sad indeed!');
    //   console.error(e);
    // }
    console.error('couldnt get a user jwt. Very sad indeed!');
  }
  // something to do
});
