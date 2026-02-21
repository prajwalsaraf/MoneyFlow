<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { apiFetch } from '@/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Pie } from 'vue-chartjs';
import { Filter } from 'lucide-vue-next';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// --- State ---
const transactions = ref([]);
const availableYears = ref([]);
const selectedYear = ref(null);
const selectedMonth = ref('All Months');
const isLoading = ref(true);
const error = ref(null);

// Theme State Detection (to update charts dynamically)
const isDarkMode = ref(document.body.classList.contains('dark-mode'));

// Watch for body class changes to update chart colors
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
            isDarkMode.value = document.body.classList.contains('dark-mode');
        }
    });
});

onMounted(() => {
    observer.observe(document.body, { attributes: true });
    // Initial fetch logic...
    fetchData();
});

const months = [
  'All Months', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// --- Helpers ---
const getMonthName = (dateStr) => new Date(dateStr).toLocaleString('default', { month: 'long' });
const getYear = (dateStr) => new Date(dateStr).getFullYear();
const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(val);

// --- Fetch Data ---
const fetchData = async () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
       error.value = "Please log in to view charts.";
       isLoading.value = false;
       return; 
    }
    const user = JSON.parse(userStr);
    
    const response = await apiFetch(`/api/transactions?userId=${user.id}`);
    const result = await response.json();
    
    if (result.data) {
        transactions.value = result.data;
        const uniqueYears = [...new Set(transactions.value.map(t => getYear(t.date)))];
        availableYears.value = uniqueYears.sort((a, b) => b - a);
        if (availableYears.value.length > 0) selectedYear.value = availableYears.value[0];
    }
  } catch (err) {
    console.error("Graph Fetch Error:", err);
    error.value = "Failed to load chart data.";
  } finally {
    isLoading.value = false;
  }
};

// --- Computed Data ---
const filteredTransactions = computed(() => {
  if (!selectedYear.value) return [];
  let data = transactions.value.filter(t => getYear(t.date) === selectedYear.value);
  if (selectedMonth.value !== 'All Months') {
    data = data.filter(t => getMonthName(t.date) === selectedMonth.value);
  }
  return data.sort((a, b) => new Date(a.date) - new Date(b.date));
});

// --- Chart Config (Dynamic Colors) ---
const textColor = computed(() => isDarkMode.value ? '#ffffff' : '#000000');
const gridColor = computed(() => isDarkMode.value ? '#444444' : '#e0e0e0');

const lineChartData = computed(() => {
  const labels = filteredTransactions.value.map(t => t.date);
  return {
    labels,
    datasets: [
      {
        label: 'Closing Balance',
        borderColor: textColor.value, // Black or White
        backgroundColor: textColor.value,
        data: filteredTransactions.value.map(t => t.closing_balance),
        tension: 0.4, borderWidth: 3, pointRadius: 4,
        pointBackgroundColor: isDarkMode.value ? '#333' : 'white',
        pointBorderColor: textColor.value,
        yAxisID: 'y',
      },
      {
        label: 'Credit',
        borderColor: 'gold', backgroundColor: 'gold',
        data: filteredTransactions.value.map(t => t.credit || 0),
        tension: 0.4, borderWidth: 2, pointRadius: 3, yAxisID: 'y',
      },
      {
        label: 'Debit',
        borderColor: '#708090', backgroundColor: '#708090',
        data: filteredTransactions.value.map(t => t.debit || 0),
        tension: 0.4, borderWidth: 2, pointRadius: 3, yAxisID: 'y',
      }
    ]
  };
});

// Reactive Options to trigger re-render on theme change
const lineChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        font: { family: 'Courier New', weight: 'bold' },
        color: textColor.value // Dynamic Text Color
      }
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      backgroundColor: isDarkMode.value ? '#333' : 'black',
      titleColor: 'gold',
      bodyColor: 'white',
      borderColor: isDarkMode.value ? 'white' : 'black',
      borderWidth: 1
    }
  },
  scales: {
    x: {
      grid: { display: true, borderDash: [5, 5], color: gridColor.value },
      ticks: { color: textColor.value, font: { family: 'Courier New' } }
    },
    y: {
      beginAtZero: true,
      grid: { color: gridColor.value },
      ticks: { color: textColor.value, font: { family: 'Courier New' } }
    }
  }
}));

