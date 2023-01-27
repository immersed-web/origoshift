<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue';
// import { Switch } from '@headlessui/vue';
// import { ListGroup, ListGroupItem, Button } from 'flowbite-vue';
import { ref } from 'vue';
import { white } from 'tailwindcss/colors';
const switchValue = ref<boolean>(false);

const loading = ref<boolean>(false);

const currentTab = ref<string>('');
function clicked() {
  console.log('clicked');
}
function hovered() {
  console.log('hovered');
}
</script>

<template>
  <header>
    <img
      alt="Vue logo"
      class="logo"
      src="@/assets/logo.svg"
      width="125"
      height="125"
    >

    <div class="wrapper">
      <HelloWorld
        class=""
        msg="You did it! Hurrray"
      />
      <!-- <Switch v-model="switchValue">
        Test
        {{ switchValue }}
      </Switch> -->
      <!-- <Button
        color="yellow"
        outline
      >
        Flowbite button
      </Button> -->
      <!-- <button
        type="button"
        class="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
      >
        Light
      </button>
      <button class="text-white bg-primary hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-primary dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">
        Dark
      </button> -->
      <nav>
        <!-- <ListGroup class="m-4">
          <ListGroupItem @click="clicked">
            Test
          </ListGroupItem>
          <ListGroupItem
            @mousemove="hovered"
          >
            <template
              #default
            >
              Mooore info
            </template>
          </ListGroupItem>
        </ListGroup> -->
        <!-- <TestComponent msg="yeees" /> -->
        <div class="grid grid-cols-3">
          <XTabGroup
            v-model="currentTab"
            variant="line"
            class="m-12"
            color="warning"
          >
            <XTab
              value="test"
              to="/test"
            />
            <XTab
              value="home"
              to="/"
            />
            <XTab
              value="about"
              to="/about"
            />
          </XTabGroup>
        </div>
        <div class="bg-sky-800">
          <XButton color="teal">
            Button
          </XButton>
          <button class="p-2 m-4 border rounded-md border-cyan-400 bg-cyan-600 text-cyan-100 active:bg-cyan-500">
            Vanlig knapp
          </button>
        </div>
        <RouterLink to="/test">
          TestRoute
        </RouterLink>
        <RouterLink to="/">
          Home
        </RouterLink>
        <RouterLink to="/about">
          About
        </RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
</style>
