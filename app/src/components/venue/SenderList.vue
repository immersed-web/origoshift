<template>
  <table class="table">
    <thead>
      <tr>
        <th colspan="2">
          Anslutna sändare
        </th>
      </tr>
    </thead>
    <tbody class="border">
      <tr
        v-for="[key, sender] in adminStore.connectedSenders"
        :key="key"
      >
        <th>{{ sender.connectionId }}</th>
        <th>{{ sender.username }}</th>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { useAdminStore } from '@/stores/adminStore';
import { useVenueStore } from '@/stores/venueStore';

// Use imports
const venueStore = useVenueStore();
const adminStore = useAdminStore();

</script>

