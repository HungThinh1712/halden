<script setup lang="ts">
import { money } from '@shared/format'
import type { Product } from '@shared/types'
import { ref } from 'vue'
import { useCartStore } from '../stores/cart'

const props = defineProps<{ product: Product }>()
const cart = useCartStore()
const label = ref('Add to bag')

function add() {
  const result = cart.add(props.product, 1)
  label.value = result === 'gone' ? 'Out of stock' : result === 'capped' ? 'Bag is at the limit' : 'Added'
  window.setTimeout(() => {
    label.value = 'Add to bag'
  }, 1400)
}
</script>

<template>
  <article class="card">
    <div class="card-media">
      <router-link class="card-link" :to="`/product/${product.slug}`">
        <img class="primary" :src="product.image_url" :alt="product.image_alt" />
        <img v-if="product.hover_image_url" class="alt" :src="product.hover_image_url" alt="" />
      </router-link>
      <span v-if="product.stock === 0" class="flag">Out of stock</span>
      <button v-else class="card-quick" type="button" @click="add">{{ label }}</button>
    </div>
    <div class="card-meta">
      <div>
        <h3><router-link :to="`/product/${product.slug}`">{{ product.name }}</router-link></h3>
        <p class="material">{{ product.material }}</p>
      </div>
      <p class="price num">
        <span v-if="product.compare_at_cents && product.compare_at_cents > product.price_cents" class="compare">{{ money(product.compare_at_cents) }}</span>
        {{ money(product.price_cents) }}
      </p>
    </div>
  </article>
</template>
