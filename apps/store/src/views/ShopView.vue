<script setup lang="ts">
import { messageOf } from '@shared/format'
import type { Category, Product } from '@shared/types'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProductCard from '../components/ProductCard.vue'
import { api } from '../lib/api'

const route = useRoute()
const router = useRouter()
const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const error = ref('')
const loading = ref(true)
const sort = ref('featured')

const category = computed(() => (typeof route.query.category === 'string' ? route.query.category : ''))
const search = computed(() => (typeof route.query.q === 'string' ? route.query.q : ''))

const visible = computed(() => {
  const query = search.value.trim().toLowerCase()
  const filtered = products.value.filter((product) => {
    const inCategory = !category.value || product.category_slug === category.value
    const inSearch = !query || `${product.name} ${product.material} ${product.summary}`.toLowerCase().includes(query)
    return inCategory && inSearch
  })
  const copy = [...filtered]
  if (sort.value === 'price-asc') copy.sort((a, b) => a.price_cents - b.price_cents)
  else if (sort.value === 'price-desc') copy.sort((a, b) => b.price_cents - a.price_cents)
  else if (sort.value === 'name') copy.sort((a, b) => a.name.localeCompare(b.name))
  else copy.sort((a, b) => Number(b.featured) - Number(a.featured) || b.created_at.localeCompare(a.created_at))
  return copy
})

const currentCategory = computed(() => categories.value.find((item) => item.slug === category.value))

function setCategory(slug: string) {
  const query = { ...route.query }
  if (slug) query.category = slug
  else delete query.category
  void router.replace({ query })
}

function setSearch(value: string) {
  const query = { ...route.query }
  if (value) query.q = value
  else delete query.q
  void router.replace({ query })
}

onMounted(async () => {
  try {
    ;[products.value, categories.value] = await Promise.all([api.listProducts(), api.listCategories()])
  } catch (err) {
    error.value = messageOf(err)
  } finally {
    loading.value = false
  }
})

function setTitle() {
  document.title = currentCategory.value ? `${currentCategory.value.name} · Halden` : 'Shop · Halden'
}

onMounted(setTitle)
watch([category, categories], setTitle)
</script>

<template>
  <div class="wrap page">
    <div class="page-head">
      <div>
        <p class="eyebrow">The collection</p>
        <h1>{{ currentCategory?.name ?? 'Shop' }}</h1>
      </div>
      <p class="quiet" style="max-width: 36ch">{{ currentCategory?.description ?? 'Furniture and objects currently in the workshop, plus pieces we can make to order.' }}</p>
    </div>

    <div class="toolbar">
      <div class="filters">
        <button type="button" :class="{ on: !category }" @click="setCategory('')">All</button>
        <button v-for="item in categories" :key="item.id" type="button" :class="{ on: category === item.slug }" @click="setCategory(item.slug)">
          {{ item.name }}
        </button>
      </div>
      <div style="display: flex; gap: 18px; align-items: center; flex-wrap: wrap">
        <input class="line-input search" :value="search" type="search" placeholder="Search" aria-label="Search the collection" @input="setSearch(($event.target as HTMLInputElement).value)" />
        <label class="quiet">
          Sort
          <select v-model="sort" aria-label="Sort">
            <option value="featured">Showroom</option>
            <option value="price-asc">Price, low</option>
            <option value="price-desc">Price, high</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>
    </div>

    <p v-if="loading" class="quiet">Loading pieces…</p>
    <p v-else-if="error" class="alert">{{ error }}</p>
    <div v-else-if="visible.length" class="grid">
      <ProductCard v-for="product in visible" :key="product.id" :product="product" />
    </div>
    <div v-else class="empty">
      <h2>Nothing in this cut of the catalog.</h2>
      <p class="quiet" style="margin: 12px 0 20px">Try another department, or clear the search.</p>
      <button class="btn-ghost" type="button" @click="setCategory(''); setSearch('')">Clear filters</button>
    </div>
  </div>
</template>

<style scoped>
select {
  margin-left: 8px;
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--line-strong);
  min-height: 36px;
}
</style>
