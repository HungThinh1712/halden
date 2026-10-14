<script setup lang="ts">
import { formatDate, messageOf, money, orderNumber } from '@shared/format'
import type { Order } from '@shared/types'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const auth = useAuthStore()
const order = ref<Order | null>(null)
const error = ref('')
const loading = ref(true)

onMounted(async () => {
  const id = String(route.params.id)
  try {
    const found = await api.getOrder(id)
    const owns = Boolean(found && auth.profile && (!found.user_id || found.user_id === auth.profile.id))
    order.value = owns ? found : null
    if (order.value) document.title = `${orderNumber(order.value.id)} · Halden`
  } catch (err) {
    error.value = messageOf(err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="wrap page">
    <p v-if="loading" class="quiet">Loading the order…</p>
    <p v-else-if="error" class="alert">{{ error }}</p>
    <div v-else-if="!order" class="empty">
      <h1>We can’t find that order.</h1>
      <router-link class="btn" to="/orders" style="margin-top: 20px">Your orders</router-link>
    </div>
    <template v-else>
      <div class="page-head">
        <div>
          <p class="eyebrow">{{ formatDate(order.created_at) }}</p>
          <h1>{{ orderNumber(order.id) }}</h1>
        </div>
        <p><span class="state" :data-state="order.status">{{ order.status }}</span></p>
      </div>
      <div class="split-form">
        <div>
          <article v-for="item in order.items" :key="item.id" class="summary-row" style="border-top: 1px solid var(--line); padding: 16px 0">
            <div>
              <h2 style="font-family: var(--sans); font-size: 18px; font-weight: 500; letter-spacing: 0">{{ item.name }}</h2>
              <p class="quiet">{{ item.sku }} · Qty {{ item.quantity }}</p>
            </div>
            <p class="num">{{ money(item.unit_price_cents * item.quantity) }}</p>
          </article>
        </div>
        <aside class="summary">
          <h2>Delivery</h2>
          <p>{{ order.full_name }}</p>
          <p>{{ order.address_line }}</p>
          <p>{{ order.city }}, {{ order.region }} {{ order.postal_code }}</p>
          <p>{{ order.country }}</p>
          <p v-if="order.notes" class="hint">{{ order.notes }}</p>
          <div class="summary-row" style="margin-top: 16px"><span>Subtotal</span><span class="num">{{ money(order.subtotal_cents) }}</span></div>
          <div class="summary-row"><span>Shipping</span><span class="num">{{ order.shipping_cents === 0 ? 'Complimentary' : money(order.shipping_cents) }}</span></div>
          <div class="summary-row total"><span>Total</span><span class="num">{{ money(order.total_cents) }}</span></div>
          <p class="hint">We’ll write to {{ order.email }} to confirm timing and payment.</p>
        </aside>
      </div>
    </template>
  </div>
</template>
