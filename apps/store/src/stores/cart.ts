import type { Product } from '@shared/types'
import { shippingFor } from '@shared/format'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

const KEY = 'halden.cart.v1'

export type CartItem = {
  id: string
  slug: string
  name: string
  sku: string
  image_url: string
  price_cents: number
  quantity: number
  stock: number
}

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>(load())

  watch(items, (value) => localStorage.setItem(KEY, JSON.stringify(value)), { deep: true })

  const count = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
  const subtotal = computed(() => items.value.reduce((sum, item) => sum + item.price_cents * item.quantity, 0))
  const shipping = computed(() => shippingFor(subtotal.value))
  const total = computed(() => subtotal.value + shipping.value)

  function add(product: Product, quantity = 1): 'added' | 'capped' | 'gone' {
    if (product.stock < 1) return 'gone'
    const existing = items.value.find((item) => item.id === product.id)
    const desired = (existing?.quantity ?? 0) + quantity
    const next = Math.min(8, product.stock, desired)
    if (existing && next === existing.quantity) return 'capped'
    if (existing) {
      existing.quantity = next
      existing.price_cents = product.price_cents
      existing.stock = product.stock
      existing.name = product.name
      return desired > next ? 'capped' : 'added'
    }
    items.value.push({
      id: product.id,
      slug: product.slug,
      name: product.name,
      sku: product.sku,
      image_url: product.image_url,
      price_cents: product.price_cents,
      quantity: next,
      stock: product.stock,
    })
    return desired > next ? 'capped' : 'added'
  }

  function setQuantity(id: string, quantity: number) {
    const item = items.value.find((entry) => entry.id === id)
    if (!item) return
    item.quantity = Math.min(8, Math.max(1, item.stock || 8), quantity)
  }

  function remove(id: string) {
    items.value = items.value.filter((item) => item.id !== id)
  }

  function sync(products: Product[]) {
    items.value = items.value.flatMap((item) => {
      const product = products.find((entry) => entry.id === item.id && entry.published)
      if (!product) return [{ ...item, stock: 0 }]
      const quantity = Math.min(item.quantity, product.stock, 8)
      if (quantity < 1) return [{ ...item, stock: 0, price_cents: product.price_cents, name: product.name }]
      return [{
        ...item,
        name: product.name,
        sku: product.sku,
        image_url: product.image_url,
        price_cents: product.price_cents,
        stock: product.stock,
        quantity,
      }]
    })
  }

  function clear() {
    items.value = []
  }

  return { items, count, subtotal, shipping, total, add, setQuantity, remove, sync, clear }
})
