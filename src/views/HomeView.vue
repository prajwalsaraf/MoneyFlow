<script setup>
import { ref, reactive, onMounted } from 'vue';
import { api } from '@/api';

const showModal = ref(false);
const accounts = ref([]);
const isLoading = ref(true);

const fetchAccounts = async () => {
  try {
    const response = await api.getAccounts();
    // DRF Pagination stores the list in 'results'
    accounts.value = response.data.results; 
  } catch (error) {
    console.error("Failed to load accounts:", error);
  } finally {
    isLoading.value = false;
  }
};

const form = reactive({
  name: 'HDFC',
  acc_no: 12345678901,
  ifsc_code: 'HDFC1324',
  acc_type: 'Savings',
  min_bal: 1000,
  dis_bal: 10000,
  def_parser: 'HDFC',
  def_grouper: 'HDFC',
  currency: 'INR'
});

const submitAccount = async () => {
  try {
    const response = await api.post('accounts/', form);
    console.log('Success:', response.data);
    showModal.value = false;
    alert('Account added successfully!');
  } catch (error) {
    console.error('Error adding account:', error);
    alert('Failed to add account. Check the console.');
  }
};

const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
};

onMounted(() => {
  fetchAccounts();
});
</script>

<template>
  <div style="height: 100%; display: flex; justify-content: center; align-items: center;">
        <div class="retro-box center-message">
            <h2 style="font-weight: 900; font-size: 1.5rem;">Welcome to Home</h2>
            <!-- <p style="font-weight: bold; color: #555;">Select a navigation item to view content</p> -->
            <button @click="showModal = true" class="retro-btn">Add Bank Account</button>

            <div v-if="showModal" class="modal-overlay">
                <div class="modal-content">
                    <h2>Add New Account</h2>
                    <form @submit.prevent="submitAccount">
                        <input v-model="form.name" placeholder="Bank Name (e.g. HDFC)" required />
                        <input v-model.number="form.acc_no" placeholder="Account Number" required />
                        <input v-model="form.ifsc_code" placeholder="IFSC Code" />
                        
                        <select v-model="form.acc_type">
                            <option value="Savings">Savings</option>
                            <option value="Current">Current</option>
                        </select>

                        <input v-model.number="form.min_bal" type="number" placeholder="Min Balance" />
                        <input v-model.number="form.dis_bal" type="number" placeholder="Desired Balance" />
                        <input v-model.number="form.def_parser" placeholder="Default Parser" />
                        <input v-model.number="form.def_grouper" placeholder="Default Grouper" />
                        <input v-model.number="form.currency" placeholder="Currency (Eg. USD)" />
                        
                        <div class="actions" style="display: flex;align-self: center;">
                            <button type="button" @click="showModal = false " class="retro-btn">Cancel</button>
                            <button type="submit" class="retro-btn">Submit</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <div class="retro-box" style="padding: 10px;margin-left: 50px;">
            <h2>All Added Bank Accounts</h2>
            <div v-if="isLoading">Loading accounts...</div>

            <table v-else-if="accounts.length > 0" class="retro-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Number</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="account in accounts" :key="account.acc_no">
                        <td>{{ account.name }}</td>
                        <td>{{ account.acc_no }}</td>
                    </tr>
                </tbody>
            </table>

            <div v-else>No accounts found. Click the button above to add one!</div>
        </div>
    </div>
</template>

<style scoped>
.center-message {
    padding: 30px 50px;
    text-align: center;
    /* The specific heavy shadow look from Image 0 */
    box-shadow: 8px 8px 0px black; 
}
</style>