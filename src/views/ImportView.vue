<script setup>
import { ref } from 'vue';
import { apiFetch } from '@/api';
import { UploadCloud, CheckCircle } from 'lucide-vue-next';

// --- State ---
const fileInput = ref(null);
const isDragging = ref(false);
const selectedFile = ref(null);
const uploadStatus = ref('');
const isUploading = ref(false);

// Form Options
const activeTab = ref('account');
const isFutureOnly = ref(false); 
const isStrictContinuity = ref(true); 

const accountOptions = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank'];
const creditCardOptions = ['HDFC Regalia', 'ICICI Amazon Pay', 'SBI Cashback', 'Axis Flipkart', 'AMEX Platinum'];
const groupingOptions = ['Monthly', 'None', 'Daily', 'Weekly', 'Quarterly'];

const selectedAccount = ref('State Bank of India');
const selectedSourceBank = ref('State Bank of India');
const selectedGrouping = ref('Monthly');
const selectedCreditCard = ref('');

// --- Actions ---
const triggerFileInput = () => fileInput.value.click();

const handleFileChange = (event) => {
    if (event.target.files.length > 0) {
        selectedFile.value = event.target.files[0];
        uploadStatus.value = '';
    }
};

const removeFile = () => {
    selectedFile.value = null;
    uploadStatus.value = '';
    if (fileInput.value) fileInput.value.value = '';
};

const onDrop = (event) => {
    isDragging.value = false;
    if (event.dataTransfer.files.length > 0) {
        selectedFile.value = event.dataTransfer.files[0];
        uploadStatus.value = '';
    }
};

const processImport = async () => {
    if (!selectedFile.value) {
        alert("Please select a file first.");
        return;
    }

    const userStr = localStorage.getItem('user');
    if (!userStr) {
        alert("Please login first.");
        return;
    }
    const user = JSON.parse(userStr);

    isUploading.value = true;
    const formData = new FormData();
    
    formData.append('file', selectedFile.value);
    formData.append('userId', user.id);
    formData.append('futureOnly', isFutureOnly.value);
    formData.append('strictContinuity', isStrictContinuity.value);
    
    if (activeTab.value === 'account') {
        formData.append('account', selectedAccount.value);
        formData.append('sourceBank', selectedSourceBank.value);
        formData.append('grouping', selectedGrouping.value);
        formData.append('type', 'account');
    } else {
        formData.append('creditCard', selectedCreditCard.value);
        formData.append('type', 'credit');
    }

    try {
        const res = await apiFetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        
        uploadStatus.value = data.message;
    } catch (e) {
        uploadStatus.value = "Error: " + e.message;
    } finally {
        isUploading.value = false;
    }
};

const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
</script>

<template>
  <div class="import-page-container">
      <div class="content-wrapper">
          
        <h2 class="page-title">Import Data from Local Device</h2>
        <p class="page-subtitle">Upload CSV or Excel files to import transaction data</p>

        <div 
            class="upload-zone" 
            :class="{ dragging: isDragging }"
            @click="triggerFileInput"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="onDrop"
        >
            <input type="file" ref="fileInput" style="display: none" accept=".csv, .xlsx, .xls" @change="handleFileChange" />
            
            <div class="upload-content">
                <div class="icon-box">
                    <UploadCloud size="40" class="theme-icon" />
                </div>
                <h3>Click to upload or drag and drop</h3>
                <p>CSV, XLSX or XLS (MAX. 10MB)</p>
            </div>
        </div>

        <div v-if="selectedFile" class="file-preview-bar">
            <div class="file-details">
                <CheckCircle size="24" class="icon-dark" />
                <div class="file-text">
                    <span class="file-name">{{ selectedFile.name }}</span>
                    <span class="file-size">{{ formatSize(selectedFile.size) }}</span>
                </div>
            </div>
            <button class="remove-btn" @click.stop="removeFile">
                Remove
            </button>
        </div>

        <div class="custom-tabs">
            <div 
                class="tab-item" 
                :class="{ 'active': activeTab === 'account' }"
                @click="activeTab = 'account'"
            >
                Account Transaction
            </div>
            <div 
                class="tab-item" 
                :class="{ 'active': activeTab === 'credit' }"
                @click="activeTab = 'credit'"
            >
                Credit Card Transaction
            </div>
        </div>

        <div class="checkbox-container">
            <label class="custom-checkbox">
                <input type="checkbox" v-model="isFutureOnly">
                <span class="checkmark"></span>
                <span>Future Only</span>
            </label>
            <label class="custom-checkbox indented">
                <input type="checkbox" v-model="isStrictContinuity">
                <span class="checkmark"></span>
                <span>Strict Continuity Check</span>
            </label>
        </div>

        <div v-if="activeTab === 'account'" class="form-grid">
            <div class="input-group">
                <label>Account</label>
                <div class="select-wrapper">
                    <select v-model="selectedAccount" class="retro-input">
                        <option value="" disabled>Select account</option>
                        <option v-for="opt in accountOptions" :key="opt">{{ opt }}</option>
                    </select>
                </div>
            </div>
            
            <div class="input-group">
                <label>Source Bank</label>
                <div class="select-wrapper">
                    <select v-model="selectedSourceBank" class="retro-input">
                        <option value="" disabled>Select source bank</option>
                        <option v-for="opt in accountOptions" :key="opt">{{ opt }}</option>
                    </select>
                </div>
            </div>

            <div class="input-group">
                <label>Grouping Function</label>
                <div class="select-wrapper">
                    <select v-model="selectedGrouping" class="retro-input">
                        <option value="" disabled>Select grouping function</option>
                        <option v-for="opt in groupingOptions" :key="opt">{{ opt }}</option>
                    </select>
                </div>
            </div>
        </div>

        <div v-else class="form-grid">
             <div class="input-group">
                <label>Credit Card Selection</label>
                 <div class="select-wrapper">
                    <select v-model="selectedCreditCard" class="retro-input">
                        <option value="" disabled selected>Select credit card</option>
                        <option v-for="opt in creditCardOptions" :key="opt">{{ opt }}</option>
                    </select>
                 </div>
            </div>
        </div>

        <button class="action-btn" @click="processImport" :disabled="isUploading">
            {{ isUploading ? 'Processing...' : 'Process and Import Data' }}
        </button>

        <div v-if="uploadStatus" class="status-message">
            {{ uploadStatus }}
        </div>

      </div>
  </div>
