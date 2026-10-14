<script setup lang="ts">
import { messageOf } from '@shared/format'
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const mode = ref<'sign-in' | 'register'>('sign-in')
const error = ref('')
const info = ref('')
const busy = ref(false)
const name = ref(auth.profile?.full_name ?? '')

const form = reactive({ fullName: '', email: '', password: '' })

function nextPath() {
  return typeof route.query.next === 'string' ? route.query.next : '/orders'
}

async function submit() {
  error.value = ''
  info.value = ''
  busy.value = true
  try {
    if (mode.value === 'register') {
      const result = await auth.signUp(form.email, form.password, form.fullName)
      if (result === 'confirm') {
        info.value = 'Check your inbox to confirm the address, then sign in.'
        mode.value = 'sign-in'
        return
      }
    } else {
      await auth.signIn(form.email, form.password)
    }
    name.value = auth.profile?.full_name ?? ''
    await router.push(nextPath())
  } catch (err) {
    error.value = messageOf(err)
  } finally {
    busy.value = false
  }
}

async function saveName() {
  error.value = ''
  info.value = ''
  try {
    await auth.updateName(name.value)
    info.value = 'Name saved.'
  } catch (err) {
    error.value = messageOf(err)
  }
}

async function signOut() {
  await auth.signOut()
  await router.push('/')
}
</script>

<template>
  <section class="account">
    <div class="account-panel">
      <div>
        <p class="eyebrow" style="color: rgba(243,239,230,0.72)">418 NW 11th Avenue</p>
        <h1>Bring a tape measure. The showroom is open Tuesday to Saturday.</h1>
      </div>
      <p>Portland, 11–6. Large pieces can be seen before you order them.</p>
    </div>
    <div class="account-form">
      <template v-if="auth.signedIn && auth.profile">
        <p class="eyebrow">Account</p>
        <h2 style="font-size: 48px; margin: 8px 0 18px">Hello, {{ auth.firstName }}.</h2>
        <p class="quiet">{{ auth.profile.email }}</p>
        <form class="stack" style="margin-top: 28px" @submit.prevent="saveName">
          <label class="field"><span>Name</span><input v-model="name" required /></label>
          <button class="btn" type="submit">Save name</button>
        </form>
        <p v-if="info" class="quiet" style="margin-top: 12px">{{ info }}</p>
        <p v-if="error" class="alert">{{ error }}</p>
        <div style="display: flex; gap: 18px; margin-top: 28px; align-items: center">
          <router-link class="btn-ghost" to="/orders">Your orders</router-link>
          <button class="btn-text" type="button" @click="signOut">Sign out</button>
        </div>
        <p v-if="!api.live" class="hint">Preview mode accepts any password of at least 6 characters. It stays in this browser until you connect Supabase.</p>
      </template>
      <template v-else>
        <div class="mode-switch">
          <button type="button" :class="{ on: mode === 'sign-in' }" @click="mode = 'sign-in'; error = ''">Sign in</button>
          <button type="button" :class="{ on: mode === 'register' }" @click="mode = 'register'; error = ''">Register</button>
        </div>
        <form class="stack" @submit.prevent="submit">
          <label v-if="mode === 'register'" class="field"><span>Name</span><input v-model="form.fullName" required autocomplete="name" /></label>
          <label class="field"><span>Email</span><input v-model="form.email" type="email" required autocomplete="email" /></label>
          <label class="field"><span>Password</span><input v-model="form.password" type="password" required minlength="6" autocomplete="current-password" /></label>
          <p v-if="error" class="alert">{{ error }}</p>
          <p v-if="info" class="quiet">{{ info }}</p>
          <button class="btn" type="submit" :disabled="busy">{{ busy ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in' }}</button>
        </form>
        <p v-if="!api.live" class="hint">Preview mode keeps the account in this browser. Use any email and a password of at least 6 characters.</p>
      </template>
    </div>
  </section>
</template>
