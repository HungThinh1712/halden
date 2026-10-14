<script setup lang="ts">
import { messageOf, money } from '@shared/format'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'

const auth = useAuthStore()
const cart = useCartStore()
const router = useRouter()
const error = ref('')
const placing = ref(false)
const ready = ref(false)

const form = reactive({
  full_name: '',
  email: '',
  address_line: '',
  city: '',
  region: '',
  postal_code: '',
  country: 'United States',
  notes: '',
})

const blocked = computed(() => cart.items.some((item) => item.stock < 1 || item.quantity > item.stock))

onMounted(async () => {
  try {
    cart.sync(await api.listProducts())
  } catch (err) {
    error.value = messageOf(err)
  }
  form.full_name = auth.profile?.full_name ?? ''
  form.email = auth.profile?.email ?? ''
  ready.value = true
})

async function submit() {
  if (!auth.profile) return
  error.value = ''
  placing.value = true
  try {
    cart.sync(await api.listProducts())
    if (blocked.value) throw new Error('Update the bag before placing the order. A piece is short on stock.')
    const id = await api.placeOrder({
      email: form.email,
      full_name: form.full_name,
      address_line: form.address_line,
      city: form.city,
      region: form.region,
      postal_code: form.postal_code,
      country: form.country,
      notes: form.notes,
      items: cart.items.map((item) => ({ product_id: item.id, quantity: item.quantity })),
    }, auth.profile.id)
    cart.clear()
    await router.push({ name: 'order', params: { id } })
  } catch (err) {
    error.value = messageOf(err)
  } finally {
    placing.value = false
  }
}
</script>

<template>
  <div class="wrap page">
    <div class="page-head">
      <h1>Checkout</h1>
    </div>
    <div v-if="!cart.items.length && ready" class="empty">
      <p>Your bag is empty.</p>
      <router-link class="btn" to="/shop" style="margin-top: 20px">Return to the shop</router-link>
    </div>
    <div v-else-if="!auth.signedIn" class="empty">
      <h2>Sign in to place the order.</h2>
      <p class="quiet" style="margin: 12px 0 20px">The workshop keeps the order with your account so we can confirm it.</p>
      <router-link class="btn" to="/account?next=/checkout">Sign in</router-link>
    </div>
    <form v-else class="split-form" @submit.prevent="submit">
      <div class="form-grid">
        <label class="field"><span>Full name</span><input v-model="form.full_name" required autocomplete="name" /></label>
        <label class="field"><span>Email</span><input v-model="form.email" type="email" required autocomplete="email" /></label>
        <label class="field wide"><span>Address</span><input v-model="form.address_line" required autocomplete="address-line1" /></label>
        <label class="field"><span>City</span><input v-model="form.city" required autocomplete="address-level2" /></label>
        <label class="field"><span>State</span><input v-model="form.region" required autocomplete="address-level1" /></label>
        <label class="field"><span>Postal code</span><input v-model="form.postal_code" required autocomplete="postal-code" /></label>
        <label class="field"><span>Country</span><input v-model="form.country" required autocomplete="country-name" /></label>
        <label class="field wide"><span>Notes for the shop</span><textarea v-model="form.notes" maxlength="500" /></label>
        <p v-if="error" class="alert wide">{{ error }}</p>
      </div>
      <aside class="summary">
        <h2>Order</h2>
        <div v-for="item in cart.items" :key="item.id" class="summary-row">
          <span>{{ item.name }} × {{ item.quantity }}</span>
          <span class="num">{{ money(item.price_cents * item.quantity) }}</span>
        </div>
        <div class="summary-row"><span>Shipping</span><span class="num">{{ cart.shipping === 0 ? 'Complimentary' : money(cart.shipping) }}</span></div>
        <div class="summary-row total"><span>Total</span><span class="num">{{ money(cart.total) }}</span></div>
        <button class="btn" type="submit" :disabled="placing || blocked">{{ placing ? 'Placing order…' : 'Place order' }}</button>
        <p class="hint">This reserves the pieces. We email to confirm timing, then send payment details. Nothing is charged now.</p>
      </aside>
    </form>
  </div>
</template>
