import { createRouter, createWebHistory } from 'vue-router'
import CategoriesView from './views/CategoriesView.vue'
import CustomersView from './views/CustomersView.vue'
import DashboardView from './views/DashboardView.vue'
import LoginView from './views/LoginView.vue'
import OrderDetailView from './views/OrderDetailView.vue'
import OrdersView from './views/OrdersView.vue'
import ProductFormView from './views/ProductFormView.vue'
import ProductsView from './views/ProductsView.vue'
import { useAuthStore } from './stores/auth'

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { public: true, title: 'Sign in' } },
    { path: '/', name: 'dashboard', component: DashboardView, meta: { title: 'Workshop' } },
    { path: '/products', name: 'products', component: ProductsView, meta: { title: 'Pieces' } },
    { path: '/products/:id', name: 'product-form', component: ProductFormView, meta: { title: 'Edit piece' } },
    { path: '/orders', name: 'orders', component: OrdersView, meta: { title: 'Orders' } },
    { path: '/orders/:id', name: 'order', component: OrderDetailView, meta: { title: 'Order' } },
    { path: '/categories', name: 'categories', component: CategoriesView, meta: { title: 'Departments' } },
    { path: '/customers', name: 'customers', component: CustomersView, meta: { title: 'Customers' } },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.ready) await auth.init()
  if (to.meta.public) {
    if (auth.isAdmin && to.name === 'login') return { name: 'dashboard' }
    return true
  }
  if (!auth.isAdmin) return { name: 'login', query: { next: to.fullPath } }
  return true
})

router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : 'Workshop'
  document.title = `${title} · Halden`
})
