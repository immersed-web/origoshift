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
        </div>
        <div class="flex-shrink-0 w-full max-w-sm shadow-2xl card bg-base-100">
          <form
            class="card-body"
            @submit.prevent="login"
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
import { useClientStore } from '@/stores/clientStore';
import { ref } from 'vue';
import { isTRPCClientError } from '@/modules/trpcClient';

// Router
const router = useRouter();

// Stores
const clientStore = useClientStore();

// View / components functionality
const username = ref('superadmin');
const password = ref('bajskorv');
const error = ref('');

const login = async () => {
  try{
    await clientStore.login(username.value, password.value);
    router.push({name: 'userHome'});
  }
  catch(e: unknown){
    console.error(e);
    if(isTRPCClientError(e)){
      error.value = e.message;
    }else if(e instanceof Error){
      error.value = e.message;
    }
  }

};


</script>

