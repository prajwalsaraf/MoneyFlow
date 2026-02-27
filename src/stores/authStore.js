// src/stores/authStore.js
import { defineStore } from 'pinia';
import { api, scheduleTokenRefresh } from '@/api';
import router from '@/router';


export const userAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: null,
    isInitialized: false,
    user: null,
  }),

  
  actions: {
    setAccessToken(token) {
      this.accessToken = token;
    },
    setUser(username) {
      this.user = username;
    },

    async initAuth() {
      try {
        const response = await api.refresh_token();
        this.accessToken = response.data.access;
        scheduleTokenRefresh();
      } catch (error) {
        console.warn("No active session found.");
        this.accessToken = null;
      } finally {
        this.isInitialized = true;
      }
    },

    async logout() {
      try {
        await api.logout();
      } catch(error) {
        console.log("Logout Error! Only clearing local!")
      } finally {
        this.accessToken = null;
        localStorage.removeItem("user");
        router.push('/');
      }
    }
  }
});
