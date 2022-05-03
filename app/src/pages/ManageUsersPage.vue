<template>
  <template
    v-for="(roles, userGroupGatheringName) in groupedUsers"
    :key="userGroupGatheringName"
  >
    <QCard
      style="max-width: 40rem;"
      class="q-ma-lg q-pa-sm"
    >
      <QList>
        <QItemLabel
          header
        >
          <div class="text-h5">
            {{ userGroupGatheringName }}
          </div>
        </QItemLabel>
        <template
          v-for="(loopedUsers, roleInGroup) in roles"
          :key="roleInGroup"
        >
          <QItem
            v-for="user in loopedUsers"
            :key="user.username"
          >
            <QItemSection>
              {{ user.username }}
            </QItemSection>
            <QItemSection>
              {{ roleInGroup }}
            </QItemSection>
            <QItemSection side>
              <div class="q-gutter-xs">
                <QBtn
                  flat
                  round
                  icon="edit"
                  @click="startEditingUser(user)"
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
        </template>
        <QSeparator />
        <QItem
          class="justify-end"
        >
          <QBtn
            class="q-mt-md"
            round
            flat
            icon="add"
            @click="startAddingUser(userGroupGatheringName as string)"
          >
            <QTooltip>Skapa ny användare</QTooltip>
          </QBtn>
        </QItem>
        <QDialog v-model="addingOrEditingUser">
          <div>
            <QCard
              tag="form"
              @submit.prevent="uuid?editUser():addUser()"
            >
              <QCardSection>
                <div class="text-h5">
                  {{ !uuid? `Lägg till användare till ${ gatheringName }`:`Redigera användare` }}
                </div>
              </QCardSection>
              <QCardSection>
                <QInput
                  outlined
                  dense
                  v-model="username"
                  label="användarnamn"
                />
              </QCardSection>
              <QCardSection class="">
                <QInput
                  outlined
                  dense
                  v-model="password"
                  label="lösenord"
                />
              </QCardSection>
              <QCardSection>
                <QSelect
                  outlined
                  v-model="role"
                  :options="allowedRoles"
                  label="role"
                />
              </QCardSection>
              <QCardActions
                class="q-pa-md"
                align="right"
              >
                <QBtn
                  label="avbryt"
                  color="negative"
                  v-close-popup
                />
                <QBtn
                  type="submit"
                  :label="uuid?'uppdatera användare':'skapa användare'"
                  color="primary"
                />
              </QCardActions>
            </QCard>
          </div>
        </QDialog>
      </QList>
    </QCard>
  </template>
</template>

<script setup lang="ts">

import { computed, ref } from 'vue';
import { securityLevels, NonGuestUserRole } from 'shared-types/CustomTypes';
import { deleteUser, getUsers, createUser, updateUser } from 'src/modules/authClient';
import { useUserStore } from 'src/stores/userStore';
import _ from 'lodash';

import { asyncDialog } from 'src/modules/utilFns';

const userStore = useUserStore();

const users = ref<Awaited<ReturnType<typeof getUsers>>>();

const roleOptions = _.without(securityLevels, 'guest') as unknown as NonGuestUserRole[];

const allowedRoles = computed(() => {
  const role = userStore.userData?.role;
  if (!role || role === 'guest') {
    console.warn('somethings fishy with the logged in user');
    return [];
  }
  const roleIndex = roleOptions.indexOf(role);
  return roleOptions.slice(0, roleIndex);
});

const groupedUsers = computed(() => {
  if (!users.value) return [];
  const withoutSelf = users.value.filter(user => user.uuid !== userStore.userData?.uuid);
  const byGathering = _.groupBy(withoutSelf, (user) => {
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

const addingOrEditingUser = ref<boolean>();

// const editingUser = ref<boolean>(false);
const gatheringName = ref<string>();
const username = ref<string>();
const password = ref<string>();
const role = ref<NonGuestUserRole>();
const uuid = ref<string>();

function startEditingUser (user: Exclude<(typeof users.value), undefined>[number]) {
  username.value = user.username;
  password.value = '';
  uuid.value = user.uuid;
  if (!user.role) return;
  role.value = user.role.role as NonGuestUserRole;
  if (!user.gathering) {
    return;
  }
  startDialog(user.gathering.name);
}

function startAddingUser (_gatheringName: string) {
  username.value = '';
  password.value = '';
  uuid.value = undefined;
  role.value = allowedRoles.value[0];
  startDialog(_gatheringName);
}
function startDialog (_gatheringName: string) {
  addingOrEditingUser.value = true;
  gatheringName.value = _gatheringName;
}

async function addUser () {
  if (!username.value || !password.value || !role.value) {
    return;
  }
  const createdUser = await createUser({
    username: username.value,
    password: password.value,
    role: role.value,
    gathering: gatheringName.value,
  });
  users.value?.push(createdUser);
  addingOrEditingUser.value = false;
}

async function editUser () {
  if (!uuid.value) {
    return;
  }
  const updatedUser = await updateUser({
    uuid: uuid.value,
    role: role.value,
    username: username.value,
    password: password.value ? password.value : undefined,
    gathering: gatheringName.value,

  });
  console.log(updatedUser);
  const idx = _.findIndex(users.value, { uuid: updatedUser.uuid });
  users.value?.splice(idx, 1, updatedUser);
  addingOrEditingUser.value = false;
}

</script>
<style scoped lang="scss">
.two-icon-space {
  width: $space-base * 5.5;
  background-color: $red-5;
}
</style>
