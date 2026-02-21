<script setup>
import { ref, onMounted, computed } from 'vue';
import { API_BASE, apiFetch } from '@/api';
import { Filter } from 'lucide-vue-next';

// --- State ---
const transactions = ref([]);
const isLoading = ref(true);
const error = ref(null);

// Filter State
const availableYears = ref([]);
const selectedYear = ref('All Years');
const selectedMonth = ref('All Months');

const months = [
  'All Months', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// --- Helpers ---
const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
};

const getYear = (dateStr) => new Date(dateStr).getFullYear();
const getMonthName = (dateStr) => new Date(dateStr).toLocaleString('default', { month: 'long' });

// --- Fetch Data ---
onMounted(async () => {
  try {
    const endpoint = `/moneyflow/accounts/all-txns/`;
    const response = await apiFetch(endpoint);
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error("Server returned an error:", errorText);
        throw new Error(`Server Error: ${response.status}.`);
    }

    const result = await response.json();
    
    // DEBUG: Let's see exactly what Django sent back
    console.log("Raw API Response:", result);
    
    // 1. SAFELY EXTRACT THE ARRAY
    if (Array.isArray(result)) {
        transactions.value = result; // It was a plain array
    } else if (result && Array.isArray(result.results)) {
        transactions.value = result.results; // DRF paginated response
    } else if (result && Array.isArray(result.data)) {
        transactions.value = result.data; // Custom wrapper
    } else {
        console.error("Could not find an array in the response!");
        transactions.value = []; // Fallback so .map() doesn't crash
    }

    // 2. NOW IT IS SAFE TO MAP
    const uniqueYears = [...new Set(transactions.value.map(t => getYear(t.date)))];
    
    // 3. Filter out any potential NaN/undefined years if dates are missing, then sort
    availableYears.value = uniqueYears
        .filter(y => !isNaN(y))
        .sort((a, b) => b - a);

  } catch (err) {
    console.error("Fetch Error:", err);
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
});

// --- Filtering Logic ---
const filteredTransactions = computed(() => {
    let data = transactions.value;

    // Filter by Year
    if (selectedYear.value !== 'All Years') {
        data = data.filter(t => getYear(t.date) === selectedYear.value);
    }

    // Filter by Month
    if (selectedMonth.value !== 'All Months') {
        data = data.filter(t => getMonthName(t.date) === selectedMonth.value);
    }

    return data;
});
</script>

<template>
  <div class="retro-box p-4">
    <div class="flex justify-between items-center mb-4">
        <div>
             <h2 style="font-weight: 900; margin:0;">Database Records</h2>
             <p style="margin:0; color: gray;">Data fetched from SQLite database</p>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
            <Filter size="20"/>
            
            <select v-model="selectedMonth" class="retro-btn" style="padding: 5px;">
                <option v-for="m in months" :key="m" :value="m">{{ m }}</option>
            </select>
            
            <select v-model="selectedYear" class="retro-btn" style="padding: 5px;">
                <option value="All Years">All Years</option>
                <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
            </select>
        </div>
    </div>

    <div v-if="isLoading">Loading data...</div>
    <div v-else-if="error" style="color: red;">Error: {{ error }}</div>

    <table v-else class="retro-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Date</th>
          <th style="text-align: left;">Narration</th>
          <th>Debit Amount</th>
          <th>Credit Amount</th>
          <th>Chq Ref Number</th>
          <th>Closing Balance</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in filteredTransactions" :key="item.id" :class="{ 'highlight-row': index === 0 }">
          <td>{{ item.id }}</td>
          <td>{{ item.date }}</td>
          <td style="text-align: left; font-weight: bold;">{{ item.narration }}</td>
          <td style="text-align: right;">{{ formatCurrency(item.debit) }}</td>
          <td style="text-align: right;">{{ formatCurrency(item.credit) }}</td>
          <td>{{ item.chq_ref }}</td>
          <td style="text-align: right; font-weight: bold;">{{ formatCurrency(item.closing_balance) }}</td>
        </tr>
        
        <tr v-if="filteredTransactions.length === 0">
            <td colspan="7" style="padding: 20px; color: gray;">No records found for this selection.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* Specific table styles to match Image 1 */
.retro-box { padding: 20px; }
.flex { display: flex; }
.justify-between { justify-content: space-between; }
.items-center { align-items: center; }
.mb-4 { margin-bottom: 1rem; }

.retro-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
}

.retro-table th {
    border-bottom: 3px solid black;
    padding: 10px;
    text-align: center;
    font-weight: 900;
}

.retro-table td {
    border-bottom: 1px solid black;
    padding: 10px 5px;
    text-align: center;
}

/* The yellow highlight for the first row seen in the image */
.highlight-row {
    background-color: rgba(255, 193, 7, 0.3); /* Transparent yellow */
}
</style>