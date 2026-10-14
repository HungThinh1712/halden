import type { Session } from '@supabase/supabase-js'
import type { Profile } from '@shared/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'

const SESSION_KEY = 'halden.admin.session'

export const useAuthStore = defineStore('auth', () => {
  const profile = ref<Profile | null>(null)
  const ready = ref(false)
  const isAdmin = computed(() => profile.value?.role === 'admin')

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

  async function signIn(email: string, password: string) {
    if (password.length < 6) throw new Error('Use at least 6 characters.')
    if (!supabase) {
      const normalized = email.trim().toLowerCase()
      if (normalized !== 'workshop@halden.test') {
        throw new Error('This account does not have workshop access.')
      }
      const created: Profile = {
        id: crypto.randomUUID(),
        email: normalized,
        full_name: 'Workshop',
        role: 'admin',
        created_at: new Date().toISOString(),
      }
      const existing = (await api.listCustomers()).find((item) => item.email?.toLowerCase() === normalized)
      profile.value = existing ? { ...existing, role: 'admin' } : await api.ensureDemoProfile(created)
      if (existing && existing.role !== 'admin') await api.setRole(existing.id, 'admin')
      writeDemo(profile.value)
      return
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      if (/invalid login/i.test(error.message)) throw new Error('Email or password is incorrect.')
      throw new Error(error.message)
    }
    await applySession(data.session)
    if (profile.value?.role !== 'admin') {
      await signOut()
      throw new Error('This account does not have workshop access.')
    }
  }

  async function signOut() {
    if (!supabase) {
      profile.value = null
      writeDemo(null)
      return
    }
    await supabase.auth.signOut()
    profile.value = null
  }

  return { profile, ready, isAdmin, init, signIn, signOut }
})
