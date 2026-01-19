/**
 * FILE: app.js
 * DESKRIPSI: File utama aplikasi, mengelola inisialisasi, navigasi, dan fungsi umum
 */

// Data aplikasi (simulasi database di localStorage)
const appData = {
    // Data default jika tidak ada data di localStorage
    defaultWallets: [
        { id: 1, name: "Dompet Utama", type: "cash", balance: 5000000, color: "#4a6bff", createdAt: new Date().toISOString() },
        { id: 2, name: "Rekening BCA", type: "bank", balance: 15000000, color: "#28a745", createdAt: new Date().toISOString() },
        { id: 3, name: "OVO", type: "digital", balance: 2500000, color: "#6f42c1", createdAt: new Date().toISOString() }
    ],
    
    defaultCategories: [
        { id: 1, name: "Gaji", type: "income", color: "#28a745" },
        { id: 2, name: "Investasi", type: "income", color: "#20c997" },
        { id: 3, name: "Hadiah", type: "income", color: "#17a2b8" },
        { id: 4, name: "Makanan & Minuman", type: "expense", color: "#dc3545" },
        { id: 5, name: "Transportasi", type: "expense", color: "#fd7e14" },
        { id: 6, name: "Belanja", type: "expense", color: "#e83e8c" },
        { id: 7, name: "Hiburan", type: "expense", color: "#6f42c1" },
        { id: 8, name: "Kesehatan", type: "expense", color: "#20c997" },
        { id: 9, name: "Pendidikan", type: "expense", color: "#17a2b8" },
        { id: 10, name: "Tagihan", type: "expense", color: "#6c757d" }
    ],
    
    defaultTransactions: [
        { 
            id: 1, 
            description: "Gaji Bulanan", 
            amount: 7500000, 
            type: "income", 
            categoryId: 1, 
            walletId: 2, 
            date: new Date(new Date().getFullYear(), new Date().getMonth(), 5).toISOString(), 
            notes: "Gaji dari perusahaan",
            createdAt: new Date().toISOString()
        },
        { 
            id: 2, 
            description: "Belanja Bulanan", 
            amount: 1200000, 
            type: "expense", 
            categoryId: 4, 
            walletId: 1, 
            date: new Date(new Date().getFullYear(), new Date().getMonth(), 10).toISOString(), 
            notes: "Belanja kebutuhan bulanan",
            createdAt: new Date().toISOString()
        },
        { 
            id: 3, 
            description: "Bensin Motor", 
            amount: 50000, 
            type: "expense", 
            categoryId: 5, 
            walletId: 1, 
            date: new Date(new Date().getFullYear(), new Date().getMonth(), 12).toISOString(), 
            notes: "",
            createdAt: new Date().toISOString()
        },
        { 
            id: 4, 
            description: "Bayar Listrik", 
            amount: 450000, 
            type: "expense", 
            categoryId: 10, 
            walletId: 2, 
            date: new Date(new Date().getFullYear(), new Date().getMonth(), 15).toISOString(), 
            notes: "Tagihan bulan April",
            createdAt: new Date().toISOString()
        },
        { 
            id: 5, 
            description: "Nonton Bioskop", 
            amount: 120000, 
            type: "expense", 
            categoryId: 7, 
            walletId: 3, 
            date: new Date(new Date().getFullYear(), new Date().getMonth(), 18).toISOString(), 
            notes: "Nonton film Avengers",
            createdAt: new Date().toISOString()
        },
        { 
            id: 6, 
            description: "Dividen Saham", 
            amount: 350000, 
            type: "income", 
            categoryId: 2, 
            walletId: 2, 
            date: new Date(new Date().getFullYear(), new Date().getMonth(), 20).toISOString(), 
            notes: "Dividen saham BBCA",
            createdAt: new Date().toISOString()
        }
    ],
    
    defaultBudgets: [
        { id: 1, categoryId: 4, amount: 1500000, month: new Date().getMonth() + 1, year: new Date().getFullYear(), createdAt: new Date().toISOString() },
        { id: 2, categoryId: 5, amount: 500000, month: new Date().getMonth() + 1, year: new Date().getFullYear(), createdAt: new Date().toISOString() },
        { id: 3, categoryId: 7, amount: 300000, month: new Date().getMonth() + 1, year: new Date().getFullYear(), createdAt: new Date().toISOString() }
    ]
};

