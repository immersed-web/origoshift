<template>
  <div class="flex-col gap-10 hero-content lg:flex-row-reverse">
    <div class="text-center lg:text-left">
      <h1 class="text-5xl font-bold">
        {{ title }}
      </h1>
      <p class="py-6">
        {{ description }}
      </p>
    </div>
    <div class="flex-shrink-0 w-full max-w-sm shadow-2xl card bg-base-100">
      <form
        class="card-body"
        @submit.prevent="emit('submit', username, password)"
      >
        <div class="form-control">
          <label class="label">
            <span class="label-text">E-post</span>
          </label>
          <input
            v-model="username"
            type="text"
            placeholder="E-post"
            class="input input-bordered"
          >
        </div>
        <div class="form-control">
          <label class="label">
            <span class="label-text">Lösenord</span>
          </label>
          <input
            v-model="password"
            type="password"
            placeholder="Löesnord"
            class="input input-bordered"
          >
        </div>
        <div
          v-if="error"
          class="alert bg-error"
        >
          {{ error.message }}
        </div>
        <div class="mt-6 form-control">
          <button
            type="submit"
            class="btn btn-primary"
          >
            Logga in
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const username = ref('');
const password = ref('');

const emit = defineEmits<{
  (e: 'submit', username: string, password: string): void
}>();

withDefaults(defineProps<{
  title?: string,
  description?: string,
  error?: Error,
}>(), {
  error: undefined,
  title: 'Välkommen till OrigoShift',
  description: 'Logga in för att delta i kulturevenemang i VR/360',
});
</script>
