<template>
  <div class="flex flex-col gap-8">
    <h1 class=" text-5xl font-bold">
      Välkommen {{ clientStore.clientState?.username }}
    </h1>
    <div>
      <h2 class="mb-2 text-3xl font-bold">
        Mina event
      </h2>
      <div class="flex space-x-2">
        <VenueList
          v-if="clientStore.clientState"
          :venues="venuesAsArray"
          @venue-picked="(venue) => pickVenueAndNavigate(venue.venueId as VenueId)"
        />
        <div>
          <button
            class="btn btn-outline btn-primary"
            @click="createVenue"
          >
            Skapa ett nytt event
          </button>
        </div>
      </div>
    </div>
    <div
      v-if="authStore.role === 'superadmin'"
      class="space-y-6"
    >
      <h2 class="mb-4 text-3xl font-bold">
        Användarfunktioner
      </h2>
      <div class="space-y-2">
        <h3>
          Skapa ny admin 
        </h3>
        <div class="flex gap-6">
          <label class="flex items-center gap-2">
            <span class="font-bold">Användarnamn:</span>
            <input
              v-model="adminUsername"
              class="input input-bordered "
            >
          </label>
          <label class="flex items-center gap-2">
            <span class="font-bold">Lösenord:</span>
            <input
              v-model="adminPassword"
              class="input input-bordered "
            >
          </label>
          <button
            @click="makeCallThenResetList(() => createAdmin(adminUsername, adminPassword))"
            class="btn  btn-primary"
          >
            <span class="material-icons">add</span>
            Lägg till
          </button>
        </div>
      </div>
      <div>
        <h3>
          Befintliga adminanvändare
        </h3>
        <div class="w-[50rem]">
          <table class="table">
            <tbody>
              <tr
                v-for="admin in admins"
                :key="admin.userId"
              >
                <template v-if="editedUserId === admin.userId">
                  <td class="text-base font-bold">
                    <input
                      v-model="editedUsername"
                      class="input input-bordered"
                    >
                  </td>
                  <td>
                    <input
                      v-model="editedPassword"
                      class="input input-bordered"
                    >
                  </td>
                  <td class="flex gap-2 justify-end">
                    <button
                      @click="updateAdmin({userId: editedUserId, username: editedUsername, password: editedPassword === ''?undefined: editedPassword})"
                      class="btn btn-primary"
                    >
                      <span class="material-icons">save</span>
                    </button>
                    <button
                      @click="editedUserId = undefined"
                      class="btn btn-ghost"
                    >
                      <span class="material-icons">cancel</span>
                    </button>
                  </td>
                </template>
                <template v-else>
                  <td class="text-base font-bold">
                    {{ admin.username }}
                  </td>
                  <td />
                  <td class="flex gap-2 justify-end">
                    <button
                      @click="editedUserId = admin.userId; editedUsername = admin.username; editedPassword= ''"
                      class="btn"
                    >
                      <span class="material-icons">edit</span>
                    </button>
                    <button
                      @click="makeCallThenResetList(()=> deleteUser(admin.userId))"
                      class="btn btn-error"
                    >
                      <span class="material-icons">delete</span>
                    </button>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import VenueList from '@/components/venue/VenueList.vue';
import { useClientStore } from '@/stores/clientStore';
import { useAuthStore } from '@/stores/authStore';
import { useVenueStore } from '@/stores/venueStore';
import { computed, onBeforeMount, ref } from 'vue';
import type { VenueId } from 'schemas';
import { useAdminStore } from '@/stores/adminStore';
import { createAdmin, getAdmins, updateUser, deleteUser } from '@/modules/authClient';

// Use imports
const router = useRouter();
// const connectionStore = useConnectionStore();
const clientStore = useClientStore();
const authStore = useAuthStore();
const venueStore = useVenueStore();
const adminStore = useAdminStore();


const adminUsername = ref('');
const adminPassword = ref('');

const admins = ref<Awaited<ReturnType<typeof getAdmins>>>([]);

const editedUserId = ref<string>();
const editedUsername = ref<string>();
const editedPassword = ref<string>();

const venuesAsArray = computed(() => {
  if(!clientStore.clientState) return [];
  return Object.values(clientStore.clientState?.ownedVenues);
});

async function updateAdmin(userData: any) {
  // console.log(userData);
  const response = await updateUser(userData);
  console.log(response);
  if(!admins.value) {
    console.error('admins undefined!');
  }
  console.log(admins.value);
  const idx = admins.value.findIndex(a => {
    // console.log(a.userId);
    // console.log(userData.userId);
    return a.userId === userData.userId;
  });
  console.log('index:', idx);
  if(idx >= 0) {
    admins.value[idx] = response;
  }
  editedUserId.value = undefined;
}

onBeforeMount(async () => {
  admins.value = await getAdmins();
  console.log(admins.value);
});

async function makeCallThenResetList(fetchReq: (...p: any) => Promise<any>) {
  await fetchReq();
  editedUserId.value = undefined;
  adminUsername.value = '';
  adminPassword.value = '';
  admins.value = await getAdmins();  
}


// function createAdmin() {
//   console.log(adminUsername.value, adminPassword.value);
// }

// const myVenues = ref<RouterOutputs['admin']['listMyVenues']>();
// onBeforeMount(async () => {
//   myVenues.value = await connectionStore.client.admin.listMyVenues.query();
// });

// const loadedVenues = ref<RouterOutputs['venue']['listLoadedVenues']>();
// onBeforeMount(async () => {
//   loadedVenues.value = await connectionStore.client.venue.listLoadedVenues.query();
// });

// View functionality
async function createVenue () {
  await adminStore.createVenue();
}

const pickVenueAndNavigate = async (venueId: VenueId) => {
  venueStore.savedVenueId = venueId;
  router.push({name: authStore.routePrefix + 'Venue'});
};

</script>
