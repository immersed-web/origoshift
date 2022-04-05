<template>
  <div class="fixed-center column q-gutter-xl items-end">
    <QBtn
      color="primary"
      label="Kamerastation"
      :to="{name:'camera'}"
      icon-right="navigate_next"
    />
    <QBtn
      color="primary"
      label="Rumskontroll"
      :to="{name: 'controlRoom'}"
      icon-right="navigate_next"
    />
    <QBtn
      color="primary"
      label="Hantera elevkonton"
      :to="{ name: 'userManager'}"
      icon-right="navigate_next"
    />
  </div>
</template>

<script setup lang="ts">

</script>
