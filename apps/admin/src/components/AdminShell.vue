<script setup lang="ts">
import { useRouter } from 'vue-router'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

async function signOut() {
  await auth.signOut()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="shell">
    <aside class="side">
      <router-link class="mark" to="/">
        Halden
        <small>Workshop</small>
      </router-link>
      <nav aria-label="Workshop">
        <router-link to="/">Overview</router-link>
        <router-link to="/products">Pieces</router-link>
        <router-link to="/orders">Orders</router-link>
        <router-link to="/categories">Departments</router-link>
        <router-link to="/customers">Customers</router-link>
      </nav>
      <div class="side-foot">
        <p>{{ auth.profile?.email }}</p>
        <p v-if="!api.live">Preview data, stored in this browser.</p>
        <button type="button" @click="signOut">Sign out</button>
      </div>
    </aside>
    <div class="content">
      <slot />
    </div>
  </div>
</template>
