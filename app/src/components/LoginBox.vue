<template>
  <QCard
    id="login-container"
    class="q-pa-lg"
  >
    <QCardSection>
      <div class="text-h6 text-center">
        Log In
      </div>
    </QCardSection>
    <QCardSection>
      <QInput
        label="username"
        v-model="username"
      />
      <QInput
        label="password"
        type="password"
        v-model="password"
      />
    </QCardSection>
    <QCardActions
      align="right"
    >
      <QBtn
        color="primary"
        label="Login"
        @click="submit"
        q-card-actions
      />
    </QCardActions>
  </QCard>
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
