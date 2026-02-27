<script setup>
import { ref, onMounted, computed } from 'vue';
import { api } from '@/api';
import { Filter } from 'lucide-vue-next';

// --- State ---
const accounts = ref([]);
const transactions = ref([]);
const isLoading = ref(true);
const error = ref(null);
const page = ref(1);

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
    const accResponse = await api.getAccounts();
    accounts.value = accResponse.data;
  } catch (error) {
    console.error("Failed to load accounts:", error);
  }


  try {
    const response = await api.getAllTransactions();
    transactions.value = response.data.results;
  } catch (error) {
    console.error("Failed to load accounts:", error);
  } finally {
    isLoading.value = false;
  }
});

// --- Filtering Logic ---
const filteredTransactions = computed(() => {
    let data = transactions.value;

    // Filter by Year
    if (selectedYear.value !== 'All Years') {
        data = data.filter(t => getYear(t.txn_date) === selectedYear.value);
    }

    // Filter by Month
    if (selectedMonth.value !== 'All Months') {
        data = data.filter(t => getMonthName(t.txn_date) === selectedMonth.value);
    }

    return data;
});

const getAccountName = (value) => {
    let acc = accounts.value.find(acc => acc.id === value);
    return acc.name + ' - ' + acc.acc_no.toString().slice(-4)
}

</script>

<template>
  <div class="retro-box p-4">
    <div class="flex justify-between items-center mb-4">
        <div>
             <h2 style="font-weight: 900; margin:0;">All Transaction Records</h2>
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
          <th>Account</th>
          <th>Transaction Date</th>
          <th style="text-align: left;">Transaction Description</th>
          <th style="text-align: left;">Group Name</th>
          <th>Debit Amount</th>
          <th>Credit Amount</th>
          <th>Ref. Number</th>
          <th>Closing Balance</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in filteredTransactions" :key="item.id" :class="{ 'highlight-row': index === 0 }">
          <td>{{ getAccountName(item.account) }}</td>
          <td>{{ new Date(item.txn_date).toLocaleDateString() }}</td>
          <td style="text-align: left; font-weight: bold;">{{ item.txn_desc }}</td>
          <td style="text-align: left; font-weight: bold;">{{ item.grp_name }}</td>
          <td style="text-align: right;">{{ formatCurrency(item.dbt_amount) }}</td>
          <td style="text-align: right;">{{ formatCurrency(item.cr_amount) }}</td>
          <td>{{ item.ref_num }}</td>
          <td style="text-align: right; font-weight: bold;">{{ formatCurrency(item.cf_amt) }}</td>
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