<script setup lang="ts">
import { messageOf, money } from '@shared/format'
import type { Product } from '@shared/types'
import { computed, onMounted, ref } from 'vue'
import { api } from '../lib/api'

const products = ref<Product[]>([])
const query = ref('')
const error = ref('')
const loading = ref(true)

const visible = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle) return products.value
  return products.value.filter((product) => `${product.name} ${product.sku}`.toLowerCase().includes(needle))
})

onMounted(async () => {
  try {
    products.value = await api.listProducts(true)
  } catch (err) {
    error.value = messageOf(err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <div class="toolbar" style="margin-top: 0">
      <div>
        <p class="eyebrow">Catalog</p>
        <h1>Pieces</h1>
      </div>
      <router-link class="btn" to="/products/new">New piece</router-link>
    </div>
    <input v-model="query" class="line-input" style="max-width: 280px" type="search" placeholder="Search name or SKU" aria-label="Search pieces" />
    <p v-if="loading" class="quiet page-kicker">Loading pieces…</p>
    <p v-else-if="error" class="alert">{{ error }}</p>
    <div v-else class="table-wrap" style="margin-top: 18px">
      <table class="data">
        <thead>
          <tr><th></th><th>Name</th><th>SKU</th><th>Price</th><th>Stock</th><th>Status</th></tr>
        </thead>
        <tbody>
          <tr v-for="product in visible" :key="product.id">
            <td><img class="thumb" :src="product.image_url" alt="" /></td>
            <td><router-link class="rowlink" :to="`/products/${product.id}`">{{ product.name }}</router-link><div class="quiet">{{ product.category_name }}</div></td>
            <td>{{ product.sku }}</td>
            <td class="num">{{ money(product.price_cents) }}</td>
            <td class="num" :class="{ low: product.stock <= 3 }">{{ product.stock }}</td>
            <td>{{ product.published ? 'Published' : 'Hidden' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
