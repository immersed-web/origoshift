<template>
  <div
    v-if="venueStore.currentVenue"
  >
    <h2 class="mb-4">
      Grundinställningar
    </h2>
    <div class="w-full max-w-xs mb-2 bg-neutral-100 p-2 border form-control">
      <label class="label">
        <span class="label-text text-base">Eventets namn</span>
      </label>
      <input
        v-model="values.name"
        type="text"
        placeholder="Eventets namn"
        class="w-full max-w-xs input input-bordered"
      >
    </div>
    <div class="w-full max-w-xs mb-2 form-control bg-neutral-100 p-2 text-sm border">
      <div class="flex justify-between mb-2">
        <span class="label-text text-base">Synlighet</span>
        <span class="material-icons">visibility</span>
      </div>
      <div class="join w-full">
        <button
          v-for="vo in venueStore.visibilityOptions"
          :key="vo.visibility"
          type="button"
          class="btn btn-sm join-item"
          :class="{
            'btn-primary': vo.visibility === values.visibility,
            'btn-neutral': vo.visibility !== values.visibility
          }"
          @click="values.visibility = vo.visibility"
        >
          <span class="mr-2 material-icons">{{ vo.icon }}</span>
          {{ vo.name }}
        </button>
      </div>
      <div
        
        class="mt-4 w-full"
        v-if="values.visibility !== 'private'"
      >
        <div class="label">
          <span class="label-text-alt">Länk till eventet:</span>
        </div>
        <div class="join ">
          <p
            style="overflow-wrap: break-word; word-break: break-all;"
            class="inline-block bg-neutral-50 p-2 border join-item text-xs select-all"
          >
            {{ eventUrl }}
          </p>
          <div
            class="tooltip"
            :data-tip="linkCopyTooltip"
          >
            <button
              @click.prevent="copyEventUrlToClipboard"
              class="btn btn-outline join-item"
            >
              <span
                class="material-icons"
              >content_copy</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Lobby/VR start time -->
    <div
      v-if="venueStore.currentVenue.vrSpace"
      class="w-full max-w-xs mb-2 form-control bg-base-200 p-2 text-sm border"
    >
      <div class="flex justify-between mb-2">
        <span class="label-text text-base">Lobby</span>
        <span class="material-icons">nightlife</span>
      </div>
      <label class="label flex justify-start gap-2 pl-0">
        <span class="label-text">Lobbyn öppnar innan sändningen: </span>
        <input
          class="mr-2 toggle toggle-primary toggle-sm"
          type="checkbox"
          v-model="useDoorsOpenTime"
        >
        <!-- <span class="material-icons">meeting_room</span> -->
      </label>
      <div
        class="pl-2 text-sm"
        v-auto-animate
      >
        <!-- <input
            class="mr-2 toggle toggle-primary"
            type="checkbox"
            v-model="useDoorsOpenTime"
          > -->
        <div v-if="useDoorsOpenTime">
          Ange tiden då lobbyn öppnar. Tiden är synlig för besökarna.
          <input
            v-model="values.doorsOpeningTime"
            type="datetime-local"
            placeholder="Startdatum och -tid"
            class="w-full max-w-xs input input-bordered"
          >
          <label class="label flex justify-start gap-2">
            <span class="label-text">Öppna automatiskt vid utsatt tid: </span>
            <input
              class="mr-2 toggle toggle-primary toggle-sm"
              type="checkbox"
              v-model="values.doorsAutoOpen"
            >
            <!-- <span class="material-icons">meeting_room</span> -->
          </label>
        </div>
        <!-- <div
            v-else
            class="mb-2"
          >
            Dörrarna öppnar när eventet startar.
          </div> -->
      </div>
      <!-- Ni kan när som helst öppna lobbyn manuellt. -->
    </div>

    <!-- Event streaming start time -->
    <div class="w-full max-w-xs mb-2 form-control bg-base-200 p-2 text-sm border">
      <div class="flex justify-between mb-2">
        <span class="label-text text-base">360-sändning</span>
        <span class="material-icons">curtains</span>
      </div>
      <div>
        Ange tiden då 360-sändningen startar. Tiden är synlig för besökarna.
        <input

          v-model="values.streamStartTime"
          type="datetime-local"
          placeholder="Startdatum och -tid"
          class="w-full max-w-xs input input-bordered"
        >
        <label class="label flex justify-start gap-2">
          <span class="label-text">Starta automatiskt vid utsatt tid: </span>
          <input
            class="mr-2 toggle toggle-primary toggle-sm"
            type="checkbox"
            v-model="values.streamAutoStart"
          >
        </label>
      </div>
    </div>
    <!-- Separate sender login -->
    <div class="w-full max-w-xs mb-2 form-control bg-base-200 p-2 text-sm border">
      <div class="flex justify-between mb-2">
        <span class="label-text text-base">Separat sändarinloggning</span>
        <span class="material-icons">person</span>
      </div>
      <button
        class="btn btn-outline btn-primary"

        v-if="!senderUser.userId && userEditingState !== 'creating'"
        @click="userEditingState = 'creating'"
      >
        Skapa sändaranvändare
      </button>
      <div
        class="form-control gap-2"
        v-if="userEditingState"
      >
        <form
          class="flex flex-col gap-2 items-start"
          @submit.prevent="userEditingState === 'creating'? createNewSender() : updateTheSender()"
        >
          <input
            class="input input-sm"
            placeholder="Användarnamn"
            v-model="senderUser.username"
          >
          <div
            :class="{tooltip: userEditingState === 'editing'}"
            data-tip="Lämna blankt för att inte ändra"
          >
            <input
              :required="userEditingState === 'creating'"
              type="password"
              class="input input-sm"
              placeholder="Lösenord"
              v-model="senderUser.password"
            >
          </div>
          <div class="flex gap-2">
            <button
              type="submit"
              class="btn btn-sm btn-primary"
            >
              {{ userEditingState === 'creating' ? 'Skapa' : 'Spara' }}
            </button>
            <button
              @click="userEditingState = undefined"
              class="btn btn-sm btn-error"
            >
              Avbryt
            </button>
          </div>
        </form>
      </div>
      <div
        v-else-if="senderUser.userId"
        class="flex gap-2 items-center"
      >
        <div class="grid grid-cols-2 gap-x-2">
          <p>Användarnamn:</p>
          <p class="font-bold">
            {{ senderUser.username }}
          </p>
          <p>Lösenord:</p>
          <p class="font-bold">
            *****
          </p>
        </div>
        <div
          class="tooltip"
          data-tip="Ändra inloggningen"
        >
          <button
            @click="userEditingState = 'editing'"
            class="btn btn-primary btn-circle btn-sm"
          >
            <span class="material-icons">edit</span>
          </button>
        </div>
        <div
          data-tip="Ta bort användaren"
          class="tooltip"
        >
          <button
            @click="deleteTheSender"
            class="btn btn-error btn-circle btn-sm"
          >
            <span class="material-icons">delete</span>
          </button>
        </div>
      </div>
    </div>
    <!-- <div class="w-full max-w-xs form-control">
        <button
          type="submit"
          class="btn btn-primary"
        >
          Spara
        </button>
      </div> -->
  </div>
