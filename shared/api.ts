import type { SupabaseClient } from '@supabase/supabase-js'
import { categories as seedCategories, products as seedProducts, sampleOrders, sampleProfiles } from './catalog'
import { shippingFor } from './format'
import type {
  Category,
  CategoryInput,
  CheckoutInput,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  ProductInput,
  Profile,
  Subscriber,
} from './types'

const DB_KEY = 'halden.demo.v2'

type DemoDb = {
  categories: Category[]
  products: Product[]
  orders: Order[]
  profiles: Profile[]
  subscribers: Subscriber[]
}

type ProductRow = {
  id: string
  category_id: string | null
  name: string
  slug: string
  summary: string
  description: string
  price_cents: number
  compare_at_cents: number | null
  sku: string
  stock: number
  material: string | null
  dimensions: string | null
  lead_time: string | null
  featured: boolean
  published: boolean
  image_url: string
  image_alt: string | null
  hover_image_url: string | null
  created_at: string
  categories: { name: string; slug: string } | { name: string; slug: string }[] | null
}

type OrderRow = {
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
  order_items: OrderItemRow[] | null
}

type OrderItemRow = {
  id: string
  product_id: string | null
  name: string
  sku: string
  unit_price_cents: number
  quantity: number
}

function friendly(error: { message: string; code?: string }) {
  if (error.code === '23505') {
    if (error.message.includes('slug')) return 'That URL slug is already in use.'
    if (error.message.includes('sku')) return 'That SKU is already in use.'
    if (error.message.includes('subscribers') || error.message.includes('email')) {
      return 'This email is already on the list.'
    }
    return 'That value is already in use.'
  }
  return error.message
}

function raise(error: { message: string; code?: string } | null) {
  if (error) throw new Error(friendly(error))
}

function categoryOf(value: ProductRow['categories']) {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

function mapProduct(row: ProductRow): Product {
  const category = categoryOf(row.categories)
  return {
    id: row.id,
    category_id: row.category_id,
    category_name: category?.name ?? '',
    category_slug: category?.slug ?? '',
    name: row.name,
    slug: row.slug,
    summary: row.summary,
    description: row.description,
    price_cents: row.price_cents,
    compare_at_cents: row.compare_at_cents,
    sku: row.sku,
    stock: row.stock,
    material: row.material ?? '',
    dimensions: row.dimensions ?? '',
    lead_time: row.lead_time ?? '',
    featured: row.featured,
    published: row.published,
    image_url: row.image_url,
    image_alt: row.image_alt ?? row.name,
    hover_image_url: row.hover_image_url,
    created_at: row.created_at,
  }
}

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    user_id: row.user_id,
    email: row.email,
    status: row.status,
    subtotal_cents: row.subtotal_cents,
    shipping_cents: row.shipping_cents,
    total_cents: row.total_cents,
    full_name: row.full_name,
    address_line: row.address_line,
    city: row.city,
    region: row.region,
    postal_code: row.postal_code,
    country: row.country,
    notes: row.notes,
    created_at: row.created_at,
    items: (row.order_items ?? []).map(mapItem),
  }
}

function mapItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    product_id: row.product_id,
    name: row.name,
    sku: row.sku,
    unit_price_cents: row.unit_price_cents,
    quantity: row.quantity,
  }
}

function emptyDb(): DemoDb {
  return {
    categories: structuredClone(seedCategories),
    products: structuredClone(seedProducts),
    orders: structuredClone(sampleOrders),
    profiles: structuredClone(sampleProfiles),
    subscribers: [],
  }
}

function loadDb(): DemoDb {
  if (typeof localStorage === 'undefined') return emptyDb()
  const raw = localStorage.getItem(DB_KEY)
  if (!raw) {
    const seeded = emptyDb()
    localStorage.setItem(DB_KEY, JSON.stringify(seeded))
    return seeded
  }
  try {
    const parsed = JSON.parse(raw) as DemoDb
    if (!parsed.categories || !parsed.products) throw new Error('invalid')
    parsed.orders ??= []
    parsed.profiles ??= []
    parsed.subscribers ??= []
    return parsed
  } catch {
    const seeded = emptyDb()
    localStorage.setItem(DB_KEY, JSON.stringify(seeded))
    return seeded
  }
}

