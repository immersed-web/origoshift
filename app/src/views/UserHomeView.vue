<template>
  <div>
    <h1 class="text-5xl font-bold">
      Välkommen {{ clientStore.clientState.userName }}
    </h1>
    <div>
      <h2 class="text-3xl font-bold">
        Mina event
      </h2>
      <!-- <VenueList /> -->
    </div>
  </div>
</template>

<script setup lang="ts">
// import LoggedInLayout from '@/layouts/LoggedInLayout.vue';
// import VenueList from '@/components/venue/VenueList.vue';
// import { clientOrThrow, type RouterOutputs } from '@/modules/trpcClient';
import { useClientStore } from '@/stores/clientStore';
// import { onBeforeMount, ref } from 'vue';

// Stores
const clientStore = useClientStore();

// const myVenues = ref<RouterOutputs['venue']['listMyVenues']>();
// onBeforeMount(async () => {
//   myVenues.value = await clientOrThrow.value.venue.listMyVenues.query();
// });

</script>