</template>

<script setup lang="ts">
import { useVenueStore } from '@/stores/venueStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { ref, computed, onMounted, onBeforeMount, reactive, watch } from 'vue';
import type { VenueUpdate } from 'schemas/esm';
import {useRouter} from 'vue-router';
import { autoResetRef } from '@vueuse/core';
import { debounce } from 'lodash-es';
import { getSenderForVenue, createSender, updateUser, deleteUser } from '@/modules/authClient';

// Use imports
const venueStore = useVenueStore();
const connection = useConnectionStore();
const router = useRouter();


const senderUser = reactive<{
  userId: string,
  password?: string,
  username: string,
}>({
  userId: '',
  password: undefined,
  username: '',
});

const userEditingState = ref<'creating' | 'editing'>();

async function createNewSender() {
  const user = senderUser;
  const venueId = venueStore.currentVenue?.venueId;
  if(!user?.username || !user.password || !venueId) {
    console.error('no data when creating new sender');
    return;
  }
  const response = await createSender(user.username, user.password, venueId);
  senderUser.username = response.username;
  senderUser.userId = response.userId;
  senderUser.password = undefined;
  userEditingState.value = undefined;
}

async function updateTheSender() {
  const { userId, username, password} = senderUser;
  const response = await updateUser({  
    userId,
    password: password === '' ? undefined : password,
    username,
  });
  senderUser.password = undefined;
  userEditingState.value = undefined;
}

