<template>
  <q-card
    id="login-container"
    class="q-pa-lg"
  >
    <q-card-section>
      <div class="text-h6 text-center">
        Log In
      </div>
    </q-card-section>
    <q-card-section>
      <q-input
        label="username"
        v-model="username"
      />
      <q-input
        label="password"
        type="password"
        v-model="password"
      />
    </q-card-section>
    <q-card-actions
      align="right"
    >
      <q-btn
        color="primary"
        label="Login"
        @click="submit"
        q-card-actions
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const username = ref<string>('Gunnar');
const password = ref<string>('');

const submit = () => {
  console.log('submitting login data:', username.value, password.value);
};

</script>

<style lang="scss">
#login-container {
  width: 35rem;
}
</style>
