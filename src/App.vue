<script setup>
import { RouterView, useRoute } from 'vue-router';
import { Home, Database, LineChart, Upload, Download, Settings, Menu, User, Sun, Moon, LogOut, Import, Send } from 'lucide-vue-next';
import { ref, computed, onMounted, watch } from 'vue';
import { userAuthStore } from '@/stores/authStore';

const route = useRoute();
const currentRouteName = computed(() => route.name);

// Check if we are on the login page
const isLoginPage = computed(() => route.name === 'login');

// --- Sidebar State ---
const isSidebarExpanded = ref(true);
const toggleSidebar = () => isSidebarExpanded.value = !isSidebarExpanded.value;

// Dynamic Grid Style (Hide Sidebar on Login)
const gridStyle = computed(() => {
    if (isLoginPage.value) return { display: 'block', height: '100vh' };
    
    return {
        display: 'grid',
        gridTemplateColumns: isSidebarExpanded.value ? '250px 1fr' : '70px 1fr',
        gridTemplateRows: '60px 1fr',
        height: '100vh',
        transition: 'grid-template-columns 0.3s ease',
    }
});

// --- Profile & Theme State ---
const isProfileOpen = ref(false);
const toggleProfile = () => isProfileOpen.value = !isProfileOpen.value;

const isDarkMode = ref(false);
const toggleTheme = () => isDarkMode.value = !isDarkMode.value;

const handleLogout = () => {
  const authStore = userAuthStore();
  authStore.logout('accessToken');
  isProfileOpen.value = false;
};

// Theme Logic
const applyTheme = () => {
  if (isDarkMode.value) document.body.classList.add('dark-mode');
  else document.body.classList.remove('dark-mode');
};

onMounted(() => {
  let storedTheme = localStorage.getItem('theme');
  if(!storedTheme) {
    storedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    localStorage.setItem("theme", storedTheme);
  }
  if (storedTheme === 'dark') isDarkMode.value = true;
  applyTheme();
});

watch(isDarkMode, () => {
  applyTheme();
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light');
});

// Navigation Items
const sidebarItems = [
  { name: 'home', path: '/home', icon: Home, label: 'Home' },
  { name: 'data', path: '/data', icon: Database, label: 'Data' },
  { name: 'graph', path: '/graph', icon: LineChart, label: 'Graph' },
];

const bottomSidebarItems = [
  { name: 'import', path: '/import', icon: Import, label: 'Import' },
  { name: 'export', path: '/export', icon: Upload, label: 'Export' },
  //{ name: 'settings', path: '/settings', icon: Settings, label: 'Settings' },
];
</script>

<template>
  <div :style="gridStyle">
    
    <header v-if="!isLoginPage" class="main-header">
      <div class="retro-btn icon-btn" @click="toggleSidebar">
        <Menu />
      </div>
      
      <h1 class="page-title">MoneyFlow</h1>

      <div class="profile-container">
         <div class="retro-btn icon-btn profile-btn" @click="toggleProfile">
           <User />
         </div>
         
         <div v-if="isProfileOpen" class="retro-box profile-dropdown">
            <div class="dropdown-item theme-toggle" @click="toggleTheme">
              <div style="display: flex; align-items: center; gap: 10px;">
                <Sun v-if="!isDarkMode" size="18" />
                <Moon v-else size="18" />
                <span>Theme</span>
              </div>
              <div class="toggle-switch" :class="{ active: isDarkMode }">
                <div class="toggle-thumb"></div>
              </div>
            </div>
            
            <div class="dropdown-item logout" @click="handleLogout">
              <LogOut size="18" /> <span>Logout</span>
            </div>
         </div>
      </div>
    </header>

    <aside v-if="!isLoginPage" class="main-sidebar" :class="{ collapsed: !isSidebarExpanded }">
      <div class="sidebar-group">
        <router-link
          v-for="item in sidebarItems" :key="item.name" :to="item.path"
          class="retro-btn sidebar-link"
          :class="{ active: currentRouteName === item.name, 'icon-only': !isSidebarExpanded }"
        >
          <component :is="item.icon" size="18"/>
          <transition name="fade"><span v-if="isSidebarExpanded">{{ item.label }}</span></transition>
        </router-link>
      </div>

      <div class="sidebar-group bottom">
        <router-link
          v-for="item in bottomSidebarItems" :key="item.name" :to="item.path"
          class="retro-btn sidebar-link"
          :class="{ active: currentRouteName === item.name, 'icon-only': !isSidebarExpanded }"
        >
          <component :is="item.icon" size="18"/>
          <transition name="fade"><span v-if="isSidebarExpanded">{{ item.label }}</span></transition>
        </router-link>
      </div>
    </aside>

    <main class="main-content-area">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
/* Reuse styles from previous step */
.page-title { font-size: 1.2rem; font-weight: 900; }
.icon-btn { padding: 5px; display: flex; align-items: center; justify-content: center; height: 32px; width: 32px; }
.profile-container { position: relative; }
.profile-btn { background: var(--color-black); color: var(--color-primary-yellow); }
.profile-dropdown { position: absolute; right: 0; top: 50px; width: 220px; z-index: 20; padding: 15px; display: flex; flex-direction: column; gap: 15px; }
.dropdown-item { display: flex; align-items: center; gap: 15px; cursor: pointer; font-weight: bold; padding: 5px; border-radius: 4px; }
.dropdown-item:hover { background-color: var(--color-hover); }
.logout { color: var(--color-danger); }
.theme-toggle { justify-content: space-between; }
.toggle-switch { width: 44px; height: 22px; background-color: #ddd; border: 2px solid var(--color-black); border-radius: 12px; position: relative; transition: background-color 0.3s; box-sizing: content-box; }
.toggle-switch.active { background-color: var(--color-primary-yellow); }
.toggle-thumb { width: 18px; height: 18px; background-color: var(--color-black); border-radius: 50%; position: absolute; top: 50%; left: 2px; transform: translateY(-50%); transition: left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1); }
.toggle-switch.active .toggle-thumb { left: calc(100% - 20px); }
.sidebar-group { display: flex; flex-direction: column; gap: 15px; width: 100%; }
.sidebar-group.bottom { margin-top: auto; }
.sidebar-link { overflow: hidden; white-space: nowrap; }
.sidebar-link.icon-only { justify-content: center; padding: 10px; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>