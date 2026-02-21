<script setup>
import { ref, onMounted, computed } from 'vue';
import { apiFetch } from '@/api';
import { Download, FileText, FileSpreadsheet } from 'lucide-vue-next';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- State ---
const transactions = ref([]);
const availableYears = ref([]);
const isLoading = ref(false);
const exportStatus = ref('');

// Filter Models
const selectedYear = ref('All Years');
const selectedMonth = ref('All Months');
const selectedFormat = ref('csv'); // 'csv' or 'pdf'

const months = [
  'All Months', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// --- Helpers ---
const getYear = (dateStr) => new Date(dateStr).getFullYear();
const getMonthName = (dateStr) => new Date(dateStr).toLocaleString('default', { month: 'long' });
const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

// --- Fetch Data ---
onMounted(async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    try {
        const response = await apiFetch(`/api/transactions?userId=${user.id}`);
        const result = await response.json();
        transactions.value = result.data || [];

        // Extract Years
        const uniqueYears = [...new Set(transactions.value.map(t => getYear(t.date)))];
        availableYears.value = uniqueYears.sort((a, b) => b - a);
    } catch (e) {
        console.error("Error fetching data for export", e);
    }
});

// --- Filter Logic (FIXED) ---
const filteredData = computed(() => {
    let data = transactions.value;

    // Filter by Year (Safe String Comparison)
    if (selectedYear.value !== 'All Years') {
        data = data.filter(t => String(getYear(t.date)) === String(selectedYear.value));
    }

    // Filter by Month
    if (selectedMonth.value !== 'All Months') {
        data = data.filter(t => getMonthName(t.date) === selectedMonth.value);
    }

    return data;
});

// --- Export Functions ---

const handleExport = () => {
    // Check filteredData length, NOT transactions length
    if (filteredData.value.length === 0) {
        alert("No data found for the selected filter criteria.");
        return;
    }

    isLoading.value = true;
    exportStatus.value = '';
    
    // Small delay to allow UI to update
    setTimeout(() => {
        try {
            if (selectedFormat.value === 'csv') generateCSV();
            else generatePDF();
            exportStatus.value = `Successfully exported ${filteredData.value.length} records.`;
        } catch (e) {
            console.error(e);
            exportStatus.value = "Export failed. Check console.";
        } finally {
            isLoading.value = false;
        }
    }, 500); 
};

const generateCSV = () => {
    // Define Headers
    const headers = ['ID', 'Date', 'Narration', 'Debit', 'Credit', 'Ref', 'Closing Balance'];
    
    // Map FILTERED Data to Rows
    const rows = filteredData.value.map(t => [
        t.id,
        t.date,
        `"${t.narration.replace(/"/g, '""')}"`, // Escape quotes for CSV
        t.debit || 0,
        t.credit || 0,
        t.chq_ref || '',
        t.closing_balance
    ]);

    // Combine Headers and Rows
    const csvContent = [
        headers.join(','), 
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Create Download Link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Report_${selectedYear.value}_${selectedMonth.value}.csv`;
    link.click();
};
const formatCurrencyPDF = (val) => {
    if (val === null || val === undefined) return '-';
    // Returns "Rs. 50,000.00" instead of "₹50,000.00" to avoid encoding errors
    return 'Rs. ' + new Intl.NumberFormat('en-IN', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    }).format(val);
};

const generatePDF = () => {
    const doc = new jsPDF();

    // Title Section
    doc.setFontSize(16);
    doc.text(`Transaction Report`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Filter: ${selectedMonth.value}, ${selectedYear.value}`, 14, 22);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 27);

    // Table Columns
    const tableColumn = ["Date", "Narration", "Debit", "Credit", "Balance"];
    
    // Map FILTERED Data using the SAFE PDF formatter
    const tableRows = filteredData.value.map(t => [
        t.date,
        t.narration, // Ensure no special chars here if possible
        t.debit ? formatCurrencyPDF(t.debit) : '-',
        t.credit ? formatCurrencyPDF(t.credit) : '-',
        formatCurrencyPDF(t.closing_balance)
    ]);

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [255, 193, 7], textColor: 0, lineColor: 0 }, 
        styles: { fontSize: 9, cellPadding: 3, font: 'helvetica' }, // Force helvetica
    });

    doc.save(`Report_${selectedYear.value}_${selectedMonth.value}.pdf`);
};
</script>