// Inisialisasi aplikasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Memulai inisialisasi...');
    
    try {
        // Sembunyikan loading overlay terlebih dahulu
        hideLoading();
        
        // Inisialisasi data di localStorage jika belum ada
        initLocalStorage();
        
        // Inisialisasi elemen UI
        initUI();
        
        // Inisialisasi event listeners
        initEventListeners();
        
        // Tampilkan halaman dashboard sebagai default
        showPage('dashboard');
        
        // Update tanggal saat ini
        updateCurrentDate();
        
        console.log('Aplikasi MoneyMaster berhasil diinisialisasi!');
    } catch (error) {
        console.error('Error saat inisialisasi aplikasi:', error);
        // Tampilkan pesan error kepada pengguna
        document.getElementById('mainContent').innerHTML = `
            <div class="error-container">
                <h2>Terjadi Kesalahan</h2>
                <p>${error.message}</p>
                <button onclick="location.reload()">Muat Ulang Halaman</button>
            </div>
        `;
        hideLoading();
    }
});

/**
 * Inisialisasi data di localStorage
 */
function initLocalStorage() {
    console.log('Menginisialisasi localStorage...');
    
    // Inisialisasi wallets jika belum ada
    if (!localStorage.getItem('wallets')) {
        localStorage.setItem('wallets', JSON.stringify(appData.defaultWallets));
        console.log('Wallets diinisialisasi');
    }
    
    // Inisialisasi categories jika belum ada
    if (!localStorage.getItem('categories')) {
        localStorage.setItem('categories', JSON.stringify(appData.defaultCategories));
        console.log('Categories diinisialisasi');
    }
    
    // Inisialisasi transactions jika belum ada
    if (!localStorage.getItem('transactions')) {
        localStorage.setItem('transactions', JSON.stringify(appData.defaultTransactions));
        console.log('Transactions diinisialisasi');
    }
    
    // Inisialisasi budgets jika belum ada
    if (!localStorage.getItem('budgets')) {
        localStorage.setItem('budgets', JSON.stringify(appData.defaultBudgets));
        console.log('Budgets diinisialisasi');
    }
    
    // Inisialisasi tema jika belum ada
    if (!localStorage.getItem('theme')) {
        localStorage.setItem('theme', 'light');
        console.log('Theme diinisialisasi');
    }
    
    // Inisialisasi id counter jika belum ada
    if (!localStorage.getItem('lastTransactionId')) {
        localStorage.setItem('lastTransactionId', appData.defaultTransactions.length.toString());
    }
    
    if (!localStorage.getItem('lastWalletId')) {
        localStorage.setItem('lastWalletId', appData.defaultWallets.length.toString());
    }
    
    if (!localStorage.getItem('lastBudgetId')) {
        localStorage.setItem('lastBudgetId', appData.defaultBudgets.length.toString());
    }
}

/**
 * Inisialisasi elemen UI
 */
function initUI() {
    console.log('Menginisialisasi UI...');
    
    // Terapkan tema yang disimpan
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Set tanggal default untuk input tanggal
    const today = new Date().toISOString().split('T')[0];
    const transDateInput = document.getElementById('transDate');
    const transferDateInput = document.getElementById('transferDate');
    
    if (transDateInput) transDateInput.value = today;
    if (transferDateInput) transferDateInput.value = today;
    
    // Isi opsi bulan untuk filter laporan
    fillMonthOptions();
    
    // Isi opsi tahun untuk filter laporan
    fillYearOptions();
    
    // Isi opsi bulan untuk budget
    fillBudgetMonthOptions();
    
    // Isi opsi tahun untuk budget
    fillBudgetYearOptions();
}

/**
 * Inisialisasi event listeners
 */
