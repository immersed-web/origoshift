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
import { RouteLocationRaw, useRouter } from 'vue-router';
const userStore = useUserStore();

const router = useRouter();
type Creds = Parameters<InstanceType<typeof LoginBox>['$emit']>[1]
async function loginUser (creds: Creds) {
  await login(creds.username, creds.password);
  const me = await getMe();
  console.log('me:', me);
  userStore.jwt = await getJwt();
  let redirect: RouteLocationRaw = { name: 'index' };
  switch (me.role) {
    case 'client':
      redirect = { name: 'lobby' };
      break;
    case 'sender':
      redirect = { name: 'camera' };
      break;
    case 'host':
    case 'admin':
      redirect = { name: 'controlStart' };
      break;
  }
  router.replace(redirect);
}
</script>
