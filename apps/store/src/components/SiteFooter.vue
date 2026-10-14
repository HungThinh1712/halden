<script setup lang="ts">
import { messageOf } from '@shared/format'
import { ref } from 'vue'
import { api } from '../lib/api'

const email = ref('')
const note = ref('')
const sending = ref(false)

async function submit() {
  note.value = ''
  sending.value = true
  try {
    await api.subscribe(email.value)
    email.value = ''
    note.value = 'You’re on the list. We write a few times a year.'
  } catch (error) {
    note.value = messageOf(error)
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <footer class="site-footer">
    <div class="wrap footer-grid">
      <div>
        <p class="footer-brand">Halden</p>
        <p class="quiet" style="margin-top: 12px; max-width: 28ch">
          Seating, tables, and objects from a small shop in Portland.
        </p>
      </div>
      <div>
        <h2>Visit</h2>
        <ul>
          <li>418 NW 11th Avenue</li>
          <li>Portland, Oregon</li>
          <li>Tuesday–Saturday, 11–6</li>
        </ul>
      </div>
      <div>
        <h2>Shop</h2>
        <ul>
          <li><router-link to="/shop">All pieces</router-link></li>
          <li><router-link to="/shop?category=lighting">Lighting</router-link></li>
          <li><router-link to="/shop?category=objects">Objects</router-link></li>
          <li><router-link to="/about">Repairs</router-link></li>
        </ul>
      </div>
      <form @submit.prevent="submit">
        <h2>Studio notes</h2>
        <p class="quiet">New work, announced a few times a year.</p>
        <div class="join" style="margin-top: 12px">
          <input v-model="email" class="line-input" type="email" required autocomplete="email" placeholder="Email address" aria-label="Email address" />
          <button class="btn" type="submit" :disabled="sending">Join</button>
        </div>
        <p class="hint" role="status">{{ note }}</p>
      </form>
    </div>
    <div class="wrap legal">
      <p>© {{ new Date().getFullYear() }} Halden</p>
      <p v-if="!api.live">Preview catalog in this browser. Connect Supabase to take live orders.</p>
      <p v-else>Orders are confirmed by the workshop before payment.</p>
    </div>
  </footer>
</template>