function initEventListeners() {
    console.log('Menginisialisasi event listeners...');
    
    // Toggle menu sidebar
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }
    
    // Toggle tema gelap/terang
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Navigasi menu
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page) {
                showPage(page);
                
                // Update active state di menu
                document.querySelectorAll('.nav-item').forEach(navItem => {
                    navItem.classList.remove('active');
                });
                this.classList.add('active');
                
                // Tutup sidebar di mobile
                if (window.innerWidth <= 768) {
                    const sidebar = document.getElementById('sidebar');
                    if (sidebar) sidebar.classList.remove('show');
                }
            }
        });
    });
    
    // Tombol lihat semua transaksi
    const viewAllTransactions = document.getElementById('viewAllTransactions');
    if (viewAllTransactions) {
        viewAllTransactions.addEventListener('click', function() {
            showPage('transactions');
            document.querySelectorAll('.nav-item').forEach(navItem => {
                navItem.classList.remove('active');
                if (navItem.getAttribute('data-page') === 'transactions') {
                    navItem.classList.add('active');
                }
            });
        });
    }
    
    // Event listeners untuk modal
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    // Tutup modal saat klik di luar konten modal
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeAllModals();
            }
        });
    });
    
    // Filter transaksi terbaru
    const transactionFilter = document.getElementById('transactionFilter');
    if (transactionFilter) {
        transactionFilter.addEventListener('change', function() {
            updateRecentTransactions();
        });
    }
    
    // Refresh AI insights
    const refreshInsights = document.getElementById('refreshInsights');
    if (refreshInsights) {
        refreshInsights.addEventListener('click', function() {
            updateAIInsights();
            // Animasi refresh
            this.classList.add('rotating');
            setTimeout(() => {
                this.classList.remove('rotating');
            }, 500);
        });
    }
}

/**
 * Toggle sidebar (buka/tutup)
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('show');
    } else {
        sidebar.classList.toggle('collapsed');
        const mainContent = document.getElementById('mainContent');
        if (sidebar.classList.contains('collapsed')) {
            mainContent.style.marginLeft = '0';
        } else {
            mainContent.style.marginLeft = 'var(--sidebar-width)';
        }
    }
}

/**
 * Toggle tema gelap/terang
 */
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    
    if (!themeToggle) return;
    
    // Toggle kelas tema
    body.classList.toggle('dark-theme');
    
    // Update icon dan simpan preferensi
    if (body.classList.contains('dark-theme')) {
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        localStorage.setItem('theme', 'dark');
    } else {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        localStorage.setItem('theme', 'light');
    }
    
    // Animasi tombol
    themeToggle.classList.add('rotate');
    setTimeout(() => {
        themeToggle.classList.remove('rotate');
    }, 500);
}

/**
 * Tampilkan halaman tertentu
 * @param {string} pageId - ID halaman yang akan ditampilkan
 */
function showPage(pageId) {
    console.log('Menampilkan halaman:', pageId);
    
    // Sembunyikan semua halaman
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Tampilkan halaman yang dipilih
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        
        // Load data untuk halaman tertentu
        switch(pageId) {
            case 'dashboard':
                if (typeof loadDashboard === 'function') loadDashboard();
                break;
            case 'transactions':
                if (typeof loadTransactions === 'function') loadTransactions();
                break;
            case 'budgets':
                if (typeof loadBudgets === 'function') loadBudgets();
                break;
            case 'reports':
                if (typeof loadReports === 'function') loadReports();
                break;
            case 'wallets':
                if (typeof loadWallets === 'function') loadWallets();
                break;
        }
    }
}

/**
 * Update tanggal saat ini di header
 */
function updateCurrentDate() {
    const currentDateElement = document.getElementById('currentDate');
    if (!currentDateElement) return;
    
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = now.toLocaleDateString('id-ID', options);
    currentDateElement.textContent = formattedDate;
}

/**
 * Format angka ke Rupiah
 * @param {number} amount - Jumlah uang
 * @returns {string} - String yang diformat sebagai Rupiah
 */
function formatCurrency(amount) {
    if (isNaN(amount)) amount = 0;
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

/**
 * Format tanggal ke format Indonesia
 * @param {string} dateString - String tanggal
 * @returns {string} - Tanggal yang diformat
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return '-';
    }
}

/**
 * Format tanggal dengan waktu
 * @param {string} dateString - String tanggal
 * @returns {string} - Tanggal dan waktu yang diformat
 */
function formatDateTime(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting date time:', error);
        return '-';
    }
}

/**
 * Tampilkan modal
 * @param {string} modalId - ID modal yang akan ditampilkan
 */
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Mencegah scroll di background
    }
}

/**
 * Tutup semua modal
 */
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = 'auto'; // Aktifkan scroll kembali
}

