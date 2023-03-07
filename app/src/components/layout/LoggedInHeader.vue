<template>
  <div class="navbar bg-primary text-white">
    <div class="flex-1">
      <RouterLink
        to="/"
        class="btn btn-ghost normal-case text-xl"
      >
        OrigoShift
      </RouterLink>
    </div>
    <div class="flex-none">
      <div class="dropdown dropdown-end text-black">
        <label
          tabindex="0"
          class="btn btn-ghost btn-circle avatar"
        >
          <div class="avatar placeholder">
            <div class="bg-neutral-focus text-neutral-content rounded-full w-10">
              <span>{{ clientStore.initials }}</span>
            </div>
          </div>
        </label>
        <ul
          tabindex="0"
          class="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
        >
          <li>
            <RouterLink to="/">
              @{{ clientStore.clientState.userName }}
            </RouterLink>
          </li>
          <div class="divider m-0" />

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

const router = useRouter();

const authStore = useAuthStore();
const clientStore = useClientStore();

const logout = async () => {
  await authStore.logout();
  console.log('was logged out');
  router.push({path: '/', force: true});
};

</script>

<style scoped>

</style>