<template>
  <div class="export-page-container">
    <div class="content-wrapper">
        
        <h2 class="page-title">Export Data</h2>
        <p class="page-subtitle">Download your transaction history based on filters</p>

        <div class="section-box">
            <h3 class="section-header">1. Select Period</h3>
            <div class="form-grid">
                <div class="input-group">
                    <label>Month</label>
                    <div class="select-wrapper">
                        <select v-model="selectedMonth" class="retro-input">
                            <option v-for="m in months" :key="m" :value="m">{{ m }}</option>
                        </select>
                    </div>
                </div>
                <div class="input-group">
                    <label>Year</label>
                    <div class="select-wrapper">
                        <select v-model="selectedYear" class="retro-input">
                            <option value="All Years">All Years</option>
                            <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <div class="section-box">
            <h3 class="section-header">2. Select Format</h3>
            <div class="format-options">
                <div 
                    class="format-card" 
                    :class="{ active: selectedFormat === 'csv' }"
                    @click="selectedFormat = 'csv'"
                >
                    <div class="radio-circle">
                        <div class="radio-inner"></div>
                    </div>
                    <FileSpreadsheet size="32" />
                    <div class="format-text">
                        <span class="fmt-title">CSV</span>
                        <span class="fmt-desc">Excel compatible</span>
                    </div>
                </div>

                <div 
                    class="format-card" 
                    :class="{ active: selectedFormat === 'pdf' }"
                    @click="selectedFormat = 'pdf'"
                >
                    <div class="radio-circle">
                        <div class="radio-inner"></div>
                    </div>
                    <FileText size="32" />
                    <div class="format-text">
                        <span class="fmt-title">PDF Document</span>
                        <span class="fmt-desc">Print ready</span>
                    </div>
                </div>
            </div>
        </div>

        <button class="action-btn" @click="handleExport" :disabled="isLoading">
            <Download v-if="!isLoading" size="20" style="margin-right: 10px;"/>
            {{ isLoading ? 'Generating File...' : 'Download File' }}
        </button>

        <div v-if="exportStatus" class="status-message">
            {{ exportStatus }}
        </div>

    </div>
  </div>
</template>

<style scoped>
/* Use Global Theme Variables defined in main.css/ImportView */
.export-page-container {
    background-color: var(--color-bg-main);
    color: var(--color-text);
    min-height: 100vh;
    padding: 30px;
}

.content-wrapper {
    max-width: 600px;
    margin: 0 auto;
}

.page-title {
    font-weight: 900;
    font-size: 1.5rem;
    margin-bottom: 5px;
}

.page-subtitle {
    margin-top: 0;
    font-weight: 600;
    margin-bottom: 30px;
    opacity: 0.7;
}

.section-box {
    margin-bottom: 30px;
}

.section-header {
    border-bottom: 3px solid var(--color-text);
    padding-bottom: 10px;
    margin-bottom: 20px;
    font-weight: 900;
}

/* Form Grid */
.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.input-group label {
    display: block;
    font-weight: 900;
    margin-bottom: 8px;
}

.retro-input {
    width: 100%;
    padding: 12px;
    border: 3px solid var(--color-text);
    font-weight: 900;
    box-shadow: 4px 4px 0px var(--color-text);
    outline: none;
    background-color: var(--color-bg-main);
    color: var(--color-text);
    font-family: inherit;
    cursor: pointer;
}

/* Format Cards */
.format-options {
    display: flex;
    gap: 20px;
}

.format-card {
    flex: 1;
    border: 3px solid var(--color-text);
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    background-color: var(--color-bg-main);
    box-shadow: 4px 4px 0px var(--color-text);
    transition: transform 0.1s;
    position: relative;
}

.format-card:hover {
    transform: translate(-1px, -1px);
    background-color: rgba(255, 193, 7, 0.1);
}

.format-card.active {
    background-color: #FFC107; /* Gold */
    color: black;
}
:global(body.dark-mode) .format-card.active {
    color: black;
    border-color: white; 
}

/* Custom Radio Circle */
.radio-circle {
    width: 20px; height: 20px;
    border: 2px solid currentColor;
    border-radius: 50%;
    position: absolute;
    top: 10px; right: 10px;
    display: flex; justify-content: center; align-items: center;
}

.radio-inner {
    width: 10px; height: 10px;
    background-color: black;
    border-radius: 50%;
    display: none;
}
.format-card.active .radio-inner { display: block; }

.format-text { text-align: center; }
.fmt-title { display: block; font-weight: 900; font-size: 1.1rem; }
.fmt-desc { display: block; font-size: 0.8rem; font-weight: bold; opacity: 0.8; }

/* Action Button */
.action-btn {
    width: 100%;
    padding: 15px;
    border: 3px solid var(--color-text);
    background-color: #FFC107; /* Gold */
    color: black;
    font-weight: 900;
    font-size: 1.1rem;
    text-transform: uppercase;
    cursor: pointer;
    box-shadow: 6px 6px 0px var(--color-text);
    display: flex; justify-content: center; align-items: center;
}

.action-btn:hover {
    transform: translate(-1px, -1px);
    box-shadow: 8px 8px 0px var(--color-text);
}

.action-btn:disabled {
    opacity: 0.7;
    cursor: wait;
}

.status-message {
    margin-top: 20px;
    padding: 15px;
    border: 3px solid var(--color-text);
    text-align: center;
    font-weight: 900;
    box-shadow: 4px 4px 0px var(--color-text);
}
</style>