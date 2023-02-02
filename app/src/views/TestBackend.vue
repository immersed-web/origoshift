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
import { ref } from 'vue';
import { getJwt, login } from '@/modules/authClient';

const token = ref<string>('');

async function loginAsAdmin(){
  await login('superadmin', 'bajskorv');
  token.value = await getJwt();

}

</script>