const pieChartData = computed(() => ({
    labels: ['Credit', 'Debit'],
    datasets: [{
      backgroundColor: ['gold', '#708090'],
      borderColor: textColor.value,
      borderWidth: 3,
      data: [
        filteredTransactions.value.reduce((s, t) => s + (t.credit || 0), 0),
        filteredTransactions.value.reduce((s, t) => s + (t.debit || 0), 0)
      ]
    }]
}));

const pieChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } }
};

const pieTotals = computed(() => {
    const totalCredit = filteredTransactions.value.reduce((sum, t) => sum + (t.credit || 0), 0);
    const totalDebit = filteredTransactions.value.reduce((sum, t) => sum + (t.debit || 0), 0);
    const total = totalCredit + totalDebit || 1; 
    return {
        debit: totalDebit,
        debitPct: ((totalDebit / total) * 100).toFixed(1),
        credit: totalCredit,
        creditPct: ((totalCredit / total) * 100).toFixed(1)
    };
});
</script>

<template>
  <div class="retro-box p-4">
    <div class="header-row">
        <div>
            <h2 style="font-weight: 900; margin:0; color: var(--color-text);">Graph View</h2>
            <p style="margin:0; opacity: 0.7; font-size: 0.9rem; color: var(--color-text);">Charts and visualizations</p>
        </div>
        
        <div class="filters">
            <Filter size="20" style="color: var(--color-text);" />
            <div class="select-wrapper">
                <select v-model="selectedMonth" class="retro-select compact">
                    <option v-for="m in months" :key="m" :value="m">{{ m }}</option>
                </select>
            </div>
            <div class="select-wrapper">
                <select v-model="selectedYear" class="retro-select compact">
                    <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
                </select>
            </div>
        </div>
    </div>

    <div v-if="isLoading" class="loading-state" style="color: var(--color-text);">Loading Charts...</div>
    <div v-else-if="error" style="color: #708090; text-align: center; font-weight: bold;">{{ error }}</div>
    
    <div v-else class="content-grid">
        
        <div class="chart-section">
             <h3 class="section-title" style="color: var(--color-text);">Closing Balance Trend</h3>
             <div style="height: 300px; width: 100%;">
                <Line v-if="filteredTransactions.length" :data="lineChartData" :options="lineChartOptions" />
                <div v-else class="no-data" style="color: var(--color-text);">No data available for this selection.</div>
             </div>
        </div>

        <div class="chart-section pie-section">
             <h3 class="section-title" style="color: var(--color-text);">Debit vs Credit Distribution</h3>
             
             <div class="pie-layout">
                <div class="pie-chart-wrapper">
                    <Pie v-if="filteredTransactions.length" :data="pieChartData" :options="pieChartOptions" />
                    <div v-else class="no-data" style="color: var(--color-text);">No data</div>
                </div>

                <div v-if="filteredTransactions.length" class="pie-legend-text">
                     <div style="color: #708090; font-weight: bold; margin-bottom: 5px;">
                        Debit: {{ formatCurrency(pieTotals.debit) }} ({{ pieTotals.debitPct }}%)
                     </div>
                     <div style="color: goldenrod; font-weight: bold;">
                        Credit: {{ formatCurrency(pieTotals.credit) }} ({{ pieTotals.creditPct }}%)
                     </div>
                </div>
             </div>
        </div>

    </div>
  </div>
</template>

<style scoped>
.p-4 { padding: 20px; }
.header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; flex-wrap: wrap; gap: 15px; }
.filters { display: flex; gap: 10px; align-items: center; }
.compact { padding: 5px 10px; min-width: 120px; }
.content-grid { display: flex; flex-direction: column; gap: 30px; }
.section-title { font-weight: 900; margin-bottom: 15px; font-size: 1rem; }
.pie-section { display: flex; flex-direction: column; align-items: center; }
.pie-layout { display: flex; flex-direction: column; align-items: center; gap: 20px; }

/* Wrapper handles background color based on theme */
.pie-chart-wrapper { 
    height: 300px; width: 300px; position: relative; 
    border: 3px solid var(--color-text); 
    border-radius: 50%; 
    box-shadow: 6px 6px 0px var(--color-text); 
    background: var(--color-bg-main); 
    padding: 2px; overflow: hidden; 
}

/* Legend box handles background color based on theme */
.pie-legend-text { 
    text-align: center; 
    background: var(--color-white); 
    padding: 10px; 
    border: 2px solid var(--color-text); 
    box-shadow: 3px 3px 0px var(--color-text); 
}

.no-data { display: flex; justify-content: center; align-items: center; height: 100%; font-weight: bold; opacity: 0.7; }
.loading-state { text-align: center; font-weight: bold; padding: 40px; }
</style>