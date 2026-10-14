<script setup lang="ts">
import { FREE_SHIPPING_AT, messageOf, money } from '@shared/format'
import { onMounted, ref } from 'vue'
import QuantityInput from '../components/QuantityInput.vue'
import { api } from '../lib/api'
import { useCartStore } from '../stores/cart'

const cart = useCartStore()
const error = ref('')

onMounted(async () => {
  try {
    cart.sync(await api.listProducts())
  } catch (err) {
    error.value = messageOf(err)
  }
})
</script>

<template>
  <div class="wrap page">
    <div class="page-head">
      <h1>Bag</h1>
      <p class="quiet num">{{ cart.count }} {{ cart.count === 1 ? 'piece' : 'pieces' }}</p>
    </div>
    <p v-if="error" class="alert">{{ error }}</p>
    <div v-if="!cart.items.length" class="empty">
      <p>Your bag is empty.</p>
      <router-link class="btn" to="/shop" style="margin-top: 20px">Continue shopping</router-link>
    </div>
    <div v-else class="cart-layout">
      <div>
        <article v-for="item in cart.items" :key="item.id" class="line">
          <router-link :to="`/product/${item.slug}`"><img :src="item.image_url" :alt="item.name" /></router-link>
          <div>
            <h2><router-link :to="`/product/${item.slug}`">{{ item.name }}</router-link></h2>
            <p class="quiet">{{ item.sku }}</p>
            <p v-if="item.stock < 1" class="alert">No longer available.</p>
            <p v-else-if="item.quantity > item.stock" class="alert">Only {{ item.stock }} left.</p>
            <div class="line-actions">
              <QuantityInput :value="item.quantity" :max="Math.max(1, Math.min(8, item.stock || 1))" @change="cart.setQuantity(item.id, $event)" />
              <button class="btn-text" type="button" @click="cart.remove(item.id)">Remove</button>
            </div>
          </div>
          <p class="line-price num">{{ money(item.price_cents * item.quantity) }}</p>
        </article>
      </div>
      <aside class="summary">
        <h2>Summary</h2>
        <div class="summary-row"><span>Subtotal</span><span class="num">{{ money(cart.subtotal) }}</span></div>
        <div class="summary-row"><span>Shipping</span><span class="num">{{ cart.shipping === 0 ? 'Complimentary' : money(cart.shipping) }}</span></div>
        <div class="summary-row total"><span>Total</span><span class="num">{{ money(cart.total) }}</span></div>
        <router-link class="btn" to="/checkout">Checkout</router-link>
        <p v-if="cart.shipping > 0" class="hint">Add {{ money(FREE_SHIPPING_AT - cart.subtotal) }} for complimentary shipping.</p>
        <p v-else class="hint">Shipping is included. We confirm the piece before taking payment.</p>
      </aside>
    </div>
  </div>
</template>