</template>

<style scoped>
/* Container & Layout */
.import-page-container {
    background-color: var(--color-bg-main);
    color: var(--color-text);
    min-height: 100vh;
    padding: 30px;
}

.content-wrapper {
    max-width: 800px;
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

/* Upload Zone */
.upload-zone {
    background-color: #FFC107; /* Signature Gold */
    border: 3px dashed var(--color-text); 
    padding: 40px;
    text-align: center;
    color: black; /* Always black text on gold */
    cursor: pointer;
    margin-bottom: 25px;
    box-shadow: 4px 4px 0px var(--color-text);
    transition: transform 0.1s;
}

.upload-zone:hover {
    transform: translate(-1px, -1px);
    box-shadow: 6px 6px 0px var(--color-text);
}

.icon-box {
    border: 2px solid black;
    display: inline-flex;
    padding: 10px;
    border-radius: 8px;
    margin-bottom: 15px;
}

.theme-icon { color: black; }
.upload-content h3 { margin: 0; font-weight: 900; font-size: 1.1rem; }
.upload-content p { margin: 5px 0 0; font-size: 0.9rem; font-weight: bold; }

/* File Preview Bar */
.file-preview-bar {
    background-color: var(--color-bg-main);
    border: 3px solid var(--color-text);
    padding: 15px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    box-shadow: 4px 4px 0px var(--color-text);
}

.file-details { display: flex; align-items: center; gap: 15px; }
.file-name { font-weight: 900; font-size: 1rem; }
.file-size { font-size: 0.8rem; font-weight: bold; opacity: 0.8; }

.remove-btn {
    background: var(--color-bg-main);
    color: var(--color-text);
    border: 2px solid var(--color-text);
    padding: 8px 20px;
    font-weight: 900;
    cursor: pointer;
    box-shadow: 2px 2px 0px var(--color-text);
}

/* Tabs */
.custom-tabs {
    display: flex;
    border: 3px solid var(--color-text);
    box-shadow: 4px 4px 0px var(--color-text);
    margin-bottom: 25px;
    background: var(--color-text); /* Creates borders between tabs */
    gap: 3px; 
}

.tab-item {
    flex: 1;
    padding: 12px;
    text-align: center;
    font-weight: 900;
    cursor: pointer;
    border: none;
    background-color: var(--color-bg-main);
    color: var(--color-text);
}

.tab-item.active {
    background-color: #FFC107; /* Signature Gold */
    color: black; 
}

/* Checkboxes */
.checkbox-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 25px;
}

.custom-checkbox {
    display: flex;
    align-items: center;
    font-weight: 900;
    font-size: 1rem;
    cursor: pointer;
    user-select: none;
}

.custom-checkbox.indented { margin-left: 35px; }
.custom-checkbox input { opacity: 0; position: absolute; height: 0; width: 0; }

.checkmark {
    width: 24px;
    height: 24px;
    background-color: var(--color-bg-main);
    border: 3px solid var(--color-text);
    border-radius: 6px;
    margin-right: 12px;
    position: relative;
    box-shadow: 2px 2px 0px var(--color-text);
    transition: all 0.2s;
    flex-shrink: 0; 
}

.checkmark::after {
    content: "";
    position: absolute;
    display: none;
    left: 6px;
    top: 2px;
    width: 6px;
    height: 12px;
    border: solid var(--color-text);
    border-width: 0 3px 3px 0;
    transform: rotate(45deg);
}

.custom-checkbox input:checked + .checkmark::after { display: block; }

/* Form Fields */
.form-grid {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 30px;
}

.input-group label {
    display: block;
    font-weight: 900;
    margin-bottom: 8px;
}

.retro-input {
    width: 100%;
    padding: 12px 15px;
    border: 3px solid var(--color-text);
    font-weight: 900;
    font-size: 1rem;
    box-shadow: 4px 4px 0px var(--color-text);
    outline: none;
    background-color: var(--color-bg-main);
    color: var(--color-text);
    font-family: inherit; 
    cursor: pointer;
}

/* Action Button */
.action-btn {
    width: 100%;
    padding: 15px;
    border: 3px solid var(--color-text);
    background-color: #FFC107; /* Signature Gold */
    color: black;
    font-weight: 900;
    font-size: 1.1rem;
    text-transform: uppercase;
    cursor: pointer;
    box-shadow: 6px 6px 0px var(--color-text);
    transition: all 0.1s;
}

.action-btn:hover {
    transform: translate(-1px, -1px);
    box-shadow: 8px 8px 0px var(--color-text);
}

.action-btn:disabled {
    opacity: 0.7;
    cursor: wait;
}

/* Status Message */
.status-message {
    margin-top: 20px;
    padding: 15px;
    background-color: var(--color-bg-main);
    border: 3px solid var(--color-text);
    font-weight: bold;
    text-align: center;
    box-shadow: 4px 4px 0px var(--color-text);
}
</style>