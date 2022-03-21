<template>
  <QCard
    v-if="userStore.userData"
    id="user-info-box"
  >
    <QCardSection class="row items-center no-wrap q-gutter-sm">
      <div>
        Inloggad som:
      </div>
      <QBadge
        :label="userStore.userData.username"
        outline
        color="primary"
      />
      <QBtn
        flat
        icon="logout"
        round
        @click="router.replace('/logout')"
      >
        <QTooltip class="bg-primary text-white">
          Logga ut
        </QTooltip>
      </QBtn>
    </QCardSection>
  </QCard>
</template>

<script setup lang="ts">
import { useUserStore } from 'src/stores/userStore';
import { useRouter } from 'vue-router';

const userStore = useUserStore();
const router = useRouter();

</script>

<style scoped lang="scss">
#user-info-box {
  border-radius: 0;
  border-bottom-left-radius: 1rem;
  z-index: 9000;
  position: fixed;
  top: 0;
  right: 0;
}
</style>