/**
 * Tampilkan loading overlay
 */
function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

/**
 * Sembunyikan loading overlay
 */
function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

/**
 * Ambil data dari localStorage
 * @param {string} key - Kunci data
 * @returns {Array} - Array data
 */
function getData(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error getting data from localStorage:', error);
        return [];
    }
}

/**
 * Simpan data ke localStorage
 * @param {string} key - Kunci data
 * @param {Array} data - Data yang akan disimpan
 */
function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving data to localStorage:', error);
    }
}

/**
 * Ambil kategori berdasarkan ID
 * @param {number} id - ID kategori
 * @returns {Object} - Objek kategori
 */
function getCategoryById(id) {
    const categories = getData('categories');
    const category = categories.find(cat => cat.id === id);
    return category || { id: 0, name: 'Tidak Diketahui', type: 'expense', color: '#6c757d' };
}

/**
 * Ambil dompet berdasarkan ID
 * @param {number} id - ID dompet
 * @returns {Object} - Objek dompet
 */
function getWalletById(id) {
    const wallets = getData('wallets');
    const wallet = wallets.find(wallet => wallet.id === id);
    return wallet || { id: 0, name: 'Tidak Diketahui', balance: 0, color: '#6c757d' };
}

/**
 * Ambil semua transaksi dengan filter
 * @param {Object} filters - Objek filter
 * @returns {Array} - Array transaksi yang difilter
 */
function getFilteredTransactions(filters = {}) {
    try {
        let transactions = getData('transactions');
        
        // Filter berdasarkan tipe
        if (filters.type && filters.type !== 'all') {
            transactions = transactions.filter(trans => trans.type === filters.type);
        }
        
        // Filter berdasarkan kategori
        if (filters.categoryId && filters.categoryId !== 'all') {
            const categoryId = parseInt(filters.categoryId);
            transactions = transactions.filter(trans => trans.categoryId === categoryId);
        }
        
        // Filter berdasarkan dompet
        if (filters.walletId && filters.walletId !== 'all') {
            const walletId = parseInt(filters.walletId);
            transactions = transactions.filter(trans => trans.walletId === walletId);
        }
        
        // Filter berdasarkan periode
        if (filters.period && filters.period !== 'all') {
            const now = new Date();
            let startDate = new Date();
            
            switch(filters.period) {
                case 'today':
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(now.getMonth() - 1);
                    break;
                case 'year':
                    startDate.setFullYear(now.getFullYear() - 1);
                    break;
            }
            
            transactions = transactions.filter(trans => {
                const transDate = new Date(trans.date);
                return transDate >= startDate;
            });
        }
        
        // Filter berdasarkan rentang tanggal kustom
        if (filters.startDate && filters.endDate) {
            const start = new Date(filters.startDate);
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999); // Sampai akhir hari
            
            transactions = transactions.filter(trans => {
                const transDate = new Date(trans.date);
                return transDate >= start && transDate <= end;
            });
        }
        
        // Urutkan berdasarkan tanggal (terbaru dulu)
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        return transactions;
    } catch (error) {
        console.error('Error filtering transactions:', error);
        return [];
    }
}

/**
 * Hitung total saldo dari semua dompet
 * @returns {number} - Total saldo
 */
function calculateTotalBalance() {
    const wallets = getData('wallets');
    return wallets.reduce((total, wallet) => total + (wallet.balance || 0), 0);
}

/**
 * Hitung total pemasukan bulan ini
 * @returns {number} - Total pemasukan bulan ini
 */
function calculateMonthlyIncome() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const transactions = getData('transactions');
    
    return transactions
        .filter(trans => {
            try {
                const transDate = new Date(trans.date);
                return trans.type === 'income' && 
                       transDate.getMonth() === currentMonth && 
                       transDate.getFullYear() === currentYear;
            } catch (error) {
                return false;
            }
        })
        .reduce((total, trans) => total + (trans.amount || 0), 0);
}

/**
 * Hitung total pengeluaran bulan ini
 * @returns {number} - Total pengeluaran bulan ini
 */
