<template>
  <q-page padding>
    <h2 class="text-center">
      Välkommen! Vilket event vill du besöka?
    </h2>
    <div class="row justify-around no-wrap">
      <q-card class="q-ma-md col-6">
        <h3 class="text-center">
          Publika event
        </h3>
        <q-list>
          <q-item
            clickable
            v-ripple
            v-for="index in 8"
            :key="index"
          >
            Cool event {{ index }}
          </q-item>
        </q-list>
      </q-card>
      <q-card
        id="custom-event-container"
        class="q-ma-md q-pa-lg col-6"
      >
        <h3 class="text-center">
          Join a private event
        </h3>
        <div class="row q-gutter-md justify-between">
          <q-input
            outlined
            dense
            v-model="undefiend"
            class="col-grow"
          />
          <q-btn
            label="join"
            color="primary"
            icon-right="arrow_right"
          />
        </div>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
// export default {
//   // name: 'PageName',
// };
</script>
