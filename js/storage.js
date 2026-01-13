/**
 * Storage Manager untuk FinTrack
 * Mengelola penyimpanan data dengan LocalStorage
 */

class StorageManager {
    /**
     * Konstanta untuk key storage
     */
    static KEYS = {
        TRANSACTIONS: 'finTrack_transactions',
        CATEGORIES: 'finTrack_categories',
        WALLETS: 'finTrack_wallets',
        SETTINGS: 'finTrack_settings',
        THEME: 'finTrack_theme',
        HIDE_BALANCE: 'finTrack_hide_balance'
    };

    /**
     * Inisialisasi data default jika kosong
     */
    static init() {
        console.log('💾 Initializing storage...');
        
        // Initialize categories jika kosong
        if (!this.getCategories().length) {
            this.initDefaultCategories();
        }
        
        // Initialize wallets jika kosong
        if (!this.getWallets().length) {
            this.initDefaultWallets();
        }
        
        // Initialize settings jika kosong
        if (!this.getSettings()) {
            this.initDefaultSettings();
        }
        
        console.log('✅ Storage initialized');
    }

    /**
     * Simpan data ke localStorage
     * @param {string} key - Storage key
     * @param {any} data - Data untuk disimpan
     */
    static save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('❌ Error saving to localStorage:', error);
            return false;
        }
    }

    /**
     * Ambil data dari localStorage
     * @param {string} key - Storage key
     * @param {any} defaultValue - Nilai default jika tidak ditemukan
     * @returns {any} Data yang diambil
     */
    static get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('❌ Error reading from localStorage:', error);
            return defaultValue;
        }
    }

    /**
     * Hapus data dari localStorage
     * @param {string} key - Storage key
     */
    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('❌ Error removing from localStorage:', error);
            return false;
        }
    }

    /**
     * Simpan transaksi
     * @param {Array} transactions - Array transaksi
     */
    static saveTransactions(transactions) {
        return this.save(this.KEYS.TRANSACTIONS, transactions);
    }

    /**
     * Ambil semua transaksi
     * @returns {Array} Array transaksi
     */
    static getTransactions() {
        return this.get(this.KEYS.TRANSACTIONS, []);
    }

    /**
     * Tambah transaksi baru
     * @param {Object} transaction - Data transaksi
     */
    static addTransaction(transaction) {
        const transactions = this.getTransactions();
        transactions.unshift(transaction);
        return this.saveTransactions(transactions);
    }

    /**
     * Update transaksi
     * @param {string} id - ID transaksi
     * @param {Object} updates - Data yang diupdate
     */
    static updateTransaction(id, updates) {
        const transactions = this.getTransactions();
        const index = transactions.findIndex(t => t.id === id);
        
        if (index !== -1) {
            transactions[index] = { ...transactions[index], ...updates };
            return this.saveTransactions(transactions);
        }
        
        return false;
    }

    /**
     * Hapus transaksi
     * @param {string} id - ID transaksi
     */
    static deleteTransaction(id) {
        const transactions = this.getTransactions();
        const filtered = transactions.filter(t => t.id !== id);
        return this.saveTransactions(filtered);
    }

    /**
     * Simpan kategori
     * @param {Array} categories - Array kategori
     */
    static saveCategories(categories) {
        return this.save(this.KEYS.CATEGORIES, categories);
    }

    /**
     * Ambil semua kategori
     * @returns {Array} Array kategori
     */
    static getCategories() {
        return this.get(this.KEYS.CATEGORIES, []);
    }

    /**
     * Tambah kategori baru
     * @param {Object} category - Data kategori
     */
    static addCategory(category) {
        const categories = this.getCategories();
        categories.push(category);
        return this.saveCategories(categories);
    }

    /**
     * Update kategori
     * @param {string} id - ID kategori
     * @param {Object} updates - Data yang diupdate
     */
    static updateCategory(id, updates) {
        const categories = this.getCategories();
        const index = categories.findIndex(c => c.id === id);
        
        if (index !== -1) {
            categories[index] = { ...categories[index], ...updates };
            return this.saveCategories(categories);
        }
        
        return false;
    }

    /**
     * Hapus kategori
     * @param {string} id - ID kategori
     */
    static deleteCategory(id) {
        const categories = this.getCategories();
        const filtered = categories.filter(c => c.id !== id);
        return this.saveCategories(filtered);
    }

    /**
     * Simpan dompet
     * @param {Array} wallets - Array dompet
     */
    static saveWallets(wallets) {
        return this.save(this.KEYS.WALLETS, wallets);
    }

    /**
     * Ambil semua dompet
     * @returns {Array} Array dompet
     */
    static getWallets() {
        return this.get(this.KEYS.WALLETS, []);
    }

    /**
     * Tambah dompet baru
     * @param {Object} wallet - Data dompet
     */
    static addWallet(wallet) {
        const wallets = this.getWallets();
        wallets.push(wallet);
        return this.saveWallets(wallets);
    }

    /**
     * Update dompet
     * @param {string} id - ID dompet
     * @param {Object} updates - Data yang diupdate
     */
    static updateWallet(id, updates) {
        const wallets = this.getWallets();
        const index = wallets.findIndex(w => w.id === id);
        
        if (index !== -1) {
            wallets[index] = { ...wallets[index], ...updates };
            return this.saveWallets(wallets);
        }
        
        return false;
    }

    /**
     * Hapus dompet
     * @param {string} id - ID dompet
     */
    static deleteWallet(id) {
        const wallets = this.getWallets();
        const filtered = wallets.filter(w => w.id !== id);
        return this.saveWallets(filtered);
    }

    /**
     * Update saldo dompet
     * @param {string} walletId - ID dompet
     * @param {number} amount - Jumlah perubahan (+/-)
     * @param {string} type - Tipe transaksi (income/expense)
     */
    static updateWalletBalance(walletId, amount, type) {
        const wallets = this.getWallets();
        const wallet = wallets.find(w => w.id === walletId);
        
        if (wallet) {
            if (type === 'income') {
                wallet.balance += amount;
            } else if (type === 'expense') {
                wallet.balance -= amount;
            }
            return this.saveWallets(wallets);
        }
        
        return false;
    }

    /**
     * Transfer antar dompet
     * @param {string} fromWalletId - ID dompet asal
     * @param {string} toWalletId - ID dompet tujuan
     * @param {number} amount - Jumlah transfer
     */
    static transferWalletBalance(fromWalletId, toWalletId, amount) {
        const wallets = this.getWallets();
        const fromWallet = wallets.find(w => w.id === fromWalletId);
        const toWallet = wallets.find(w => w.id === toWalletId);
        
        if (fromWallet && toWallet && fromWallet.balance >= amount) {
            fromWallet.balance -= amount;
            toWallet.balance += amount;
            return this.saveWallets(wallets);
        }
        
        return false;
    }

    /**
     * Simpan settings
     * @param {Object} settings - Data settings
     */
    static saveSettings(settings) {
        return this.save(this.KEYS.SETTINGS, settings);
    }

    /**
     * Ambil settings
     * @returns {Object} Data settings
     */
    static getSettings() {
        return this.get(this.KEYS.SETTINGS, {});
    }

    /**
     * Update setting
     * @param {string} key - Setting key
     * @param {any} value - Setting value
     */
    static updateSetting(key, value) {
        const settings = this.getSettings();
        settings[key] = value;
        return this.saveSettings(settings);
    }

    /**
     * Get theme
     * @returns {string} Tema saat ini (light/dark)
     */
    static getTheme() {
        return localStorage.getItem(this.KEYS.THEME) || 'light';
    }

    /**
     * Set theme
     * @param {string} theme - Tema baru (light/dark)
     */
    static setTheme(theme) {
        localStorage.setItem(this.KEYS.THEME, theme);
    }

    /**
     * Get hide balance status
     * @returns {boolean} Status hide balance
     */
    static getHideBalance() {
        return localStorage.getItem(this.KEYS.HIDE_BALANCE) === 'true';
    }

    /**
     * Set hide balance status
     * @param {boolean} hide - Status hide balance
     */
    static setHideBalance(hide) {
        localStorage.setItem(this.KEYS.HIDE_BALANCE, hide.toString());
    }

    /**
     * Inisialisasi kategori default
     */
    static initDefaultCategories() {
        const defaultCategories = [
            // Income categories
            { id: 'inc_1', name: 'Gaji', type: 'income', icon: 'money-bill-wave', color: '#10b981' },
            { id: 'inc_2', name: 'Investasi', type: 'income', icon: 'chart-line', color: '#06b6d4' },
            { id: 'inc_3', name: 'Bonus', type: 'income', icon: 'gift', color: '#f59e0b' },
            { id: 'inc_4', name: 'Lainnya', type: 'income', icon: 'ellipsis-h', color: '#8b5cf6' },
            
            // Expense categories
            { id: 'exp_1', name: 'Makanan', type: 'expense', icon: 'utensils', color: '#ef4444' },
            { id: 'exp_2', name: 'Transportasi', type: 'expense', icon: 'car', color: '#8b5cf6' },
            { id: 'exp_3', name: 'Belanja', type: 'expense', icon: 'shopping-cart', color: '#ec4899' },
            { id: 'exp_4', name: 'Hiburan', type: 'expense', icon: 'film', color: '#f97316' },
            { id: 'exp_5', name: 'Kesehatan', type: 'expense', icon: 'heartbeat', color: '#14b8a6' },
            { id: 'exp_6', name: 'Pendidikan', type: 'expense', icon: 'graduation-cap', color: '#84cc16' },
            { id: 'exp_7', name: 'Tagihan', type: 'expense', icon: 'file-invoice', color: '#06b6d4' },
            { id: 'exp_8', name: 'Lainnya', type: 'expense', icon: 'ellipsis-h', color: '#64748b' }
        ];
        
        this.saveCategories(defaultCategories);
        console.log('📋 Default categories initialized');
    }

    /**
     * Inisialisasi dompet default
     */
    static initDefaultWallets() {
        const defaultWallets = [
            { 
                id: 'wal_1', 
                name: 'Dompet Utama', 
                type: 'cash', 
                balance: 1000000, 
                color: '#4f46e5',
                createdAt: new Date().toISOString()
            },
            { 
                id: 'wal_2', 
                name: 'Rekening BCA', 
                type: 'bank', 
                balance: 5000000, 
                color: '#10b981',
                createdAt: new Date().toISOString()
            },
            { 
                id: 'wal_3', 
                name: 'OVO', 
                type: 'ewallet', 
                balance: 500000, 
                color: '#f59e0b',
                createdAt: new Date().toISOString()
            }
        ];
        
        this.saveWallets(defaultWallets);
        console.log('💰 Default wallets initialized');
    }

    /**
     * Inisialisasi settings default
     */
    static initDefaultSettings() {
        const defaultSettings = {
            currency: 'IDR',
            dateFormat: 'id-ID',
            firstDayOfWeek: 0,
            decimalPlaces: 0
        };
        
        this.saveSettings(defaultSettings);
        console.log('⚙️ Default settings initialized');
    }

    /**
     * Export semua data sebagai JSON
     * @returns {string} JSON string
     */
    static exportData() {
        const data = {
            transactions: this.getTransactions(),
            categories: this.getCategories(),
            wallets: this.getWallets(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
        
        return JSON.stringify(data, null, 2);
    }

    /**
     * Import data dari JSON
     * @param {string} jsonData - JSON string
     * @returns {boolean} Success status
     */
    static importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            // Validasi data
            if (!data.transactions || !data.categories || !data.wallets) {
                throw new Error('Format data tidak valid');
            }
            
            // Simpan data
            this.saveTransactions(data.transactions);
            this.saveCategories(data.categories);
            this.saveWallets(data.wallets);
            
            if (data.settings) {
                this.saveSettings(data.settings);
            }
            
            console.log('📥 Data imported successfully');
            return true;
        } catch (error) {
            console.error('❌ Error importing data:', error);
            return false;
        }
    }

    /**
     * Clear semua data
     * @returns {boolean} Success status
     */
    static clearAllData() {
        try {
            this.remove(this.KEYS.TRANSACTIONS);
            this.remove(this.KEYS.CATEGORIES);
            this.remove(this.KEYS.WALLETS);
            this.remove(this.KEYS.SETTINGS);
            
            // Initialize kembali dengan data default
            this.init();
            
            console.log('🗑️ All data cleared');
            return true;
        } catch (error) {
            console.error('❌ Error clearing data:', error);
            return false;
        }
    }

    /**
     * Get statistics
     * @returns {Object} Statistics data
     */
    static getStatistics() {
        const transactions = this.getTransactions();
        const categories = this.getCategories();
        const wallets = this.getWallets();
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Filter transaksi bulan ini
        const monthlyTransactions = transactions.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === currentMonth && 
                   date.getFullYear() === currentYear &&
                   t.type !== 'transfer';
        });
        
        // Hitung total
        const totalIncome = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const totalExpense = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
        
        return {
            totalTransactions: transactions.length,
            totalCategories: categories.length,
            totalWallets: wallets.length,
            totalBalance,
            monthlyIncome: totalIncome,
            monthlyExpense: totalExpense,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Get recent transactions
     * @param {number} limit - Jumlah transaksi terbaru
     * @returns {Array} Recent transactions
     */
    static getRecentTransactions(limit = 5) {
        const transactions = this.getTransactions();
        
        return transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }

    /**
     * Get transactions by date range
     * @param {Date} startDate - Tanggal mulai
     * @param {Date} endDate - Tanggal akhir
     * @returns {Array} Filtered transactions
     */
    static getTransactionsByDateRange(startDate, endDate) {
        const transactions = this.getTransactions();
        
        return transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= startDate && transactionDate <= endDate;
        });
    }

    /**
     * Get transactions by category
     * @param {string} categoryId - ID kategori
     * @returns {Array} Filtered transactions
     */
    static getTransactionsByCategory(categoryId) {
        const transactions = this.getTransactions();
        
        return transactions.filter(t => t.category === categoryId);
    }

    /**
     * Get transactions by wallet
     * @param {string} walletId - ID dompet
     * @returns {Array} Filtered transactions
     */
    static getTransactionsByWallet(walletId) {
        const transactions = this.getTransactions();
        
        return transactions.filter(t => t.wallet === walletId);
    }

    /**
     * Generate unique ID
     * @returns {string} Unique ID
     */
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Format currency
     * @param {number} amount - Jumlah uang
     * @returns {string} Formatted currency
     */
    static formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Format date
     * @param {string|Date} date - Tanggal
     * @returns {string} Formatted date
     */
    static formatDate(date) {
        return new Date(date).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Format short date
     * @param {string|Date} date - Tanggal
     * @returns {string} Short formatted date
     */
    static formatShortDate(date) {
        return new Date(date).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }
}

// Auto-initialize storage
document.addEventListener('DOMContentLoaded', () => {
    StorageManager.init();
});