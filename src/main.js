import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
// import store from './store'
import './assets/main.css'

import { userAuthStore } from './stores/authStore'

async function startApp() {
    const app = createApp(App)
    const pinia = createPinia()

    app.use(pinia)
    
    // 3. Initialize Auth (this hits your refresh endpoint)
    const authStore = userAuthStore()
    await authStore.initAuth()

    // 4. Register Router and mount only after auth is settled
    app.use(router)
    app.mount('#app')
}

startApp()
