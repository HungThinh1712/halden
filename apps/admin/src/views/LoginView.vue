<script setup lang="ts">
import { messageOf } from '@shared/format'
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const error = ref(typeof route.query.error === 'string' ? 'This account does not have workshop access.' : '')
const busy = ref(false)
const form = reactive({ email: api.live ? '' : 'workshop@halden.test', password: '' })

async function submit() {
  error.value = ''
  busy.value = true
  try {
    await auth.signIn(form.email, form.password)
    const next = typeof route.query.next === 'string' ? route.query.next : '/'
    await router.push(next)
  } catch (err) {
    error.value = messageOf(err)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section class="login">
    <div class="login-panel">
      <div>
        <p class="label">Halden</p>
        <h1>Workshop desk.</h1>
      </div>
      <p>Orders, stock, and the pieces currently for sale.</p>
    </div>
    <form class="login-form stack" @submit.prevent="submit">
      <h2 style="font-size: 42px">Sign in</h2>
      <label class="field"><span>Email</span><input v-model="form.email" type="email" required autocomplete="username" /></label>
      <label class="field"><span>Password</span><input v-model="form.password" type="password" required minlength="6" autocomplete="current-password" /></label>
      <p v-if="error" class="alert">{{ error }}</p>
      <button class="btn" type="submit" :disabled="busy">{{ busy ? 'Signing in…' : 'Enter' }}</button>
      <p v-if="!api.live" class="hint">Preview login: workshop@halden.test and any password of at least 6 characters.</p>
    </form>
  </section>
</template>
