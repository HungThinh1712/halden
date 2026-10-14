<script setup lang="ts">
import { formatDate, messageOf, money, orderNumber } from '@shared/format'
import type { Order } from '@shared/types'
import { computed, onMounted, ref } from 'vue'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const orders = ref<Order[]>([])
const error = ref('')
const loading = ref(true)

const mine = computed(() => orders.value.filter((order) => order.user_id === auth.profile?.id))

onMounted(async () => {
  if (!auth.profile) {
    loading.value = false
    return
  }
  try {
    orders.value = await api.listOrders()
  } catch (err) {
    error.value = messageOf(err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="wrap page">
    <div class="page-head">
      <h1>Orders</h1>
    </div>
    <div v-if="!auth.signedIn" class="empty">
      <p>Sign in to see orders placed with this account.</p>
      <router-link class="btn" to="/account?next=/orders" style="margin-top: 20px">Sign in</router-link>
    </div>
    <p v-else-if="loading" class="quiet">Loading orders…</p>
    <p v-else-if="error" class="alert">{{ error }}</p>
    <div v-else-if="!mine.length" class="empty">
      <p>No orders yet.</p>
      <router-link class="btn" to="/shop" style="margin-top: 20px">Browse the shop</router-link>
    </div>
    <div v-else>
      <router-link v-for="order in mine" :key="order.id" class="order-block" :to="`/orders/${order.id}`">
        <div>
          <h2>{{ orderNumber(order.id) }}</h2>
          <p class="quiet">{{ formatDate(order.created_at) }} · {{ order.items.length }} {{ order.items.length === 1 ? 'line' : 'lines' }}</p>
        </div>
        <p><span class="state" :data-state="order.status">{{ order.status }}</span></p>
        <p class="num">{{ money(order.total_cents) }}</p>
      </router-link>
    </div>
  </div>
</template>
