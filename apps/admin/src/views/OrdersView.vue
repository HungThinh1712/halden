<script setup lang="ts">
import { formatDate, messageOf, money, orderNumber } from '@shared/format'
import type { Order, OrderStatus } from '@shared/types'
import { computed, onMounted, ref } from 'vue'
import { api } from '../lib/api'

const orders = ref<Order[]>([])
const status = ref<OrderStatus | 'all'>('all')
const error = ref('')
const loading = ref(true)

const visible = computed(() => orders.value.filter((order) => status.value === 'all' || order.status === status.value))

onMounted(async () => {
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
  <div>
    <p class="eyebrow">Desk</p>
    <h1>Orders</h1>
    <div class="toolbar">
      <div class="filters" style="display: flex; gap: 16px">
        <button v-for="item in ['all', 'pending', 'paid', 'fulfilled', 'cancelled']" :key="item" class="btn-text" type="button" :style="{ color: status === item ? 'var(--ink)' : '' }" @click="status = item as OrderStatus | 'all'">
          {{ item }}
        </button>
      </div>
    </div>
    <p v-if="loading" class="quiet">Loading orders…</p>
    <p v-else-if="error" class="alert">{{ error }}</p>
    <div v-else class="table-wrap">
      <table class="data">
        <thead>
          <tr><th>Order</th><th>Customer</th><th>Ship to</th><th>Status</th><th>Total</th></tr>
        </thead>
        <tbody>
          <tr v-for="order in visible" :key="order.id">
            <td><router-link class="rowlink" :to="`/orders/${order.id}`">{{ orderNumber(order.id) }}</router-link><div class="quiet">{{ formatDate(order.created_at) }}</div></td>
            <td>{{ order.full_name }}<div class="quiet">{{ order.email }}</div></td>
            <td>{{ order.city }}, {{ order.region }}</td>
            <td><span class="state" :data-state="order.status">{{ order.status }}</span></td>
            <td class="num">{{ money(order.total_cents) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!visible.length" class="quiet" style="margin-top: 16px">No orders in this status.</p>
    </div>
  </div>
</template>