function calculateMonthlyExpense() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const transactions = getData('transactions');
    
    return transactions
        .filter(trans => {
            try {
                const transDate = new Date(trans.date);
                return trans.type === 'expense' && 
                       transDate.getMonth() === currentMonth && 
                       transDate.getFullYear() === currentYear;
            } catch (error) {
                return false;
            }
        })
        .reduce((total, trans) => total + (trans.amount || 0), 0);
}

/**
 * Isi opsi bulan untuk filter laporan
 */
function fillMonthOptions() {
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    const select = document.getElementById('reportMonth');
    if (!select) return;
    
    select.innerHTML = '<option value="all">Semua Bulan</option>';
    
    const currentMonth = new Date().getMonth();
    
    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = month;
        if (index === currentMonth) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

/**
 * Isi opsi tahun untuk filter laporan
 */
function fillYearOptions() {
    // Untuk sekarang kita hanya menggunakan bulan
    // Fungsi ini bisa diisi jika ada filter tahun terpisah
}

/**
 * Isi opsi bulan untuk form budget
 */
function fillBudgetMonthOptions() {
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    const select = document.getElementById('budgetMonth');
    if (!select) return;
    
    select.innerHTML = '';
    
    const currentMonth = new Date().getMonth() + 1;
    
    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = month;
        if (index + 1 === currentMonth) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

/**
 * Isi opsi tahun untuk form budget
 */
function fillBudgetYearOptions() {
    const select = document.getElementById('budgetYear');
    if (!select) return;
    
    select.innerHTML = '';
    
    const currentYear = new Date().getFullYear();
    
    // Tampilkan 3 tahun: tahun lalu, tahun ini, tahun depan
    for (let i = -1; i <= 1; i++) {
        const year = currentYear + i;
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (i === 0) {
            option.selected = true;
        }
        select.appendChild(option);
    }
}

/**
 * Generate ID unik untuk data baru
 * @param {string} type - Jenis data (transaction, wallet, budget)
 * @returns {number} - ID baru
 */
function generateId(type) {
    const key = `last${type.charAt(0).toUpperCase() + type.slice(1)}Id`;
    let lastId = parseInt(localStorage.getItem(key)) || 0;
    lastId++;
    localStorage.setItem(key, lastId.toString());
    return lastId;
}

// Ekspor fungsi yang diperlukan untuk file JS lainnya
window.app = {
    formatCurrency,
    formatDate,
    formatDateTime,
    getData,
    saveData,
    getCategoryById,
    getWalletById,
    getFilteredTransactions,
    calculateTotalBalance,
    calculateMonthlyIncome,
    calculateMonthlyExpense,
    showModal,
    closeAllModals,
    showLoading,
    hideLoading,
    generateId,
    showPage
};

// Tambahkan style untuk error container
const errorStyle = document.createElement('style');
errorStyle.textContent = `
    .error-container {
        text-align: center;
        padding: 50px 20px;
        background-color: var(--card-bg);
        border-radius: 12px;
        box-shadow: var(--shadow);
        margin-top: 50px;
    }
    
    .error-container h2 {
        color: var(--danger-color);
        margin-bottom: 20px;
    }
    
    .error-container p {
        color: var(--text-light);
        margin-bottom: 30px;
    }
    
    .error-container button {
        padding: 10px 30px;
        background-color: var(--primary-color);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1rem;
        transition: background-color 0.2s;
    }
    
    .error-container button:hover {
        background-color: var(--primary-dark);
    }
`;
document.head.appendChild(errorStyle);

// Tambahkan fungsi yang hilang
function updateAIInsights() {
    // Fungsi ini sudah ada di dashboard.js, kita hanya perlu mendeklarasikannya di sini
    // agar tidak ada error
    console.log('AI Insights akan diupdate oleh dashboard.js');
}

// Pastikan fungsi ini tersedia di scope global
window.updateAIInsights = updateAIInsights;

// Ekspor fungsi yang diperlukan untuk file JS lainnya
window.app = {
    formatCurrency,
    formatDate,
    formatDateTime,
    getData,
    saveData,
    getCategoryById,
    getWalletById,
    getFilteredTransactions,
    calculateTotalBalance,
    calculateMonthlyIncome,
    calculateMonthlyExpense,
    calculateCategoryExpenses,
    showModal,
    closeAllModals,
    showLoading,
    hideLoading,
    generateId,
    showPage,
    updateAIInsights // Tambahkan ini
};