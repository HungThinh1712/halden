export type Role = 'customer' | 'admin'

export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'cancelled'

export type Category = {
  id: string
  name: string
  slug: string
  description: string
  sort_order: number
}

export type Product = {
  id: string
  category_id: string | null
  category_name: string
  category_slug: string
  name: string
  slug: string
  summary: string
  description: string
  price_cents: number
  compare_at_cents: number | null
  sku: string
  stock: number
  material: string
  dimensions: string
  lead_time: string
  featured: boolean
  published: boolean
  image_url: string
  image_alt: string
  hover_image_url: string | null
  created_at: string
}

export type ProductInput = {
  category_id: string | null
  name: string
  slug: string
  summary: string
  description: string
  price_cents: number
  compare_at_cents: number | null
  sku: string
  stock: number
  material: string
  dimensions: string
  lead_time: string
  featured: boolean
  published: boolean
  image_url: string
  image_alt: string
  hover_image_url: string | null
}

export type CategoryInput = {
  name: string
  slug: string
  description: string
  sort_order: number
}

export type OrderItem = {
  id: string
  product_id: string | null
  name: string
  sku: string
  unit_price_cents: number
  quantity: number
}

export type Order = {
  id: string
  user_id: string | null
  email: string
  status: OrderStatus
  subtotal_cents: number
  shipping_cents: number
  total_cents: number
  full_name: string
  address_line: string
  city: string
  region: string
  postal_code: string
  country: string
  notes: string | null
  created_at: string
  items: OrderItem[]
}

export type CheckoutInput = {
  email: string
  full_name: string
  address_line: string
  city: string
  region: string
  postal_code: string
  country: string
  notes: string
  items: { product_id: string; quantity: number }[]
}

export type Profile = {
  id: string
  full_name: string | null
  email: string | null
  role: Role
  created_at: string
}

export type Subscriber = {
  id: string
  email: string
  created_at: string
}
