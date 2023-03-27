<template>
  <table class="table">
    <thead>
      <tr>
        <th colspan="0">
          Anslutna sändare
        </th>
      </tr>
    </thead>
    <tbody class="border">
      <tr
        v-for="sender in venueStore.currentVenue?.detachedSenders"
        :key="sender.connectionId"
      >
        <td>{{ sender.connectionId.substring(0, 5) }}...</td>
        <td>{{ sender.username }}</td>
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

