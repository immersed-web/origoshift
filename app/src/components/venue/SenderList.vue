<template>
  <table class="table">
    <thead>
      <tr>
        <th colspan="2">
          Anslutna sändare
        </th>
        <th>
          Strömmar
        </th>
      </tr>
    </thead>
    <tbody class="border">
      <tr
        v-for="[key, sender] in adminStore.connectedSenders"
        :key="key"
      >
        <th>{{ sender.connectionId.substring(0, 5) }}...</th>
        <th>{{ sender.username }}</th>
        <th>
          <p
            v-for="producer in sender.producers"
            :key="producer.producerId"
          >
            {{ producer.kind }}:{{ producer.producerId.substring(0, 5) }}
          </p>
        </th>
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

