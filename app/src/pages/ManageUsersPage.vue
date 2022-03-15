<template>
  <QList
    bordered
    separator
  >
    <QItem>
      <QItemSection>
        <h3>Användare</h3>
      </QItemSection>
    </QItem>
    <template
      v-for="user in users"
      :key="user.username"
    >
      <QItem>
        <QItemSection>
          User {{ user.username }}
        </QItemSection>
      </QItem>
    </template>
  </QList>
</template>

<script setup lang="ts">

import { ref } from 'vue';
import { getUsers } from 'src/modules/authClient';

const users = ref<Record<string, number>[]>([]);

(async () => {
  const response = await getUsers({
    gathering: 'TestSkolan',
  });
  users.value = response;
})();

</script>
