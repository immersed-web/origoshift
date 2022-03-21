<template>
  <!-- TODO: can we avoid input fields losing focus on submit event? -->
  <QForm @submit.prevent="submit">
    <QCard
      id="login-container"
      class="q-pa-lg"
    >
      <QCardSection>
        <div class="text-h4 text-center">
          Log In
        </div>
      </QCardSection>
      <QCardSection class="q-gutter-md">
        <QInput
          outlined
          label="username"
          v-model="username"
        />
        <QInput
          outlined
          label="password"
          type="password"
          v-model="password"
        />
      </QCardSection>
      <QCardActions
        align="right"
        class="q-pa-md"
      >
        <QBtn
          type="submit"
          color="primary"
          label="Login"
          q-card-actions
        />
      </QCardActions>
    </QCard>
  </QForm>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface LoginBoxEmits {
  (e: 'submit', creds: {username: string, password: string}): void
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const emit = defineEmits<LoginBoxEmits>();

const username = ref<string>('mrClient 1');
const password = ref<string>('password');

const submit = () => {
  // console.log('loginbox emits login data:', username.value, password.value);
  emit('submit', { username: username.value, password: password.value });
};

</script>

<style lang="scss">
#login-container {
  max-width: 25rem;
}
</style>
