/**
 * FinTrack - Aplikasi Utama
 * Mengelola logika utama aplikasi manajemen keuangan
 */

class FinTrack {
    /**
     * Konstruktor aplikasi
     */
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filters = {
            type: 'all',
            category: 'all',
            wallet: 'all',
            date: 'month'
        };
        
        this.init();
    }

    /**
     * Inisialisasi aplikasi
     */
    async init() {
        console.log('🚀 FinTrack Initializing...');
        
        try {
            // Tunggu UI manager siap
            await this.waitForUI();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.loadInitialData();
            
            // Update dashboard
            await this.updateDashboard();
            
            console.log('✅ FinTrack Ready!');
            
            // Show welcome notification
            setTimeout(() => {
                UIManager.showNotification('Selamat datang di FinTrack! Aplikasi siap digunakan.', 'success');
            }, 1000);
            
        } catch (error) {
            console.error('❌ Initialization error:', error);
            UIManager.showNotification('Gagal memuat aplikasi. Silakan refresh halaman.', 'error');
        }
    }

    /**
     * Tunggu UI manager siap
     */
    waitForUI() {
        return new Promise((resolve) => {
            const checkUI = () => {
                if (typeof UIManager !== 'undefined' && UIManager.init) {
                    resolve();
                } else {
                    setTimeout(checkUI, 100);
                }
            };
            checkUI();
        });
    }

    /**
     * Setup event listeners untuk aplikasi
     */
    setupEventListeners() {
        // Add transaction button
        document.getElementById('addTransactionBtn')?.addEventListener('click', () => {
            this.openTransactionModal();
        });

        // Transaction form submission
        document.getElementById('transactionForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTransactionSubmit(e);
        });

        // Filter changes
        document.getElementById('filterType')?.addEventListener('change', (e) => {
            this.filters.type = e.target.value;
            this.updateTransactionsTable();
        });

        document.getElementById('filterCategory')?.addEventListener('change', (e) => {
            this.filters.category = e.target.value;
            this.updateTransactionsTable();
        });

        document.getElementById('filterWallet')?.addEventListener('change', (e) => {
            this.filters.wallet = e.target.value;
            this.updateTransactionsTable();
        });

        document.getElementById('filterDate')?.addEventListener('change', (e) => {
            this.filters.date = e.target.value;
            this.updateTransactionsTable();
        });

        // Chart period changes
        document.getElementById('cashflowPeriod')?.addEventListener('change', () => {
            if (typeof ChartManager !== 'undefined') {
                ChartManager.updateCashflowChart();
            }
        });

        document.getElementById('categoryPeriod')?.addEventListener('change', () => {
            if (typeof ChartManager !== 'undefined') {
                ChartManager.updateCategoryChart();
            }
        });

        // Event delegation untuk transaction actions
        document.addEventListener('click', (e) => {
            // Edit transaction
            if (e.target.closest('.edit-transaction-btn')) {
                const transactionId = e.target.closest('.edit-transaction-btn').dataset.id;
                this.editTransaction(transactionId);
            }
            
            // Delete transaction
            if (e.target.closest('.delete-transaction-btn')) {
                const transactionId = e.target.closest('.delete-transaction-btn').dataset.id;
                this.confirmDeleteTransaction(transactionId);
            }
        });

        // Auto-refresh data setiap 30 detik
        setInterval(() => this.refreshData(), 30000);
    }

    /**
     * Load data awal
     */
    async loadInitialData() {
        console.log('📥 Loading initial data...');
        
        // Update category selects
        UIManager.updateCategorySelects();
        
        // Update recent transactions
        this.updateRecentTransactions();
        
        console.log('✅ Initial data loaded');
    }

    /**
     * Update dashboard dengan data terbaru
     */
    async updateDashboard() {
        console.log('📊 Updating dashboard...');
        
        try {
            const totals = this.calculateTotals();
            this.updateSummaryCards(totals);
            
            if (typeof ChartManager !== 'undefined') {
                ChartManager.updateAll();
            }
            
            this.updateRecentTransactions();
            
            console.log('✅ Dashboard updated');
        } catch (error) {
            console.error('❌ Error updating dashboard:', error);
        }
    }

    /**
     * Hitung total keuangan
     */
    calculateTotals() {
        const transactions = StorageManager.getTransactions();
        const wallets = StorageManager.getWallets();
        const now = new Date();
        
        // Current month transactions
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const currentMonthTransactions = transactions.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === currentMonth && 
                   date.getFullYear() === currentYear &&
                   t.type !== 'transfer';
        });
        
        // Previous month transactions
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        
        const prevMonthTransactions = transactions.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === prevMonth && 
                   date.getFullYear() === prevYear &&
                   t.type !== 'transfer';
        });
        
        // Calculate totals
        const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
        
        const currentIncome = currentMonthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const prevIncome = prevMonthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const currentExpense = currentMonthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const prevExpense = prevMonthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        // Calculate changes
        const incomeChange = this.calculateChange(currentIncome, prevIncome);
        const expenseChange = this.calculateChange(currentExpense, prevExpense);
        const balanceChange = this.calculateChange(totalBalance, 0);
        
        return {
            totalBalance,
            currentIncome,
            prevIncome,
            currentExpense,
            prevExpense,
            incomeChange,
            expenseChange,
            balanceChange
        };
    }

    /**
     * Hitung perubahan persentase
     */
    calculateChange(current, previous) {
        if (previous === 0) {
            return {
                percentage: current > 0 ? 100 : 0,
                trend: current > 0 ? 'positive' : 'neutral',
                amount: current
            };
        }
        
        const change = ((current - previous) / previous) * 100;
        const trend = change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';
        
        return {
            percentage: Math.abs(change),
            trend,
            amount: current - previous
        };
    }

    /**
     * Update summary cards di dashboard
     */
    updateSummaryCards(totals) {
        // Total Balance
        document.getElementById('totalBalance').textContent = 
            UIManager.formatCurrency(totals.totalBalance);
        
        const balanceTrend = document.getElementById('balanceTrend');
        if (balanceTrend) {
            balanceTrend.innerHTML = `
                <i class="fas fa-arrow-${totals.balanceChange.trend === 'positive' ? 'up' : 'down'}"></i>
                <span>${totals.balanceChange.percentage.toFixed(1)}% dari bulan lalu</span>
            `;
            balanceTrend.className = `trend-indicator ${totals.balanceChange.trend}`;
        }
        
        // Monthly Income
        document.getElementById('monthlyIncome').textContent = 
            UIManager.formatCurrency(totals.currentIncome);
        
        const incomeTrend = document.getElementById('incomeTrend');
        if (incomeTrend) {
            incomeTrend.innerHTML = `
                <i class="fas fa-arrow-${totals.incomeChange.trend === 'positive' ? 'up' : 'down'}"></i>
                <span>${totals.incomeChange.percentage.toFixed(1)}% dari bulan lalu</span>
            `;
            incomeTrend.className = `trend-indicator ${totals.incomeChange.trend}`;
        }
        
        // Monthly Expense
        document.getElementById('monthlyExpense').textContent = 
            UIManager.formatCurrency(totals.currentExpense);
        
        const expenseTrend = document.getElementById('expenseTrend');
        if (expenseTrend) {
            expenseTrend.innerHTML = `
                <i class="fas fa-arrow-${totals.expenseChange.trend === 'positive' ? 'up' : 'down'}"></i>
                <span>${Math.abs(totals.expenseChange.percentage).toFixed(1)}% dari bulan lalu</span>
            `;
            expenseTrend.className = `trend-indicator ${totals.expenseChange.trend}`;
        }
    }

    /**
     * Update recent transactions
     */
    updateRecentTransactions() {
        const transactions = StorageManager.getRecentTransactions(5);
        const container = document.getElementById('recentTransactions');
        
        if (!container) return;
        
        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <p>Tidak ada transaksi</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = transactions.map(transaction => 
            UIManager.createTransactionItem(transaction)
        ).join('');
    }

    /**
     * Update transactions table dengan filter
     */
    updateTransactionsTable() {
        let transactions = StorageManager.getTransactions();
        
        // Apply filters
        if (this.filters.type !== 'all') {
            transactions = transactions.filter(t => t.type === this.filters.type);
        }
        
        if (this.filters.category !== 'all') {
            transactions = transactions.filter(t => t.category === this.filters.category);
        }
        
        if (this.filters.wallet !== 'all') {
            transactions = transactions.filter(t => t.wallet === this.filters.wallet);
        }
        
        if (this.filters.date !== 'all') {
            const now = new Date();
            let startDate, endDate;
            
            switch (this.filters.date) {
                case 'today':
                    startDate = new Date();
                    startDate.setHours(0, 0, 0, 0);
                    endDate = new Date();
                    endDate.setHours(23, 59, 59, 999);
                    break;
                    
                case 'week':
                    startDate = new Date();
                    startDate.setDate(now.getDate() - now.getDay());
                    startDate.setHours(0, 0, 0, 0);
                    endDate = new Date(startDate);
                    endDate.setDate(startDate.getDate() + 6);
                    endDate.setHours(23, 59, 59, 999);
                    break;
                    
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    endDate.setHours(23, 59, 59, 999);
                    break;
                    
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    endDate = new Date(now.getFullYear(), 11, 31);
                    endDate.setHours(23, 59, 59, 999);
                    break;
            }
            
            if (startDate && endDate) {
                transactions = transactions.filter(t => {
                    const date = new Date(t.date);
                    return date >= startDate && date <= endDate;
                });
            }
        }
        
        // Sort by date (newest first)
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Pagination
        const totalPages = Math.ceil(transactions.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageTransactions = transactions.slice(startIndex, endIndex);
        
        // Update table
        const container = document.getElementById('transactionsTable');
        if (!container) return;
        
        if (pageTransactions.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <i class="fas fa-receipt"></i>
                        <p>Tidak ada transaksi ditemukan</p>
                    </td>
                </tr>
            `;
        } else {
            container.innerHTML = pageTransactions.map(transaction => 
                UIManager.createTransactionRow(transaction)
            ).join('');
        }
        
        // Update pagination
        UIManager.createPagination(this.currentPage, totalPages, 'transactionsPagination', 'finTrack.changePage');
    }

    /**
     * Change page untuk pagination
     */
    changePage(page) {
        this.currentPage = page;
        this.updateTransactionsTable();
    }

    /**
     * Open transaction modal
     */
    openTransactionModal(transactionData = null) {
        UIManager.openModal('transactionModal');
        
        if (transactionData) {
            // Edit mode
            document.getElementById('transType').value = transactionData.type;
            document.getElementById('transAmount').value = transactionData.amount;
            document.getElementById('transDate').value = transactionData.date;
            document.getElementById('transDescription').value = transactionData.description;
            document.getElementById('transCategory').value = transactionData.category;
            document.getElementById('transWallet').value = transactionData.wallet;
            document.getElementById('transNotes').value = transactionData.notes || '';
            
            UIManager.setTransactionType(transactionData.type);
        } else {
            // Add mode
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('transDate').value = today;
            UIManager.setTransactionType('income');
        }
    }

    /**
     * Handle transaction form submission
     */
    async handleTransactionSubmit(e) {
        e.preventDefault();
        
        const formData = {
            id: UIManager.generateId(),
            type: document.getElementById('transType').value,
            amount: parseFloat(document.getElementById('transAmount').value),
            date: document.getElementById('transDate').value,
            description: document.getElementById('transDescription').value.trim(),
            category: document.getElementById('transCategory').value,
            wallet: document.getElementById('transWallet').value,
            notes: document.getElementById('transNotes').value.trim(),
            createdAt: new Date().toISOString()
        };
        
        // Validation
        if (!formData.amount || formData.amount <= 0) {
            UIManager.showNotification('Jumlah harus lebih dari 0', 'error');
            return;
        }
        
        if (!formData.description) {
            UIManager.showNotification('Deskripsi tidak boleh kosong', 'error');
            return;
        }
        
        if (!formData.category) {
            UIManager.showNotification('Pilih kategori', 'error');
            return;
        }
        
        if (!formData.wallet) {
            UIManager.showNotification('Pilih dompet', 'error');
            return;
        }
        
        try {
            // Update wallet balance
            const wallets = StorageManager.getWallets();
            const walletIndex = wallets.findIndex(w => w.id === formData.wallet);
            
            if (walletIndex !== -1) {
                if (formData.type === 'income') {
                    wallets[walletIndex].balance += formData.amount;
                } else if (formData.type === 'expense') {
                    wallets[walletIndex].balance -= formData.amount;
                }
                StorageManager.saveWallets(wallets);
            }
            
            // Save transaction
            StorageManager.addTransaction(formData);
            
            // Reset form
            e.target.reset();
            UIManager.closeAllModals();
            
            // Update UI
            await this.updateDashboard();
            this.updateTransactionsTable();
            
            if (typeof WalletManager !== 'undefined') {
                WalletManager.loadWallets();
            }
            
            UIManager.showNotification('Transaksi berhasil disimpan!', 'success');
            
        } catch (error) {
            console.error('❌ Transaction error:', error);
            UIManager.showNotification('Gagal menyimpan transaksi', 'error');
        }
    }

    /**
     * Edit transaction
     */
    editTransaction(transactionId) {
        const transactions = StorageManager.getTransactions();
        const transaction = transactions.find(t => t.id === transactionId);
        
        if (transaction) {
            this.openTransactionModal(transaction);
        }
    }

    /**
     * Confirm delete transaction
     */
    confirmDeleteTransaction(transactionId) {
        const transactions = StorageManager.getTransactions();
        const transaction = transactions.find(t => t.id === transactionId);
        
        if (!transaction) return;
        
        // Show confirmation modal
        const modal = document.getElementById('confirmModal');
        const messageElement = document.getElementById('confirmMessage');
        const deleteBtn = document.getElementById('confirmDelete');
        
        messageElement.textContent = `Apakah Anda yakin ingin menghapus transaksi "${transaction.description}"?`;
        
        // Set up delete button
        deleteBtn.onclick = () => {
            this.deleteTransaction(transactionId);
            modal.classList.remove('active');
        };
        
        modal.classList.add('active');
    }

    /**
     * Delete transaction
     */
    async deleteTransaction(transactionId) {
        const transactions = StorageManager.getTransactions();
        const transaction = transactions.find(t => t.id === transactionId);
        
        if (!transaction) return;
        
        try {
            // Reverse wallet balance update
            const wallets = StorageManager.getWallets();
            const walletIndex = wallets.findIndex(w => w.id === transaction.wallet);
            
            if (walletIndex !== -1) {
                if (transaction.type === 'income') {
                    wallets[walletIndex].balance -= transaction.amount;
                } else if (transaction.type === 'expense') {
                    wallets[walletIndex].balance += transaction.amount;
                }
                StorageManager.saveWallets(wallets);
            }
            
            // Delete transaction
            StorageManager.deleteTransaction(transactionId);
            
            // Update UI
            await this.updateDashboard();
            this.updateTransactionsTable();
            
            if (typeof WalletManager !== 'undefined') {
                WalletManager.loadWallets();
            }
            
            UIManager.showNotification('Transaksi berhasil dihapus!', 'success');
            
        } catch (error) {
            console.error('❌ Delete transaction error:', error);
            UIManager.showNotification('Gagal menghapus transaksi', 'error');
        }
    }

    /**
     * Refresh data secara periodik
     */
    refreshData() {
        console.log('🔄 Refreshing data...');
        
        // Update current section
        switch (UIManager.currentSection) {
            case 'dashboard':
                this.updateDashboard();
                break;
                
            case 'transactions':
                this.updateTransactionsTable();
                break;
                
            case 'wallets':
                if (typeof WalletManager !== 'undefined') {
                    WalletManager.loadWallets();
                }
                break;
        }
        
        console.log('✅ Data refreshed');
    }
}

// Inisialisasi aplikasi
let finTrack;

document.addEventListener('DOMContentLoaded', () => {
    finTrack = new FinTrack();
    
    // Expose ke global scope untuk event handlers
    window.finTrack = finTrack;
    window.updateDashboard = () => finTrack.updateDashboard();
    window.updateTransactionsTable = () => finTrack.updateTransactionsTable();

});

// Di dalam setupEventListeners() di app.js, tambahkan:

// Event delegation untuk transaction actions
document.addEventListener('click', (e) => {
    console.log('Click event target:', e.target);
    
    // Edit transaction
    const editBtn = e.target.closest('.edit-transaction-btn');
    if (editBtn) {
        e.preventDefault();
        e.stopPropagation();
        const transactionId = editBtn.dataset.id;
        console.log('Edit transaction clicked:', transactionId);
        this.editTransaction(transactionId);
        return;
    }
    
    // Delete transaction
    const deleteBtn = e.target.closest('.delete-transaction-btn');
    if (deleteBtn) {
        e.preventDefault();
        e.stopPropagation();
        const transactionId = deleteBtn.dataset.id;
        console.log('Delete transaction clicked:', transactionId);
        this.confirmDeleteTransaction(transactionId);
        return;
    }
    
    // Edit wallet (duplicate from wallet.js for safety)
    const editWalletBtn = e.target.closest('.edit-wallet-btn');
    if (editWalletBtn) {
        e.preventDefault();
        e.stopPropagation();
        const walletId = editWalletBtn.dataset.walletId;
        console.log('Edit wallet clicked from app.js:', walletId);
        if (typeof WalletManager !== 'undefined') {
            WalletManager.editWallet(walletId);
        }
        return;
    }
    
    // Delete wallet (duplicate from wallet.js for safety)
    const deleteWalletBtn = e.target.closest('.delete-wallet-btn');
    if (deleteWalletBtn) {
        e.preventDefault();
        e.stopPropagation();
        const walletId = deleteWalletBtn.dataset.walletId;
        console.log('Delete wallet clicked from app.js:', walletId);
        if (typeof WalletManager !== 'undefined') {
            WalletManager.confirmDeleteWallet(walletId);
        }
        return;
    }
});
