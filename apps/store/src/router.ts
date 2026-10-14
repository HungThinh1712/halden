import { createRouter, createWebHistory } from 'vue-router'
import AboutView from './views/AboutView.vue'
import AccountView from './views/AccountView.vue'
import CartView from './views/CartView.vue'
import CheckoutView from './views/CheckoutView.vue'
import HomeView from './views/HomeView.vue'
import NotFoundView from './views/NotFoundView.vue'
import OrderView from './views/OrderView.vue'
import OrdersView from './views/OrdersView.vue'
import ProductView from './views/ProductView.vue'
import ShopView from './views/ShopView.vue'

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { title: 'Halden' } },
    { path: '/shop', name: 'shop', component: ShopView, meta: { title: 'Shop' } },
    { path: '/product/:slug', name: 'product', component: ProductView, meta: { title: 'Piece' } },
    { path: '/cart', name: 'cart', component: CartView, meta: { title: 'Bag' } },
    { path: '/checkout', name: 'checkout', component: CheckoutView, meta: { title: 'Checkout' } },
    { path: '/account', name: 'account', component: AccountView, meta: { title: 'Account' } },
    { path: '/orders', name: 'orders', component: OrdersView, meta: { title: 'Orders' } },
    { path: '/orders/:id', name: 'order', component: OrderView, meta: { title: 'Order' } },
    { path: '/about', name: 'about', component: AboutView, meta: { title: 'Workshop' } },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView, meta: { title: 'Not found' } },
  ],
})

router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : 'Halden'
  document.title = title === 'Halden' ? 'Halden' : `${title} · Halden`
})
