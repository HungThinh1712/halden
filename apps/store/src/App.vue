<script setup lang="ts">
import SiteFooter from './components/SiteFooter.vue'
import SiteHeader from './components/SiteHeader.vue'
</script>

<template>
  <a class="skip" href="#content">Skip to content</a>
  <SiteHeader />
  <main id="content">
    <RouterView />
  </main>
  <SiteFooter />
</template>
