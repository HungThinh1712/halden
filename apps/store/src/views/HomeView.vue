<script setup lang="ts">
import { aboutImage, heroImage } from '@shared/catalog'
import { messageOf, money } from '@shared/format'
import type { Category, Product } from '@shared/types'
import { computed, onMounted, ref } from 'vue'
import ProductCard from '../components/ProductCard.vue'
import { api } from '../lib/api'

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const error = ref('')
const loading = ref(true)

const showroom = computed(() => {
  const preferred = ['linden-lounge-chair', 'refectory-table', 'brass-task-lamp']
  const picked = preferred
    .map((slug) => products.value.find((product) => product.slug === slug))
    .filter((product): product is Product => Boolean(product))
  if (picked.length === 3) return picked
  return products.value.slice(0, 3)
})

const chair = computed(() => products.value.find((product) => product.slug === 'linden-lounge-chair') ?? showroom.value[0])

onMounted(async () => {
  try {
    ;[products.value, categories.value] = await Promise.all([api.listProducts(), api.listCategories()])
  } catch (err) {
    error.value = messageOf(err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="wrap">
    <section class="hero">
      <div>
        <p class="eyebrow">Portland · small runs</p>
        <h1>A quieter room, piece by piece.</h1>
        <p class="lede">Seating, tables, and objects from the workshop. Solid timber, natural cloth, and finishes we can repair.</p>
        <div class="hero-actions">
          <router-link class="btn" to="/shop">Shop the edit</router-link>
          <router-link class="btn-ghost" to="/about">The workshop</router-link>
        </div>
      </div>
      <figure class="hero-figure">
        <img :src="heroImage" alt="A plaster-walled living room with a low sofa and a wooden table" width="1600" height="1280" fetchpriority="high" />
        <figcaption v-if="chair">
          <span>{{ chair.name }}</span>
          <span class="num">{{ money(chair.price_cents) }}</span>
        </figcaption>
      </figure>
    </section>

    <dl class="specs">
      <div><dt>Timber</dt><dd>Ash and white oak</dd></div>
      <div><dt>Cloth</dt><dd>Wool and washed linen</dd></div>
      <div><dt>Shop</dt><dd>Portland, Oregon</dd></div>
      <div><dt>Shipping</dt><dd>Free over $250</dd></div>
    </dl>

    <section class="section">
      <div class="section-head">
        <h2>In the showroom</h2>
        <router-link to="/shop">All pieces</router-link>
      </div>
      <p v-if="loading" class="quiet">Loading the showroom…</p>
      <p v-else-if="error" class="alert">{{ error }}</p>
      <div v-else class="product-row">
        <ProductCard v-for="product in showroom" :key="product.id" :product="product" />
      </div>
    </section>

    <section class="essay">
      <img :src="aboutImage" alt="Hands working a piece of timber at a bench" width="1200" height="1500" />
      <div>
        <p class="eyebrow">The shop</p>
        <h2>Fewer pieces. Joints we can stand behind.</h2>
        <div class="essay-copy">
          <p>Halden builds in short runs on NW 11th. Frames are solid timber, cushions unzip, and oil finishes can be renewed instead of replaced.</p>
          <p>Large pieces are made to order, usually in three to six weeks. Textiles and ceramics that are on the shelf leave in a few days.</p>
          <router-link class="btn" to="/about">Visit the workshop</router-link>
        </div>
      </div>
    </section>

    <section class="cat-index">
      <h2>Departments</h2>
      <ol>
        <li v-for="(category, index) in categories" :key="category.id">
          <router-link :to="`/shop?category=${category.slug}`">
            <span>{{ String(index + 1).padStart(2, '0') }}</span>
            <strong>{{ category.name }}</strong>
            <em>{{ category.description }}</em>
          </router-link>
        </li>
      </ol>
    </section>
  </div>
</template>
