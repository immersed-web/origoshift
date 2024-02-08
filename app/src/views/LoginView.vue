<template>
  <div>
    <div class="min-h-screen hero bg-base-200">
      <div class="flex-col gap-10 hero-content lg:flex-row-reverse">
        <div
          class="mt-4"
          v-once
          v-if="showDevLoginButtons"
        >
          <h2>Devmode quick login</h2>
          <div class="space-x-2 mt-4 text-right">
            <button
              @click="loginDetails('sender','123')"
              class="btn btn-primary btn-outline"
            >
              Sender
            </button>
            <button
              @click="loginDetails('superadmin','bajskorv')"
              class="btn btn-primary btn-outline"
            >
              Superadmin
            </button>
          </div>
        </div>
        <!-- <VenueListView /> -->
        <div
          class="flex-shrink-0 max-w-sm shadow-2xl card bg-base-100"
        >
          <form
            class="card-body"
            @submit.prevent="login"
          >
            <h2>Logga in</h2>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Användarnamn</span>
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
              {{ error }}
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
    </div>
  </div>
</template>

<script setup lang="ts">

// Imports
import { useRouter } from 'vue-router';
// import { useClientStore } from '@/stores/clientStore';
import { onMounted, ref } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { hasAtLeastSecurityLevel, type UserRole } from 'schemas/esm';
import { useConnectionStore } from '@/stores/connectionStore';
import VenueListView from './public/VenueListView.vue';

const showDevLoginButtons = import.meta.env.DEV;

// Router
const router = useRouter();
const fromRoute = router.currentRoute.value.redirectedFrom;
console.log('redirected from', fromRoute);
const defaultLoginRedirect = router.currentRoute.value.meta.afterLoginRedirect;
console.log('explicit redirect after login:', defaultLoginRedirect);

// Stores
const authStore = useAuthStore();
authStore.logout();
console.log('authstore loaded');

onMounted(() => {
  const connection = useConnectionStore();
  connection.close();
});

// View / components functionality
const username = ref('');
const password = ref('');
const error = ref('');

const login = async () => {
  try{
    // await clientStore.login(username.value, password.value);
    await authStore.login(username.value, password.value);
    // console.log('Login as role', authStore.role);
    if(defaultLoginRedirect){
      // console.log('redirectAfterLogin', props.redirectAfterLogin);
      router.push({name: defaultLoginRedirect});
    } else if(fromRoute && fromRoute.path !== '/'){
      // console.log('fromRoute', fromRoute);
      router.push(fromRoute);
    } else {
      // console.log('Regular login', authStore.role);
      // router.push('/');
      if(authStore.role && hasAtLeastSecurityLevel(authStore.role, 'admin')){
        router.push({name: 'adminHome'});
      }
      else {
        router.push({name: 'userHome'});
      }

    }
  }
  catch(e: unknown){
    console.error(e);
    if(e instanceof Error){
      error.value = e.message;
    }
  }
};


const loginDetails = (un: string, pwd: string) => {
  username.value = un;
  password.value = pwd;
  login();
};

</script>

