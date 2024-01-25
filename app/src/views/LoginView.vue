<template>
  <div>
    <div class="min-h-screen hero bg-base-200">
      <div class="flex-col gap-10 hero-content lg:flex-row-reverse">
        <div class="text-center lg:text-left">
          <h1 class="text-5xl font-bold">
            Välkommen till OrigoShift
          </h1>
          <p class="py-6">
            Logga in för att delta i kulturevenemang i VR/360.
          </p>
          <p class="mb-4">
            Alternativt kan du fortsätta som <span class="font-bold">gäst</span>:
          </p>
          <div class="flex items-center gap-4">
            <div class="join border border-base-300">
              <input
                v-model="guestUsername"
                class="input join-item"
              >
              <div
                class="tooltip"
                data-tip="autogenerera namn"
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
              class="btn btn-outline btn-primary"
            >
              Gå in
            </button>
          </div>
          <div
            class="mt-4"
            v-once
            v-if="showDevLoginButtons"
          >
            <h2>Devmode quick login</h2>
            <div class="space-x-2">
              <button
                @click="loginDetails('user1','123')"
                class="btn btn-primary btn-outline"
              >
                User
              </button>
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
        </div>
        <div class="flex-shrink-0 w-full max-w-sm shadow-2xl card bg-base-100">
          <form
            class="card-body"
            @submit.prevent="login"
          >
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

const showDevLoginButtons = import.meta.env.DEV;
// const showDevLoginButtons = import.meta.env.PROD;

const guestUsername = ref<string>();

// const props = defineProps<{
//   redirectAfterLogin?: string
// }>();

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
const username = ref('superadmin');
const password = ref('bajskorv');
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

const loginDetails = (un: string, pwd: string) => {
  username.value = un;
  password.value = pwd;
  login();
};

</script>

