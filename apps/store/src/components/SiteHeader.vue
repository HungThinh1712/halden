<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'

const open = ref(false)
const route = useRoute()
const auth = useAuthStore()
const cart = useCartStore()

watch(() => route.fullPath, () => {
  open.value = false
})
</script>

<template>
  <header class="site-header">
    <div class="wrap utility">
      <p>Complimentary shipping on orders over $250</p>
      <p>Showroom open Tue–Sat, 11–6</p>
    </div>
    <div class="wrap bar">
      <router-link class="mark" to="/">Halden</router-link>
      <nav class="nav" :class="{ open }" aria-label="Primary">
        <router-link to="/shop">Shop</router-link>
        <router-link to="/shop?category=seating">Seating</router-link>
        <router-link to="/shop?category=tables">Tables</router-link>
        <router-link to="/shop?category=textiles">Textiles</router-link>
        <router-link to="/about">Workshop</router-link>
        <router-link class="mobile-only" to="/account">{{ auth.signedIn ? auth.firstName : 'Account' }}</router-link>
        <router-link class="mobile-only" to="/cart">Bag<span v-if="cart.count" class="bag-count">{{ cart.count }}</span></router-link>
      </nav>
      <div class="end">
        <div class="tools">
          <router-link to="/account">{{ auth.signedIn ? auth.firstName : 'Account' }}</router-link>
          <router-link to="/cart">Bag<span v-if="cart.count" class="bag-count">{{ cart.count }}</span></router-link>
        </div>
        <button class="menu-btn" type="button" :aria-expanded="open" @click="open = !open">
          {{ open ? 'Close' : 'Menu' }}
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.mobile-only { display: none; }
.end { display: flex; justify-content: flex-end; align-items: center; }
@media (max-width: 860px) {
  .mobile-only { display: inline; }
}
</style>
