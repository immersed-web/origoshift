<template>
  <button
    class="p-4 bg-slate-400 text-slate-800"
    @click="loginAsAdmin"
  >
    Login
  </button>
  <p>{{ token }}</p>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getJwt, login, loginWithAutoToken, latestJwtToken, autoGuestToken, latestGuestJwtToken } from '@/modules/authClient';

const token = ref<string>('');

onMounted(() => {
  autoGuestToken();
});

async function loginAsAdmin(){
  // loginWithAutoToken('superadmin', 'bajskorv');
  // await login('superadmin', 'bajskorv');
  // token.value = await getJwt();
}

</script>
