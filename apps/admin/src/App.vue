<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AdminShell from './components/AdminShell.vue'

const route = useRoute()
const bare = computed(() => route.name === 'login')
</script>

<template>
  <RouterView v-if="bare" />
  <AdminShell v-else>
    <RouterView />
  </AdminShell>
</template>
