<script setup lang="ts">
import { centsToInput, dollarsToCents, messageOf, slugify } from '@shared/format'
import type { Category, ProductInput } from '@shared/types'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../lib/api'

const route = useRoute()
const router = useRouter()
const categories = ref<Category[]>([])
const error = ref('')
const saving = ref(false)
const uploading = ref(false)
const slugDirty = ref(false)
const loading = ref(true)
const isNew = computed(() => route.params.id === 'new')

const form = reactive({
  name: '',
  slug: '',
  category_id: '',
  summary: '',
  description: '',
  price: '',
  compare: '',
  sku: '',
  stock: '0',
  material: '',
  dimensions: '',
  lead_time: '',
  featured: false,
  published: true,
  image_url: '',
  image_alt: '',
  hover_image_url: '',
})

watch(() => form.name, (name) => {
  if (!slugDirty.value) form.slug = slugify(name)
})

onMounted(async () => {
  try {
    categories.value = await api.listCategories()
    if (!isNew.value) {
      const products = await api.listProducts(true)
      const product = products.find((item) => item.id === route.params.id)
      if (!product) throw new Error('That piece is not in the catalog.')
      form.name = product.name
      form.slug = product.slug
      form.category_id = product.category_id ?? ''
      form.summary = product.summary
      form.description = product.description
      form.price = centsToInput(product.price_cents)
      form.compare = centsToInput(product.compare_at_cents)
      form.sku = product.sku
      form.stock = String(product.stock)
      form.material = product.material
      form.dimensions = product.dimensions
      form.lead_time = product.lead_time
      form.featured = product.featured
      form.published = product.published
      form.image_url = product.image_url
      form.image_alt = product.image_alt
      form.hover_image_url = product.hover_image_url ?? ''
      slugDirty.value = true
    }
  } catch (err) {
    error.value = messageOf(err)
  } finally {
    loading.value = false
  }
})

function payload(): ProductInput {
  const price = dollarsToCents(form.price)
  const compare = form.compare.trim() ? dollarsToCents(form.compare) : null
  const stock = Number(form.stock)
  if (price === null) throw new Error('Enter a valid price.')
  if (form.compare.trim() && compare === null) throw new Error('Enter a valid compare-at price.')
  if (!Number.isInteger(stock) || stock < 0) throw new Error('Stock needs to be a whole number.')
  return {
    category_id: form.category_id || null,
    name: form.name,
    slug: slugify(form.slug),
    summary: form.summary,
    description: form.description,
    price_cents: price,
    compare_at_cents: compare,
    sku: form.sku,
    stock,
    material: form.material,
    dimensions: form.dimensions,
    lead_time: form.lead_time,
    featured: form.featured,
    published: form.published,
    image_url: form.image_url,
    image_alt: form.image_alt || form.name,
    hover_image_url: form.hover_image_url || null,
  }
}

async function save() {
  error.value = ''
  saving.value = true
  try {
    await api.saveProduct(payload(), isNew.value ? undefined : String(route.params.id))
    await router.push('/products')
  } catch (err) {
    error.value = messageOf(err)
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (isNew.value) return
  if (!window.confirm(`Delete ${form.name || 'this piece'}? Past orders keep the name.`)) return
  try {
    await api.deleteProduct(String(route.params.id))
    await router.push('/products')
  } catch (err) {
    error.value = messageOf(err)
  }
}

async function onFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = true
  error.value = ''
  try {
    form.image_url = await api.uploadImage(file)
  } catch (err) {
    error.value = messageOf(err)
  } finally {
    uploading.value = false
    input.value = ''
  }
}
</script>

<template>
  <div>
    <p class="eyebrow">Catalog</p>
    <h1>{{ isNew ? 'New piece' : 'Edit piece' }}</h1>
    <p v-if="loading" class="quiet page-kicker">Loading…</p>
    <form v-else class="form-grid" @submit.prevent="save">
      <label class="field"><span>Name</span><input v-model="form.name" required /></label>
      <label class="field"><span>URL slug</span><input v-model="form.slug" required @input="slugDirty = true" /></label>
      <label class="field"><span>Department</span>
        <select v-model="form.category_id">
          <option value="">None</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
        </select>
      </label>
      <label class="field"><span>SKU</span><input v-model="form.sku" required /></label>
      <label class="field wide"><span>Summary</span><input v-model="form.summary" required /></label>
      <label class="field wide"><span>Description</span><textarea v-model="form.description" required /></label>
      <label class="field"><span>Price (USD)</span><input v-model="form.price" inputmode="decimal" required /></label>
      <label class="field"><span>Compare-at (USD)</span><input v-model="form.compare" inputmode="decimal" /></label>
      <label class="field"><span>Stock</span><input v-model="form.stock" inputmode="numeric" required /></label>
      <label class="field"><span>Lead time</span><input v-model="form.lead_time" /></label>
      <label class="field"><span>Material</span><input v-model="form.material" /></label>
      <label class="field"><span>Dimensions</span><input v-model="form.dimensions" /></label>
      <label class="field wide"><span>Image URL</span><input v-model="form.image_url" type="url" required /></label>
      <label class="field wide"><span>Second image URL</span><input v-model="form.hover_image_url" type="url" /></label>
      <label class="field wide"><span>Image description</span><input v-model="form.image_alt" /></label>
      <label class="field"><span>Upload</span><input type="file" accept="image/*" :disabled="uploading" @change="onFile" /></label>
      <div class="field">
        <span>Preview</span>
        <img v-if="form.image_url" class="preview" :src="form.image_url" alt="" />
      </div>
      <label class="check"><input v-model="form.published" type="checkbox" /> Published on the shop</label>
      <label class="check"><input v-model="form.featured" type="checkbox" /> Show in the showroom row</label>
      <p v-if="error" class="alert wide">{{ error }}</p>
      <div class="wide" style="display: flex; gap: 16px; align-items: center">
        <button class="btn" type="submit" :disabled="saving">{{ saving ? 'Saving…' : 'Save piece' }}</button>
        <button v-if="!isNew" class="btn-text" type="button" @click="remove">Delete</button>
        <router-link class="btn-text" to="/products">Cancel</router-link>
      </div>
    </form>
  </div>
</template>
