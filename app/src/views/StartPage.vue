<template>
  <button class="btn">
    Fortsätt som gäst
  </button>
  <button
    @click="$router.replace({name: 'login'})"
    class="btn btn-primary"
  >
    Logga in
  </button>
</template>
