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
    { path: '/', name: 'login', component: LoginView },
    { path: '/home', name: 'home', component: HomeView },
    { path: '/data', name: 'data', component: DataView },
    { path: '/graph', name: 'graph', component: GraphView },
    { path: '/import', name: 'import', component: { template: '<h1>Import Placeholder</h1>' } },
    { path: '/export', name: 'export', component: { template: '<h1>Export Placeholder</h1>' } },
    //{ path: '/settings', name: 'settings', component: { template: '<h1>Settings Placeholder</h1>' } },
    { path: '/import', name: 'import', component: ImportView },
    { path: '/export', name: 'export', component: ExportView },
  ]
})

// Navigation Guard
router.beforeEach((to, from, next) => {
    const publicPages = ['/'];
    const authRequired = !publicPages.includes(to.path);
    const loggedIn = localStorage.getItem('user');

    if (authRequired && !loggedIn) {
        return next('/');
    }
    
    // Prevent logged-in users from going back to login
    if (to.path === '/' && loggedIn) {
        return next('/home');
    }

    next();
});

export default router