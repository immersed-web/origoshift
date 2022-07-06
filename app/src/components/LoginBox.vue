<template>
  <!-- TODO: can we avoid input fields losing focus on submit event? -->
  <QForm @submit.prevent="submit">
    <QCard
      id="login-container"
      class="q-pa-lg"
    >
      <!-- <QCardSection>
        <div class="text-h4 text-center">
          Log In
        </div>
      </QCardSection> -->
      <QCardSection class="q-gutter-md">
        <QInput
          outlined
          label="Användarnamn"
          v-model="username"
        />
        <QInput
          outlined
          label="Lösenord"
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
          label="Logga in"
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

const username = ref<string>('');
const password = ref<string>('');

if (process.env.DEV) {
  username.value = 'elev1';
  password.value = 'password';
}

const submit = () => {
  // console.log('loginbox emits login data:', username.value, password.value);
  emit('submit', { username: username.value, password: password.value });
};

</script>

<style lang="scss" scoped>
#login-container {
  max-width: 25rem;
}
</style>
