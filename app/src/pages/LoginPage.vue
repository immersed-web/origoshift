<template>
  <LoginBox
    class="fixed-center"
    @submit="loginUser"
  />
</template>

<script setup lang="ts">
import LoginBox from 'src/components/LoginBox.vue';
import { getMe, login, getJwt } from 'src/modules/authClient';
import { useUserStore } from 'src/stores/userStore';
import { useRouter } from 'vue-router';
const userStore = useUserStore();

const router = useRouter();
type Creds = Parameters<InstanceType<typeof LoginBox>['$emit']>[1]
async function loginUser (creds: Creds) {
  // await login(username, password);
  // const me = await getMe();
  // console.log('got me: ', me);
  // const jwt = await getJwt();
  // await peer.connect(jwt);

  await login(creds.username, creds.password);
  const me = await getMe();
  console.log('me:', me);
  userStore.jwt = await getJwt();
  let redirect = '/';
  const savedRedirect = window.sessionStorage.getItem('loginRedirect');
  if (savedRedirect) {
    redirect = savedRedirect;
    window.sessionStorage.removeItem('loginRedirect');
  } else {
    switch (me.role) {
      case 'client':
        redirect = '/roomlist';
        break;
      case 'sender':
        redirect = '/camera';
        break;
      case 'gatheringEditor':
        redirect = '/camera';
        break;
      case 'admin':
        redirect = '/admin';
        break;
    }
  }
  router.replace(redirect);
}
</script>
