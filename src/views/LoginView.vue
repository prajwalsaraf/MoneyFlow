<script setup>
import { ref, onMounted } from 'vue';
import { api, scheduleTokenRefresh } from '@/api';
import { useRouter } from 'vue-router';
import { userAuthStore } from '@/stores/authStore';

const router = useRouter();
const isLogin = ref(true);
const username = ref('');
const password = ref('');
const currency = ref('');
const errorMsg = ref('');
const authStore = userAuthStore();

const toggleMode = () => {
    isLogin.value = !isLogin.value;
    errorMsg.value = '';
};

const handleSubmit = async () => {
    let body;
    
    try {
        if(isLogin.value) {
            body = {username: username.value, password: password.value}
        } else {
            body = {username: username.value, password: password.value, home_currency: currency.value}
        }

        const res = isLogin.value ? await api.login(body) : await api.create_user(body);

        if(res.status === 401) throw new Error(res.data.error);

        if (res.data.access) {
            authStore.setAccessToken(res.data.access);
            scheduleTokenRefresh();
            localStorage.setItem("user", res.data.user);
            router.push('/home');
        }
    } catch (err) {
        errorMsg.value = err.message || 'Network error occurred';
    }
};

onMounted(() => {
    if(authStore.accessToken) {
        router.push('/home');
    }
});
</script>

<template>
<div class="login-container">
    <div class="retro-box login-box">
        <h2 style="font-weight: 900; text-align: center; margin-bottom: 20px;">
            {{ isLogin ? 'Login' : 'Create Account' }}
        </h2>

        <form @submit.prevent="handleSubmit" class="login-form">
            <div class="form-group">
                <label>Username</label>
                <input v-model="username" type="text" class="retro-input" required />
            </div>
            
            <div class="form-group">
                <label>Password</label>
                <input v-model="password" type="password" class="retro-input" required />
            </div>
            
            <div v-if="!isLogin" class="form-group">
                <label>Currency</label>
                <input v-model="currency" type="text" class="retro-input" required />
            </div>

            <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>

            <button type="submit" class="retro-btn submit-btn">
                {{ isLogin ? 'Enter' : 'Sign Up' }}
            </button>
        </form>

        <div class="toggle-link" @click="toggleMode">
            {{ isLogin ? 'New here? Create an account' : 'Already have an account? Login' }}
        </div>
    </div>
</div>
</template>

<style scoped>
/* Your CSS remains exactly the same, no changes needed here */
.login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: var(--color-bg-main);
}

.login-box {
    width: 350px;
    padding: 40px;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    font-weight: bold;
    margin-bottom: 5px;
}

.retro-input {
    width: 100%;
    padding: 10px;
    border: 3px solid var(--color-black);
    font-family: 'Courier New', monospace;
    font-size: 1rem;
    box-sizing: border-box;
    background: var(--color-bg-main);
    color: var(--color-text);
}

.retro-input:focus {
    outline: none;
    background-color: var(--color-hover);
}

.submit-btn {
    width: 100%;
    justify-content: center;
    margin-top: 10px;
    background-color: var(--color-primary-yellow);
    color: black;
}

.toggle-link {
    margin-top: 20px;
    text-align: center;
    text-decoration: underline;
    cursor: pointer;
    font-size: 0.9rem;
}

.error-text {
    color: var(--color-danger);
    font-weight: bold;
    text-align: center;
}
</style>
