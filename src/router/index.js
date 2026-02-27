// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import DataView from '../views/DataView.vue'
import GraphView from '../views/GraphView.vue'
import LoginView from '../views/LoginView.vue'
import ImportView from '../views/ImportView.vue'
import ExportView from '@/views/ExportView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'login', component: LoginView, meta: { title: 'Login - Moneyflow' } },
    { path: '/home', name: 'home', component: HomeView, meta: { title: 'Home - Moneyflow' } },
    { path: '/data', name: 'data', component: DataView, meta: { title: 'All Transactions - Moneyflow' } },
    { path: '/graph', name: 'graph', component: GraphView },
    //{ path: '/settings', name: 'settings', component: { template: '<h1>Settings Placeholder</h1>' } },
    { path: '/import', name: 'import', component: ImportView, meta: { title: 'Import - Moneyflow' } },
    { path: '/export', name: 'export', component: ExportView, meta: { title: 'Export - Moneyflow' } },
  ]
})

// Navigation Guard
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'Moneyflow';
  const publicPages = ['/'];
  const authRequired = !publicPages.includes(to.path);
  next();
});

export default router