function saveDb(db: DemoDb) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

function withCategory(db: DemoDb, product: Product): Product {
  const category = db.categories.find((item) => item.id === product.category_id)
  return {
    ...product,
    category_name: category?.name ?? '',
    category_slug: category?.slug ?? '',
  }
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 160
}

export function createApi(supabase: SupabaseClient | null) {
  const live = Boolean(supabase)

  async function listCategories() {
    if (!supabase) {
      return loadDb().categories.slice().sort((a, b) => a.sort_order - b.sort_order)
    }
    const { data, error } = await supabase.from('categories').select('*').order('sort_order')
    raise(error)
    return (data ?? []) as Category[]
  }

  async function listProducts(all = false) {
    if (!supabase) {
      const db = loadDb()
      return db.products
        .map((product) => withCategory(db, product))
        .filter((product) => all || product.published)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
    }
    let query = supabase.from('products').select('*, categories(name, slug)').order('created_at', { ascending: false })
    if (!all) query = query.eq('published', true)
    const { data, error } = await query
    raise(error)
    return ((data ?? []) as ProductRow[]).map(mapProduct)
  }

  async function getProduct(slug: string) {
    const items = await listProducts(false)
    return items.find((product) => product.slug === slug) ?? null
  }

  async function listOrders() {
    if (!supabase) {
      return loadDb().orders.slice().sort((a, b) => b.created_at.localeCompare(a.created_at))
    }
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
    raise(error)
    return ((data ?? []) as OrderRow[]).map(mapOrder)
  }

  async function getOrder(id: string) {
    if (!supabase) {
      return loadDb().orders.find((order) => order.id === id) ?? null
    }
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .maybeSingle()
    raise(error)
    return data ? mapOrder(data as OrderRow) : null
  }

  async function placeOrder(input: CheckoutInput, userId: string | null) {
    if (!input.items.length) throw new Error('Your bag is empty.')
    if (!supabase) {
      const db = loadDb()
      let subtotal = 0
      const items: OrderItem[] = []
      for (const line of input.items) {
        if (line.quantity < 1 || line.quantity > 8) throw new Error('Quantity must be between 1 and 8.')
        const product = db.products.find((item) => item.id === line.product_id && item.published)
        if (!product) throw new Error('A piece in your bag is no longer available.')
        if (product.stock < line.quantity) throw new Error(`${product.name} does not have enough stock.`)
        product.stock -= line.quantity
        subtotal += product.price_cents * line.quantity
        items.push({
          id: crypto.randomUUID(),
          product_id: product.id,
          name: product.name,
          sku: product.sku,
          unit_price_cents: product.price_cents,
          quantity: line.quantity,
        })
      }
      const shipping = shippingFor(subtotal)
      const order: Order = {
        id: crypto.randomUUID(),
        user_id: userId,
        email: input.email.trim(),
        status: 'pending',
        subtotal_cents: subtotal,
        shipping_cents: shipping,
        total_cents: subtotal + shipping,
        full_name: input.full_name.trim(),
        address_line: input.address_line.trim(),
        city: input.city.trim(),
        region: input.region.trim(),
        postal_code: input.postal_code.trim(),
        country: input.country.trim() || 'United States',
        notes: input.notes.trim() || null,
        created_at: new Date().toISOString(),
        items,
      }
      db.orders.unshift(order)
      saveDb(db)
      return order.id
    }
    const { data, error } = await supabase.rpc('place_order', {
      p_email: input.email,
      p_full_name: input.full_name,
      p_address_line: input.address_line,
      p_city: input.city,
      p_region: input.region,
      p_postal_code: input.postal_code,
      p_country: input.country,
      p_notes: input.notes,
      p_items: input.items,
    })
    raise(error)
    return data as string
  }

  async function setOrderStatus(id: string, status: OrderStatus) {
    if (!supabase) {
      const db = loadDb()
      const order = db.orders.find((item) => item.id === id)
      if (!order) throw new Error('Order not found.')
      if (order.status === status) return
      const leavingCancelled = order.status === 'cancelled' && status !== 'cancelled'
      const enteringCancelled = order.status !== 'cancelled' && status === 'cancelled'
      if (leavingCancelled) {
        for (const item of order.items) {
          const product = db.products.find((piece) => piece.id === item.product_id)
          if (product && product.stock < item.quantity) {
            throw new Error('Not enough stock to reopen this order.')
          }
        }
        for (const item of order.items) {
          const product = db.products.find((piece) => piece.id === item.product_id)
          if (product) product.stock -= item.quantity
        }
      }
      if (enteringCancelled) {
        for (const item of order.items) {
          const product = db.products.find((piece) => piece.id === item.product_id)
          if (product) product.stock += item.quantity
        }
      }
      order.status = status
      saveDb(db)
      return
    }
    const { error } = await supabase.rpc('set_order_status', { p_order_id: id, p_status: status })
    raise(error)
  }

  async function saveProduct(input: ProductInput, id?: string) {
    if (!input.name.trim() || !input.slug.trim() || !input.sku.trim() || !input.image_url.trim()) {
      throw new Error('Name, slug, SKU, and image are required.')
    }
    if (!supabase) {
      const db = loadDb()
      const slugTaken = db.products.some((product) => product.slug === input.slug && product.id !== id)
      const skuTaken = db.products.some((product) => product.sku === input.sku && product.id !== id)
      if (slugTaken) throw new Error('That URL slug is already in use.')
      if (skuTaken) throw new Error('That SKU is already in use.')
      if (id) {
        const index = db.products.findIndex((product) => product.id === id)
        if (index === -1) throw new Error('Piece not found.')
        db.products[index] = withCategory(db, {
          ...db.products[index],
          ...input,
          id,
        })
      } else {
        const created: Product = withCategory(db, {
          ...input,
          id: crypto.randomUUID(),
          category_name: '',
          category_slug: '',
          created_at: new Date().toISOString(),
        })
        db.products.unshift(created)
      }
      saveDb(db)
      return
    }
    const payload = {
      category_id: input.category_id,
      name: input.name.trim(),
      slug: input.slug.trim(),
      summary: input.summary.trim(),
      description: input.description.trim(),
      price_cents: input.price_cents,
      compare_at_cents: input.compare_at_cents,
      sku: input.sku.trim(),
      stock: input.stock,
      material: input.material.trim(),
      dimensions: input.dimensions.trim(),
      lead_time: input.lead_time.trim(),
      featured: input.featured,
      published: input.published,
      image_url: input.image_url.trim(),
      image_alt: input.image_alt.trim() || input.name.trim(),
      hover_image_url: input.hover_image_url?.trim() || null,
    }
    if (id) {
      const { error } = await supabase.from('products').update(payload).eq('id', id)
      raise(error)
      return
    }
    const { error } = await supabase.from('products').insert(payload)
    raise(error)
  }

  async function deleteProduct(id: string) {
    if (!supabase) {
      const db = loadDb()
      db.products = db.products.filter((product) => product.id !== id)
      saveDb(db)
      return
    }
    const { error } = await supabase.from('products').delete().eq('id', id)
    raise(error)
  }

  async function saveCategory(input: CategoryInput, id?: string) {
    if (!input.name.trim() || !input.slug.trim()) throw new Error('Name and slug are required.')
    if (!supabase) {
      const db = loadDb()
      const taken = db.categories.some((category) => category.slug === input.slug && category.id !== id)
      if (taken) throw new Error('That URL slug is already in use.')
      if (id) {
        const index = db.categories.findIndex((category) => category.id === id)
        if (index === -1) throw new Error('Department not found.')
        db.categories[index] = { ...db.categories[index], ...input, id }
      } else {
        db.categories.push({ ...input, id: crypto.randomUUID() })
      }
      db.products = db.products.map((product) => withCategory(db, product))
      saveDb(db)
      return
    }
    const payload = {
      name: input.name.trim(),
      slug: input.slug.trim(),
      description: input.description.trim(),
      sort_order: input.sort_order,
    }
    if (id) {
      const { error } = await supabase.from('categories').update(payload).eq('id', id)
      raise(error)
      return
    }
    const { error } = await supabase.from('categories').insert(payload)
    raise(error)
  }

  async function deleteCategory(id: string) {
    if (!supabase) {
      const db = loadDb()
      db.categories = db.categories.filter((category) => category.id !== id)
      db.products = db.products.map((product) =>
        product.category_id === id ? withCategory(db, { ...product, category_id: null }) : product,
      )
      saveDb(db)
      return
    }
    const { error } = await supabase.from('categories').delete().eq('id', id)
    raise(error)
  }

  async function listCustomers() {
    if (!supabase) return loadDb().profiles.slice().sort((a, b) => b.created_at.localeCompare(a.created_at))
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    raise(error)
    return (data ?? []) as Profile[]
  }

  async function getProfile(id: string) {
    if (!supabase) return loadDb().profiles.find((profile) => profile.id === id) ?? null
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
      raise(error)
      if (data) return data as Profile
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
    return null
  }

  async function updateProfile(id: string, fullName: string) {
    const name = fullName.trim()
    if (name.length < 2) throw new Error('Enter your name.')
    if (!supabase) {
      const db = loadDb()
      const profile = db.profiles.find((item) => item.id === id)
      if (profile) profile.full_name = name
      saveDb(db)
      return
    }
    const { error } = await supabase.from('profiles').update({ full_name: name }).eq('id', id)
    raise(error)
  }

  async function setRole(id: string, role: Profile['role']) {
    if (!supabase) {
      const db = loadDb()
      const profile = db.profiles.find((item) => item.id === id)
      if (!profile) throw new Error('Customer not found.')
      profile.role = role
      saveDb(db)
      return
    }
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
    raise(error)
  }

  async function subscribe(email: string) {
    const value = email.trim().toLowerCase()
    if (!validEmail(value)) throw new Error('Enter a valid email address.')
    if (!supabase) {
      const db = loadDb()
      if (db.subscribers.some((item) => item.email === value)) throw new Error('This email is already on the list.')
      db.subscribers.push({ id: crypto.randomUUID(), email: value, created_at: new Date().toISOString() })
      saveDb(db)
      return
    }
    const { error } = await supabase.from('subscribers').insert({ email: value })
    raise(error)
  }

  async function listSubscribers() {
    if (!supabase) return loadDb().subscribers.slice().sort((a, b) => b.created_at.localeCompare(a.created_at))
    const { data, error } = await supabase.from('subscribers').select('*').order('created_at', { ascending: false })
    raise(error)
    return (data ?? []) as Subscriber[]
  }

  async function uploadImage(file: File) {
    if (!file.type.startsWith('image/')) throw new Error('Choose an image file.')
    if (file.size > 5 * 1024 * 1024) throw new Error('Images need to be under 5 MB.')
    if (!supabase) throw new Error('Connect Supabase before uploading images. Paste an image URL for now.')
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-')
    const path = `${crypto.randomUUID()}-${safeName}`
    const { error } = await supabase.storage.from('product-images').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })
    raise(error)
    const { data } = supabase.storage.from('product-images').getPublicUrl(path)
    return data.publicUrl
  }

  async function ensureDemoProfile(profile: Profile) {
    const db = loadDb()
    const existing = db.profiles.find((item) => item.email?.toLowerCase() === profile.email?.toLowerCase())
    if (existing) return existing
    db.profiles.unshift(profile)
    saveDb(db)
    return profile
  }

  return {
    live,
    listCategories,
    listProducts,
    getProduct,
    listOrders,
    getOrder,
    placeOrder,
    setOrderStatus,
    saveProduct,
    deleteProduct,
    saveCategory,
    deleteCategory,
    listCustomers,
    getProfile,
    updateProfile,
    setRole,
    subscribe,
    listSubscribers,
    uploadImage,
    ensureDemoProfile,
  }
}

export type Api = ReturnType<typeof createApi>
