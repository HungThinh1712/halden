import type { Session } from '@supabase/supabase-js'
import type { Profile } from '@shared/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'

const SESSION_KEY = 'halden.demo.session'

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const useAuthStore = defineStore('auth', () => {
  const profile = ref<Profile | null>(null)
  const ready = ref(false)
  const signedIn = computed(() => Boolean(profile.value))
  const firstName = computed(() => {
    const name = profile.value?.full_name?.trim()
    if (name) return name.split(' ')[0]
    return profile.value?.email?.split('@')[0] ?? 'Account'
  })

  function readDemo() {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as Profile
    } catch {
      return null
    }
  }

  function writeDemo(value: Profile | null) {
    if (!value) localStorage.removeItem(SESSION_KEY)
    else localStorage.setItem(SESSION_KEY, JSON.stringify(value))
  }

  async function applySession(session: Session | null) {
    profile.value = session ? await api.getProfile(session.user.id) : null
  }

  async function init() {
    if (ready.value) return
    if (!supabase) {
      profile.value = readDemo()
      ready.value = true
      return
    }
    const { data } = await supabase.auth.getSession()
    await applySession(data.session)
    supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session)
    })
    ready.value = true
  }

  async function demoAuth(email: string, password: string, fullName?: string) {
    if (password.length < 6) throw new Error('Use at least 6 characters.')
    const normalized = email.trim().toLowerCase()
    if (!validEmail(normalized)) throw new Error('Enter a valid email address.')
    const role = normalized === 'workshop@halden.test' ? 'admin' : 'customer'
    const existing = (await api.listCustomers()).find((item) => item.email?.toLowerCase() === normalized)
    if (existing) {
      const next = { ...existing, role: normalized === 'workshop@halden.test' ? role : existing.role }
      if (fullName?.trim()) {
        await api.updateProfile(existing.id, fullName.trim())
        next.full_name = fullName.trim()
      }
      profile.value = next
      writeDemo(next)
      return 'signed-in' as const
    }
    const created: Profile = {
      id: crypto.randomUUID(),
      email: normalized,
      full_name: fullName?.trim() || normalized.split('@')[0],
      role,
      created_at: new Date().toISOString(),
    }
    profile.value = await api.ensureDemoProfile(created)
    writeDemo(profile.value)
    return 'signed-in' as const
  }

  async function signIn(email: string, password: string) {
    if (!supabase) return demoAuth(email, password)
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      if (/invalid login/i.test(error.message)) throw new Error('Email or password is incorrect.')
      throw new Error(error.message)
    }
    await applySession(data.session)
    return 'signed-in' as const
  }

  async function signUp(email: string, password: string, fullName: string) {
    if (fullName.trim().length < 2) throw new Error('Enter your name.')
    if (!supabase) return demoAuth(email, password, fullName)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    })
    if (error) throw new Error(error.message)
    if (!data.session) return 'confirm' as const
    await applySession(data.session)
    return 'signed-in' as const
  }

  async function signOut() {
    if (!supabase) {
      profile.value = null
      writeDemo(null)
      return
    }
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
    profile.value = null
  }

  async function updateName(fullName: string) {
    if (!profile.value) return
    await api.updateProfile(profile.value.id, fullName)
    profile.value = { ...profile.value, full_name: fullName.trim() }
    if (!supabase) writeDemo(profile.value)
  }

  return { profile, ready, signedIn, firstName, init, signIn, signUp, signOut, updateName }
})
