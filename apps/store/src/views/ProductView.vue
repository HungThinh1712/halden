<script setup lang="ts">
import { messageOf, money } from '@shared/format'
import type { Product } from '@shared/types'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ProductCard from '../components/ProductCard.vue'
import QuantityInput from '../components/QuantityInput.vue'
import { api } from '../lib/api'
import { useCartStore } from '../stores/cart'

const route = useRoute()
const cart = useCartStore()
const product = ref<Product | null>(null)
const related = ref<Product[]>([])
const loading = ref(true)
const error = ref('')
const qty = ref(1)
const note = ref('')
const active = ref('')

const images = computed(() => {
  if (!product.value) return []
  return [product.value.image_url, product.value.hover_image_url].filter((src): src is string => Boolean(src))
})

const maxQty = computed(() => Math.max(1, Math.min(8, product.value?.stock ?? 1)))

async function load(slug: string) {
  loading.value = true
  error.value = ''
  note.value = ''
  qty.value = 1
  try {
    const found = await api.getProduct(slug)
    product.value = found
    active.value = found?.image_url ?? ''
    if (found) {
      document.title = `${found.name} · Halden`
      const all = await api.listProducts()
      related.value = all.filter((item) => item.category_slug === found.category_slug && item.id !== found.id).slice(0, 4)
    }
  } catch (err) {
    error.value = messageOf(err)
  } finally {
    loading.value = false
  }
}

function add() {
  if (!product.value) return
  const result = cart.add(product.value, qty.value)
  note.value = result === 'gone'
    ? 'This piece is out of stock.'
    : result === 'capped'
      ? 'Your bag already has as many as we can spare.'
      : 'Added to your bag.'
}

watch(() => route.params.slug, (slug) => {
  if (typeof slug === 'string') void load(slug)
}, { immediate: true })
</script>

<template>
  <div class="wrap page">
    <p v-if="loading" class="quiet">Loading…</p>
    <p v-else-if="error" class="alert">{{ error }}</p>
    <div v-else-if="!product" class="empty">
      <h1>This piece is no longer listed.</h1>
      <router-link class="btn" to="/shop" style="margin-top: 20px">Back to the shop</router-link>
    </div>
    <template v-else>
      <article class="pdp">
        <div class="pdp-gallery">
          <img class="main" :src="active" :alt="product.image_alt" />
          <div v-if="images.length > 1" class="thumbs">
            <button v-for="src in images" :key="src" type="button" :class="{ on: src === active }" @click="active = src">
              <img :src="src" alt="" />
            </button>
          </div>
        </div>
        <div class="pdp-info">
          <p class="eyebrow">{{ product.category_name }} · {{ product.sku }}</p>
          <h1>{{ product.name }}</h1>
          <p class="price-row num">
            <span v-if="product.compare_at_cents && product.compare_at_cents > product.price_cents" class="compare">{{ money(product.compare_at_cents) }}</span>
            {{ money(product.price_cents) }}
          </p>
          <p class="summary">{{ product.summary }}</p>
          <div class="buy">
            <QuantityInput :value="qty" :max="maxQty" @change="qty = $event" />
            <button class="btn" type="button" :disabled="product.stock < 1" @click="add">
              {{ product.stock < 1 ? 'Out of stock' : 'Add to bag' }}
            </button>
          </div>
          <p class="stock-note">
            <template v-if="product.stock === 0">We’ll list it again when the next batch is in.</template>
            <template v-else-if="product.stock < 4">{{ product.stock }} in the workshop. {{ product.lead_time }}.</template>
            <template v-else>{{ product.lead_time }}.</template>
          </p>
          <p v-if="note" class="quiet" style="margin-top: 8px">{{ note }} <router-link to="/cart" style="text-decoration: underline; text-underline-offset: 3px">View bag</router-link></p>
          <div class="facts">
            <details open>
              <summary>Description</summary>
              <p>{{ product.description }}</p>
            </details>
            <details>
              <summary>Material and size</summary>
              <p>{{ product.material }}. {{ product.dimensions }}.</p>
            </details>
            <details>
              <summary>Shipping</summary>
              <p>Complimentary shipping over $250 inside the United States. Large tables ship freight, and we confirm the delivery window after the order. Nothing is charged until the workshop confirms the piece.</p>
            </details>
          </div>
        </div>
      </article>
      <section v-if="related.length" class="related">
        <div class="section-head">
          <h2>Also in {{ product.category_name.toLowerCase() }}</h2>
        </div>
        <div class="grid">
          <ProductCard v-for="item in related" :key="item.id" :product="item" />
        </div>
      </section>
    </template>
  </div>
</template>
