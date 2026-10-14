<script setup lang="ts">
import { formatDate, messageOf, money, orderNumber } from '@shared/format'
import type { Order, Product, Subscriber } from '@shared/types'
import { computed, onMounted, ref } from 'vue'
import { api } from '../lib/api'

const orders = ref<Order[]>([])
const products = ref<Product[]>([])
const subscribers = ref<Subscriber[]>([])
const error = ref('')
const loading = ref(true)

const openOrders = computed(() => orders.value.filter((order) => order.status === 'pending' || order.status === 'paid'))
const revenue = computed(() => orders.value.filter((order) => order.status !== 'cancelled').reduce((sum, order) => sum + order.total_cents, 0))
const lowStock = computed(() => products.value.filter((product) => product.published && product.stock <= 3))
const recent = computed(() => orders.value.slice(0, 5))

onMounted(async () => {
  try {
    ;[orders.value, products.value, subscribers.value] = await Promise.all([
      api.listOrders(),
      api.listProducts(true),
      api.listSubscribers(),
    ])
  } catch (err) {
    error.value = messageOf(err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <p class="eyebrow">Today</p>
    <h1>Workshop</h1>
    <p v-if="loading" class="quiet page-kicker">Loading the desk…</p>
    <p v-else-if="error" class="alert">{{ error }}</p>
    <template v-else>
      <section class="stats">
        <div class="stat"><span class="label">Open orders</span><b class="num">{{ openOrders.length }}</b></div>
        <div class="stat"><span class="label">Order value</span><b class="num">{{ money(revenue) }}</b></div>
        <div class="stat"><span class="label">Pieces</span><b class="num">{{ products.filter((item) => item.published).length }}</b></div>
        <div class="stat"><span class="label">Studio notes</span><b class="num">{{ subscribers.length }}</b></div>
      </section>
      <div class="toolbar">
        <h2 style="font-size: 32px">Recent orders</h2>
        <router-link to="/orders">All orders</router-link>
      </div>
      <div class="table-wrap">
        <table class="data">
          <thead>
            <tr><th>Order</th><th>Customer</th><th>Status</th><th>Total</th></tr>
          </thead>
          <tbody>
            <tr v-for="order in recent" :key="order.id">
              <td><router-link class="rowlink" :to="`/orders/${order.id}`">{{ orderNumber(order.id) }}</router-link><div class="quiet">{{ formatDate(order.created_at) }}</div></td>
              <td>{{ order.full_name }}<div class="quiet">{{ order.email }}</div></td>
              <td><span class="state" :data-state="order.status">{{ order.status }}</span></td>
              <td class="num">{{ money(order.total_cents) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h2 style="font-size: 32px; margin: 40px 0 16px">Short stock</h2>
      <p v-if="!lowStock.length" class="quiet">Nothing is at three or below.</p>
      <div v-else class="table-wrap">
        <table class="data">
          <thead><tr><th>Piece</th><th>SKU</th><th>Stock</th></tr></thead>
          <tbody>
            <tr v-for="product in lowStock" :key="product.id">
              <td><router-link class="rowlink" :to="`/products/${product.id}`">{{ product.name }}</router-link></td>
              <td>{{ product.sku }}</td>
              <td class="num" :class="{ low: product.stock === 0 }">{{ product.stock }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
