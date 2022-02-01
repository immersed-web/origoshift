<template>
  <QPage padding>
    <!-- <h3>Welcome! Login as Admin!</h3> -->

    <LoginBox
      v-if="true"
      @submit="submitted"
      class="fixed-center"
    />
  </QPage>
</template>

<script setup lang="ts">
import LoginBox from 'src/components/LoginBox.vue';
import { getJwt, login } from 'src/modules/authClient';
// import { useUserStore } from 'src/stores/userStore';
// import { useRouter } from 'vue-router';
// const router = useRouter();
import usePeerClient from 'src/composables/usePeerClient';
// const userStore = useUserStore();

const peer = usePeerClient();
async function submitted (creds: Record<string, string>) {
  console.log('adminpage received login data');
  const { username, password } = creds;
  await login(username, password);
  const jwt = await getJwt();
  peer.connect(jwt);
  // router.push()
}
</script>
