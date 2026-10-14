<script setup lang="ts">
import { formatDate, messageOf, money, orderNumber } from '@shared/format'
import type { Order, OrderStatus } from '@shared/types'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../lib/api'

const route = useRoute()
const order = ref<Order | null>(null)
const status = ref<OrderStatus>('pending')
const error = ref('')
const info = ref('')
const loading = ref(true)
const saving = ref(false)

onMounted(async () => {
  try {
    order.value = await api.getOrder(String(route.params.id))
    if (order.value) {
      status.value = order.value.status
      document.title = `${orderNumber(order.value.id)} · Halden`
    }
  } catch (err) {
    error.value = messageOf(err)
  } finally {
    loading.value = false
  }
})

async function save() {
  if (!order.value) return
  error.value = ''
  info.value = ''
  saving.value = true
  try {
    await api.setOrderStatus(order.value.id, status.value)
    order.value = await api.getOrder(order.value.id)
    info.value = status.value === 'cancelled' ? 'Order cancelled and stock returned.' : 'Status saved.'
  } catch (err) {
    error.value = messageOf(err)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <p v-if="loading" class="quiet">Loading the order…</p>
    <p v-else-if="error && !order" class="alert">{{ error }}</p>
    <div v-else-if="!order">
      <h1>Order not found</h1>
      <router-link to="/orders">Back to orders</router-link>
    </div>
    <template v-else>
      <p class="eyebrow">{{ formatDate(order.created_at) }}</p>
      <h1>{{ orderNumber(order.id) }}</h1>
      <div class="form-grid">
        <div>
          <p class="label">Customer</p>
          <p>{{ order.full_name }}</p>
          <p>{{ order.email }}</p>
        </div>
        <div>
          <p class="label">Ship to</p>
          <p>{{ order.address_line }}</p>
          <p>{{ order.city }}, {{ order.region }} {{ order.postal_code }}</p>
          <p>{{ order.country }}</p>
          <p v-if="order.notes" class="quiet" style="margin-top: 8px">{{ order.notes }}</p>
        </div>
        <div class="wide table-wrap">
          <table class="data">
            <thead><tr><th>Piece</th><th>SKU</th><th>Qty</th><th>Line</th></tr></thead>
            <tbody>
              <tr v-for="item in order.items" :key="item.id">
                <td>{{ item.name }}</td>
                <td>{{ item.sku }}</td>
                <td class="num">{{ item.quantity }}</td>
                <td class="num">{{ money(item.unit_price_cents * item.quantity) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="num">Subtotal {{ money(order.subtotal_cents) }}</p>
        <p class="num">Shipping {{ order.shipping_cents === 0 ? 'complimentary' : money(order.shipping_cents) }} · Total {{ money(order.total_cents) }}</p>
        <form class="wide stack" @submit.prevent="save">
          <label class="field" style="max-width: 280px">
            <span>Status</span>
            <select v-model="status">
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <p class="quiet">Cancelling returns stock. Reopening takes it again.</p>
          <p v-if="error" class="alert">{{ error }}</p>
          <p v-if="info" class="quiet">{{ info }}</p>
          <button class="btn" type="submit" :disabled="saving">{{ saving ? 'Saving…' : 'Save status' }}</button>
        </form>
      </div>
    </template>
  </div>
</template>
