<script setup lang="ts">
import { formatDate, messageOf } from '@shared/format'
import type { Profile } from '@shared/types'
import { onMounted, ref } from 'vue'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const customers = ref<Profile[]>([])
const error = ref('')
const loading = ref(true)

async function load() {
  customers.value = await api.listCustomers()
}

onMounted(async () => {
  try {
    await load()
  } catch (err) {
    error.value = messageOf(err)
  } finally {
    loading.value = false
  }
})

async function toggle(person: Profile) {
  const next = person.role === 'admin' ? 'customer' : 'admin'
  if (person.id === auth.profile?.id && next === 'customer') {
    if (!window.confirm('Remove your own workshop access?')) return
  }
  error.value = ''
  try {
    await api.setRole(person.id, next)
    await load()
  } catch (err) {
    error.value = messageOf(err)
  }
}
</script>

<template>
  <div>
    <p class="eyebrow">Accounts</p>
    <h1>Customers</h1>
    <p v-if="loading" class="quiet page-kicker">Loading accounts…</p>
    <p v-else-if="error" class="alert">{{ error }}</p>
    <div v-else class="table-wrap" style="margin-top: 24px">
      <table class="data">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th></th></tr></thead>
        <tbody>
          <tr v-for="person in customers" :key="person.id">
            <td>{{ person.full_name || '—' }}</td>
            <td>{{ person.email }}</td>
            <td>{{ person.role }}</td>
            <td>{{ formatDate(person.created_at) }}</td>
            <td>
              <button class="btn-text" type="button" @click="toggle(person)">
                {{ person.role === 'admin' ? 'Make customer' : 'Make admin' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
