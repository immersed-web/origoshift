<template>
  <template
    v-for="(roles, gatheringName) in groupedUsers"
    :key="gatheringName"
  >
    <QCard
      style="max-width: 40rem;"
      class="q-ma-lg q-pa-sm"
    >
      <QList
        bordered
      >
        <QItemLabel
          header
        >
          <div class="text-h5">
            {{ gatheringName }}
          </div>
        </QItemLabel>
        <template
          v-for="(users, role) in roles"
          :key="role"
        >
          <QItem
            v-for="user in users"
            :key="user.username"
          >
            <QItemSection>
              {{ user.username }}
            </QItemSection>
            <QItemSection>
              {{ role }}
            </QItemSection>
            <QItemSection
              side
            >
              <div
                class="q-gutter-xs"
              >
                <QBtn
                  flat
                  round
                  icon="edit"
                />
                <QBtn
                  flat
                  round
                  color="negative"
                  icon="delete"
                  @click="onDeleteUser(user)"
                />
              </div>
            </QItemSection>
          </QItem>
          <QSeparator />
        </template>
      </QList>
    </QCard>
  </template>
</template>

<script setup lang="ts">

import { computed, ref } from 'vue';
import { deleteUser, getUsers } from 'src/modules/authClient';
import { useUserStore } from 'src/stores/userStore';
import _ from 'lodash';

import { asyncDialog } from 'src/modules/utilFns';

const userStore = useUserStore();

const users = ref<Awaited<ReturnType<typeof getUsers>>>();

const groupedUsers = computed(() => {
  if (!users.value) return [];
  const byGathering = _.groupBy(users.value, (user) => {
    if (!user.gathering?.name) return 'unassigned';
    return user.gathering.name;
  });
  const byGatheringAndRole = _.mapValues(byGathering, (userArray) => {
    return _.groupBy(userArray, (user) => {
      if (!user.role?.role) return 'noRole';
      return user.role.role;
    });
  });
  // const byGatheringAndRole = {}
  // for (const [key, userArray] of Object.entries(byGathering)) {
  //   byGatheringAndRole[key] = _.groupBy(userArray, 'role');
  return byGatheringAndRole;
});

(async () => {
  const payload : Record<string, unknown> = {};
  if (userStore.userData?.gathering) {
    payload.gathering = userStore.userData.gathering;
  }
  const response = await getUsers(payload);
  users.value = response;
})();

async function onDeleteUser (user: Exclude<(typeof users.value), undefined>[number]) {
  const payload = await asyncDialog({
    title: 'Verifiera',
    ok: {
      color: 'negative',
      label: 'Radera',
    },
    cancel: {
      label: 'Avbryt',
      color: 'dark',
    },
    focus: 'none',
    message: 'Bekräfta radering av användaren ' + user.username,
  });

  await deleteUser(user.uuid);
  if (users.value) {
    _.pull(users.value, user);
  }
}

</script>
