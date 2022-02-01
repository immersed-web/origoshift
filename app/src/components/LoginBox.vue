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

const emit = defineEmits(['submit']);
// // eslint-disable-next-line func-call-spacing, no-undef
// defineEmits<{
//   (e: 'change', id: number): void
//   (e: 'update', value: string): void
// }>();

const username = ref<string>('Gunnar');
const password = ref<string>('');

const submit = () => {
  console.log('submitting login data:', username.value, password.value);
};

</script>

<style lang="scss">
#login-container {
  max-width: 25rem;
}
</style>
