<template>
  <div class="text-white navbar bg-primary">
    <div class="flex-1">
      <RouterLink
        :to="{name: authStore.routePrefix + 'Home'}"
        class="text-xl normal-case btn btn-ghost"
      >
        OrigoShift
      </RouterLink>
    </div>
    <div class="flex-none">
      <div class="text-black dropdown dropdown-end">
        <label
          tabindex="0"
          class="btn btn-ghost btn-circle avatar"
        >
          <div class="avatar placeholder">
            <div class="w-10 rounded-full bg-neutral-focus text-neutral-content">
              <span>{{ clientStore.initials }}</span>
            </div>
          </div>
        </label>
        <ul
          tabindex="0"
          class="p-2 mt-3 shadow menu menu-compact dropdown-content bg-base-100 rounded-box w-52"
        >
          <li>
            <RouterLink :to="{name: authStore.routePrefix + 'Home'}">
              @{{ clientStore.clientState?.username }}
            </RouterLink>
          </li>
          <div class="m-0 divider" />

          <li><a>Mina event</a></li>
          <li>
            <a
              class="hover:bg-error"
              @click="logout"
            >Logga ut</a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useClientStore } from '@/stores/clientStore';

// Use imports
const router = useRouter();
const authStore = useAuthStore();
const clientStore = useClientStore();

// Components stuff

const logout = async () => {
  await authStore.logout();
  console.log('was logged out');
  router.push({path: '/', force: true});
};

</script>

<style scoped>

</style>
