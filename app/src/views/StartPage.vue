<template>
  <div class="hero h-screen">
    <div class="flex flex-col gap-4 items-center">
      <h1 class="text-5xl font-bold">
        Välkommen till OrigoShift
      </h1>
      <p class="my-4">
        Välj ett namn och gå vidare för att delta i kulturevenemang i VR/360
      </p>
      <div class="flex w-fit items-center gap-4">
        <div class="join border border-neutral-600">
          <input
            v-model="guestUsername"
            class="input join-item min-w-60"
          >
          <div
            class="tooltip"
            data-tip="slumpa ett namn"
          >
            <button
              class="btn btn-circle btn-ghost join-item"
              @click="generateUsername"
            >
              <span class="material-icons">replay</span>
            </button>
          </div>
        </div>
        <button
          @click="guestContinue()"
          class="btn btn-primary"
        >
          Gå in
        </button>
      </div>
    </div>
    <div class="fixed bottom-0 right-0 card card-compact">
      <div class="card-body">
        <RouterLink
          class="flex gap-1 items-center text-secondary "
          :to="{name: 'login'}"
        >
          <span class="text-base">
            Inloggning
          </span>
          <span class="material-icons">keyboard_arrow_right</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import {useRouter} from 'vue-router';

const router = useRouter();
const authStore = useAuthStore();

const guestUsername = ref<string>();

async function generateUsername() {
  await authStore.logout();
  await authStore.autoGuest();
  guestUsername.value = authStore.username;
}

const guestContinue = async () => {
  await authStore.autoGuest(guestUsername.value);
  // const connectionStore = useConnectionStore();
  // connectionStore.createUserClient();
  router.push({name: 'venueList'});
};
</script>