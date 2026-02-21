<script setup>
import { ref, onMounted } from 'vue';
import { API_BASE, setTokens, scheduleTokenRefresh, decodeJwt } from '@/api';
import { useRouter } from 'vue-router';

const router = useRouter();
const isLogin = ref(true);
const username = ref('');
const password = ref('');
const errorMsg = ref('');

const toggleMode = () => {
    isLogin.value = !isLogin.value;
    errorMsg.value = '';
};

const handleSubmit = async () => {
    const endpoint = isLogin.value ? '/moneyflow/login/' : '/moneyflow/register/';
    
    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username: username.value, 
                password: password.value 
            })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Request failed');

        const access = data.access || data.token || data.access_token;
        const refresh = data.refresh || data.refresh_token;

        if (access) {
            setTokens(access, refresh);
            scheduleTokenRefresh();
        }

        const userObj = data.user || data.profile || { username: username.value };
        localStorage.setItem('user', JSON.stringify(userObj));
        
        router.push('/home');

    } catch (err) {
        errorMsg.value = err.message || 'Network error occurred';
    }
};

onMounted(() => {
    const access = localStorage.getItem('accessToken');
    if (access) {
        const payload = decodeJwt(access);
        if (payload?.exp && payload.exp * 1000 > Date.now() + 5000) {
            scheduleTokenRefresh();
            router.push('/home');
        }
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