async function deleteTheSender() {
  const response = await deleteUser(senderUser.userId);
  senderUser.userId = '';
  senderUser.username = '';
  senderUser.password = undefined;
}


const linkCopyTooltip = autoResetRef('Klicka för att kopiera adressen', 3000);
const eventUrl = computed(() => {
  const venueId = venueStore.currentVenue?.venueId;
  if(!venueId) return undefined;

  const url = new URL(router.resolve({name: 'userVenue', params: {venueId}}).href, window.location.origin).href;
  return url;
});
function copyEventUrlToClipboard() {
  if(!eventUrl.value) return;
  navigator.clipboard.writeText(eventUrl.value);
  linkCopyTooltip.value = 'Adress kopierad!';
}

const updateVenue = async () => {
  if(venueStore.currentVenue){

    console.log(useDoorsOpenTime.value, values.value.doorsOpeningTime);

    await connection.client.admin.updateVenue.mutate({
      name: values.value.name,
      visibility: values.value.visibility,
      doorsOpeningTime: useDoorsOpenTime.value && values.value.doorsOpeningTime ? new Date(values.value.doorsOpeningTime) : null,
      doorsAutoOpen: useDoorsOpenTime.value && values.value.doorsOpeningTime ? values.value.doorsAutoOpen : false,
      streamStartTime: values.value.streamStartTime ? new Date(values.value.streamStartTime) : null,
      streamAutoStart: values.value.streamStartTime ? values.value.streamAutoStart : false,
    });
  }
};
const debouncedVenueUpdate = debounce(updateVenue, 800);

type DatesAsStrings<T extends Record<string, unknown>> = {
  [K in keyof T]: Date extends T[K] ? Exclude<T[K], Date> | string: T[K]
}

const values = ref<DatesAsStrings<VenueUpdate>>({});


onBeforeMount(async () => {
  const venueId = venueStore.currentVenue?.venueId;
  if(!venueId) {
    console.warn('no currentvenue. returning');
    return;
  }
  const { userId, username} = await getSenderForVenue(venueId);
  senderUser.userId = userId;
  senderUser.username = username;
});

// TODO: could this perhaps fail? Should computed or watcher be used?
onMounted(() => {
  values.value.name = venueStore.currentVenue?.name;
  values.value.visibility = venueStore.currentVenue?.visibility;
  useDoorsOpenTime.value = !!venueStore.currentVenue?.doorsOpeningTime;
  values.value.doorsOpeningTime = venueStore.currentVenue?.doorsOpeningTime ? venueStore.currentVenue?.doorsOpeningTime?.toLocaleDateString() + 'T' +venueStore.currentVenue?.doorsOpeningTime?.toLocaleTimeString() : undefined;
  values.value.doorsAutoOpen = venueStore.currentVenue?.doorsAutoOpen;
  values.value.streamStartTime = venueStore.currentVenue?.streamStartTime ?  venueStore.currentVenue?.streamStartTime?.toLocaleDateString() + 'T' +venueStore.currentVenue?.streamStartTime?.toLocaleTimeString() : undefined;
  values.value.streamAutoStart = venueStore.currentVenue?.streamAutoStart;
  watch([values.value, useDoorsOpenTime], () => {
  // console.log('values updated!!!');
    debouncedVenueUpdate();
  }, {
    deep: true,
  });
});

const useDoorsOpenTime = ref(false);



</script>

