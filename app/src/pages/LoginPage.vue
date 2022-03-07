<template>
  <LoginBox
    class="fixed-center"
    @submit="loginUser"
  />
</template>

<script setup lang="ts">
import LoginBox from 'src/components/LoginBox.vue';
import { getMe, login } from 'src/modules/authClient';
import { useRouter } from 'vue-router';

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
        redirect = '/send';
        break;
      case 'admin':
        redirect = '/admin';
        break;
    }
  }
  router.replace(redirect);
}
</script>
