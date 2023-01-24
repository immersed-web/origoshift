<template>
  <QLayout view="lHh Lpr lFf">
    <QPageContainer>
      <RouterView />
    </QPageContainer>
  </QLayout>
</template>

<script lang="ts">

import { defineComponent } from 'vue';

export default defineComponent({
  name: 'MainLayout',
});
</script>
