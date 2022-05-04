<template>
  <QDialog v-model="isAddingGathering">
    <div>
      <QCard
        tag="form"
        @submit.prevent="addGathering"
      >
        <QCardSection>
          <QInput
            outlined
            label="gathering name"
            v-model="gatheringName"
          />
        </QCardSection>
        <QCardActions align="right">
          <QBtn
            v-close-popup
            color="negative"
            label="avbryt"
          />
          <QBtn
            type="submit"
            color="primary"
            label="skapa gathering"
          />
        </QCardActions>
      </QCard>
    </div>
  </QDialog>
  <div
    class="q-pa-lg q-gutter-y-md"
    style="max-width: 70rem;"
  >
    <QBtn
      v-if="showGatheringPanel"
      label="skapa nytt gathering"
      color="primary"
      @click="startCreatingGathering"
    />
    <QCard
      v-for="(gathering, idx) in allGatherings"
      :key="gathering.uuid"
      class=""
    >
      <QExpansionItem
        :default-opened="idx === 0"
        :expand-icon-class="{'hidden': !showGatheringPanel}"
        :disable="!showGatheringPanel"
        header-class="text-h5"
        :label="gathering.name"
      >
        <QList>
          <template
            v-for="(loopedUsers, roleInGroup) in groupedUsers[gathering.name]"
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
          <QItem>
            <QItemSection>
              <div>
                <QBtn
                  label="ta bort gathering"
                  color="negative"
                  @click="removeGathering(gathering.name)"
                />
              </div>
            </QItemSection>
            <QItemSection side>
              <QBtn
                round
                flat
                icon="add"
                @click="startAddingUser(gathering.name)"
              >
                <QTooltip>Skapa ny användare</QTooltip>
              </QBtn>
            </QItemSection>
          </QItem>
        </QList>
      </QExpansionItem>
    </QCard>
  </div>
  <QDialog v-model="addingOrEditingUser">
    <div>
      <QCard
        tag="form"
        @submit.prevent="uuid?editUser():addUser()"
      >
        <QCardSection>
          <div class="text-h5">
            {{ !uuid? `Lägg till användare till ${ usersGatheringName }`:`Redigera användare` }}
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
        <QCardSection v-if="showGatheringPanel && uuid">
          <QSelect
            outlined
            v-model="usersGatheringName"
            :options="gatheringSelectOptions"
            label="gathering"
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
            :disable="(!uuid && (!password || !username)) "
            type="submit"
            :label="uuid?'uppdatera användare':'skapa användare'"
            color="primary"
          />
        </QCardActions>
      </QCard>
    </div>
  </QDialog>
</template>

<script setup lang="ts">

import { computed, ref } from 'vue';
import { throwIfUnauthorized } from 'shared-modules/authUtils';
import { securityLevels, NonGuestUserRole } from 'shared-types/CustomTypes';
import { deleteUser, getUsers, createUser, updateUser, getAllGatherings, createGathering, getGathering, deleteGathering } from 'src/modules/authClient';
import { useUserStore } from 'src/stores/userStore';
import _ from 'lodash';

import { asyncDialog } from 'src/modules/utilFns';

const userStore = useUserStore();

const showGatheringPanel = computed(() => {
  try {
    throwIfUnauthorized(userStore.userData?.role, 'admin');
    return true;
  } catch (e) {
    return false;
  }
});
const allGatherings = ref<Awaited<ReturnType<typeof getAllGatherings>>>();
const gatheringSelectOptions = computed(() => {
  return allGatherings.value?.map((gat) => {
    return gat.name;
  });
});
const gatheringName = ref<string>();
const isAddingGathering = ref(false);

function startCreatingGathering () {
  gatheringName.value = undefined;
  isAddingGathering.value = true;
}

// TODO: handle validation errors
async function addGathering () {
  if (!gatheringName.value) {
    console.warn('no gatheringName set');
    return;
  }
  const createdGathering = await createGathering({
    gatheringName: gatheringName.value,
  });
  allGatherings.value?.push(createdGathering);
  isAddingGathering.value = false;
}

async function removeGathering (gatheringName: string) {
  const result = await asyncDialog({
    message: 'Säker på att du vill ta bort detta gathering? Alla associerade användare kommer också bli borttagna.',
    title: `Bekräfta borttagning av ${gatheringName}`,
    cancel: { label: 'Avbryt', color: 'negative' },
    ok: { label: 'Ta bort', color: 'primary' },
  });
  const deletedGathering = await deleteGathering({ gatheringName });
  const idxOfDeletedGathering = allGatherings.value?.findIndex((gath) => {
    return gath.uuid === deletedGathering.uuid;
  });
  if (idxOfDeletedGathering === undefined) {
    console.warn('didnt find the deleted gathering in clientside list... Weird!');
    return;
  }
  allGatherings.value?.splice(idxOfDeletedGathering, 1);
}

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

// INIT HERE
(async () => {
  const payload : Record<string, unknown> = {};
  if (userStore.userData?.gathering) {
    payload.gathering = userStore.userData.gathering;
  }
  const response = await getUsers(payload);
  users.value = response;

  if (showGatheringPanel.value) {
    const gatherings = await getAllGatherings();
    // console.log(gatherings);
    allGatherings.value = gatherings;
  } else {
    const gathering = await getGathering({
      gatheringName: userStore.userData?.gathering,
    });
    allGatherings.value = [gathering];
  }
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

const addingOrEditingUser = ref<boolean>(false);

// const editingUser = ref<boolean>(false);
const usersGatheringName = ref<string>();
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
  usersGatheringName.value = _gatheringName;
}

async function addUser () {
  if (!username.value || !password.value || !role.value) {
    return;
  }
  const createdUser = await createUser({
    username: username.value,
    password: password.value,
    role: role.value,
    gathering: usersGatheringName.value,
  });
  users.value?.push(createdUser);
  addingOrEditingUser.value = false;
}

async function editUser () {
  if (!uuid.value) {
    return;
  }

  const payload: Parameters<typeof updateUser>[0] = {
    uuid: uuid.value,
    role: role.value,
    username: username.value,
    password: password.value ? password.value : undefined, // This is to make sure empty string becomes undefined in sent request
  };

  if (showGatheringPanel.value) {
    payload.gathering = usersGatheringName.value;
  }
  const updatedUser = await updateUser(payload);
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
