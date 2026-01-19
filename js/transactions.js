/**
 * FILE: transactions.js
 * DESKRIPSI: Mengelola halaman transaksi
 */

// Variabel global untuk state transaksi
let currentTransactionId = null;
let currentFilters = {
    type: 'all',
    categoryId: 'all',
    walletId: 'all',
    period: 'all'
};

/**
 * Load halaman transaksi
 */
function loadTransactions() {
    // Isi filter dropdown
    populateFilterDropdowns();
    
    // Tampilkan transaksi
    updateTransactionsTable();
    
    // Inisialisasi event listeners
    initTransactionsEventListeners();
}

/**
 * Isi dropdown filter dengan data
 */
function populateFilterDropdowns() {
    // Isi filter kategori
    const categoryFilter = document.getElementById('filterCategory');
    const categories = app.getData('categories');
    
    categoryFilter.innerHTML = '<option value="all">Semua Kategori</option>';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categoryFilter.appendChild(option);
    });
    
    // Isi filter dompet
    const walletFilter = document.getElementById('filterWallet');
    const wallets = app.getData('wallets');
    
    walletFilter.innerHTML = '<option value="all">Semua Dompet</option>';
    
    wallets.forEach(wallet => {
        const option = document.createElement('option');
        option.value = wallet.id;
        option.textContent = wallet.name;
        walletFilter.appendChild(option);
    });
    
    // Isi kategori untuk form transaksi
    const transCategory = document.getElementById('transCategory');
    transCategory.innerHTML = '';
    
    // Kelompokkan kategori berdasarkan tipe
    const incomeCategories = categories.filter(cat => cat.type === 'income');
    const expenseCategories = categories.filter(cat => cat.type === 'expense');
    
    // Tambahkan opsi pemasukan
    if (incomeCategories.length > 0) {
        const optgroupIncome = document.createElement('optgroup');
        optgroupIncome.label = 'Pemasukan';
        
        incomeCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            optgroupIncome.appendChild(option);
        });
        
        transCategory.appendChild(optgroupIncome);
    }
    
    // Tambahkan opsi pengeluaran
    if (expenseCategories.length > 0) {
        const optgroupExpense = document.createElement('optgroup');
        optgroupExpense.label = 'Pengeluaran';
        
        expenseCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            optgroupExpense.appendChild(option);
        });
        
        transCategory.appendChild(optgroupExpense);
    }
    
    // Isi dompet untuk form transaksi
    const transWallet = document.getElementById('transWallet');
    transWallet.innerHTML = '';
    
    wallets.forEach(wallet => {
        const option = document.createElement('option');
        option.value = wallet.id;
        option.textContent = wallet.name;
        transWallet.appendChild(option);
    });
}

/**
 * Update tabel transaksi berdasarkan filter
 */
function updateTransactionsTable() {
    const tbody = document.getElementById('transactionsTableBody');
    
    // Ambil transaksi dengan filter saat ini
    const transactions = app.getFilteredTransactions(currentFilters);
    
    // Generate HTML untuk tabel
    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="no-data">
                        <i class="fas fa-receipt"></i>
                        <p>Tidak ada transaksi yang ditemukan</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    transactions.forEach(trans => {
        const category = app.getCategoryById(trans.categoryId);
        const wallet = app.getWalletById(trans.walletId);
        const isIncome = trans.type === 'income';
        
        html += `
            <tr>
                <td>${app.formatDate(trans.date)}</td>
                <td>
                    <strong>${trans.description}</strong>
                    ${trans.notes ? `<br><small class="text-muted">${trans.notes}</small>` : ''}
                </td>
                <td>
                    <span class="category-badge" style="background-color: ${category.color}20; color: ${category.color};">
                        ${category.name}
                    </span>
                </td>
                <td>
                    <span class="${isIncome ? 'income-badge' : 'expense-badge'}">
                        ${isIncome ? 'Pemasukan' : 'Pengeluaran'}
                    </span>
                </td>
                <td>
                    <div class="d-flex align-center gap-1">
                        <div class="wallet-color" style="background-color: ${wallet.color}; width: 12px; height: 12px; border-radius: 50%;"></div>
                        ${wallet.name}
                    </div>
                </td>
                <td class="${isIncome ? 'text-success' : 'text-danger'}">
                    <strong>${isIncome ? '+' : '-'} ${app.formatCurrency(trans.amount)}</strong>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn-edit" onclick="editTransaction(${trans.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" onclick="deleteTransaction(${trans.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    // Tambahkan style untuk badge kategori
    const style = document.createElement('style');
    style.textContent = `
        .category-badge {
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
            display: inline-block;
        }
        
        .text-center {
            text-align: center;
        }
        
        .no-data {
            padding: 40px 20px;
            text-align: center;
            color: var(--text-light);
        }
        
        .no-data i {
            font-size: 3rem;
            margin-bottom: 15px;
            opacity: 0.5;
        }
        
        .no-data p {
            font-size: 1rem;
        }
    `;
    
    // Hapus style lama jika ada
    const oldStyle = document.getElementById('transactions-table-style');
    if (oldStyle) {
        oldStyle.remove();
    }
    
    style.id = 'transactions-table-style';
    document.head.appendChild(style);
}

/**
 * Edit transaksi
 * @param {number} id - ID transaksi
 */
function editTransaction(id) {
    // Ambil data transaksi
    const transactions = app.getData('transactions');
    const transaction = transactions.find(trans => trans.id === id);
    
    if (!transaction) {
        alert('Transaksi tidak ditemukan');
        return;
    }
    
    // Set nilai form
    document.getElementById('transId').value = transaction.id;
    document.getElementById('transDescription').value = transaction.description;
    document.getElementById('transAmount').value = transaction.amount;
    document.getElementById('transType').value = transaction.type;
    document.getElementById('transCategory').value = transaction.categoryId;
    document.getElementById('transWallet').value = transaction.walletId;
    document.getElementById('transDate').value = transaction.date.split('T')[0];
    document.getElementById('transNotes').value = transaction.notes || '';
    
    // Update judul modal
    document.getElementById('modalTransactionTitle').textContent = 'Edit Transaksi';
    
    // Tampilkan modal
    app.showModal('transactionModal');
    
    // Simpan ID transaksi yang sedang diedit
    currentTransactionId = id;
}

/**
 * Hapus transaksi
 * @param {number} id - ID transaksi
 */
function deleteTransaction(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
        return;
    }
    
    // Ambil data transaksi
    let transactions = app.getData('transactions');
    const transactionIndex = transactions.findIndex(trans => trans.id === id);
    
    if (transactionIndex === -1) {
        alert('Transaksi tidak ditemukan');
        return;
    }
    
    // Ambil data transaksi untuk memperbarui saldo dompet
    const transaction = transactions[transactionIndex];
    
    // Hapus transaksi dari array
    transactions.splice(transactionIndex, 1);
    
    // Simpan ke localStorage
    app.saveData('transactions', transactions);
    
    // Update saldo dompet (kembalikan saldo)
    let wallets = app.getData('wallets');
    const walletIndex = wallets.findIndex(wallet => wallet.id === transaction.walletId);
    
    if (walletIndex !== -1) {
        if (transaction.type === 'income') {
            // Jika penghapusan transaksi pemasukan, kurangi saldo
            wallets[walletIndex].balance -= transaction.amount;
        } else {
            // Jika penghapusan transaksi pengeluaran, tambahkan saldo
            wallets[walletIndex].balance += transaction.amount;
        }
        
        app.saveData('wallets', wallets);
    }
    
    // Update UI
    updateTransactionsTable();
    
    // Update dashboard jika sedang aktif
    if (document.getElementById('dashboard').classList.contains('active')) {
        loadDashboard();
    }
    
    // Tampilkan notifikasi
    showNotification('Transaksi berhasil dihapus', 'success');
}

/**
 * Tambah transaksi baru
 */
function addNewTransaction() {
    // Reset form
    document.getElementById('transactionForm').reset();
    
    // Set tanggal hari ini
    document.getElementById('transDate').value = new Date().toISOString().split('T')[0];
    
    // Update judul modal
    document.getElementById('modalTransactionTitle').textContent = 'Tambah Transaksi Baru';
    
    // Reset ID transaksi
    document.getElementById('transId').value = '';
    currentTransactionId = null;
    
    // Tampilkan modal
    app.showModal('transactionModal');
}

/**
 * Simpan transaksi (tambah atau edit)
 */
function saveTransaction() {
    // Validasi form
    const form = document.getElementById('transactionForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Ambil nilai form
    const id = document.getElementById('transId').value;
    const description = document.getElementById('transDescription').value;
    const amount = parseFloat(document.getElementById('transAmount').value);
    const type = document.getElementById('transType').value;
    const categoryId = parseInt(document.getElementById('transCategory').value);
    const walletId = parseInt(document.getElementById('transWallet').value);
    const date = document.getElementById('transDate').value;
    const notes = document.getElementById('transNotes').value;
    
    // Ambil data saat ini
    let transactions = app.getData('transactions');
    let wallets = app.getData('wallets');
    
    if (id) {
        // Edit transaksi yang ada
        const transactionIndex = transactions.findIndex(trans => trans.id === parseInt(id));
        
        if (transactionIndex === -1) {
            alert('Transaksi tidak ditemukan');
            return;
        }
        
        // Ambil transaksi lama untuk memperbarui saldo dompet
        const oldTransaction = transactions[transactionIndex];
        
        // Update saldo dompet (kembalikan saldo lama dulu, lalu terapkan yang baru)
        const walletIndex = wallets.findIndex(wallet => wallet.id === oldTransaction.walletId);
        if (walletIndex !== -1) {
            if (oldTransaction.type === 'income') {
                // Kurangi saldo dari transaksi pemasukan lama
                wallets[walletIndex].balance -= oldTransaction.amount;
            } else {
                // Tambahkan saldo dari transaksi pengeluaran lama
                wallets[walletIndex].balance += oldTransaction.amount;
            }
        }
        
        // Update transaksi
        transactions[transactionIndex] = {
            ...oldTransaction,
            description,
            amount,
            type,
            categoryId,
            walletId,
            date: new Date(date).toISOString(),
            notes,
            updatedAt: new Date().toISOString()
        };
    } else {
        // Tambah transaksi baru
        const newId = app.generateId('transaction');
        
        const newTransaction = {
            id: newId,
            description,
            amount,
            type,
            categoryId,
            walletId,
            date: new Date(date).toISOString(),
            notes,
            createdAt: new Date().toISOString()
        };
        
        transactions.push(newTransaction);
    }
    
    // Update saldo dompet dengan transaksi baru
    const walletIndex = wallets.findIndex(wallet => wallet.id === walletId);
    if (walletIndex !== -1) {
        if (type === 'income') {
            wallets[walletIndex].balance += amount;
        } else {
            wallets[walletIndex].balance -= amount;
        }
    }
    
    // Simpan ke localStorage
    app.saveData('transactions', transactions);
    app.saveData('wallets', wallets);
    
    // Tutup modal
    app.closeAllModals();
    
    // Update UI
    updateTransactionsTable();
    
    // Update dashboard jika sedang aktif
    if (document.getElementById('dashboard').classList.contains('active')) {
        loadDashboard();
    }
    
    // Tampilkan notifikasi
    showNotification(
        id ? 'Transaksi berhasil diperbarui' : 'Transaksi berhasil ditambahkan',
        'success'
    );
}

/**
 * Terapkan filter transaksi
 */
function applyFilters() {
    // Ambil nilai filter
    currentFilters = {
        type: document.getElementById('filterType').value,
        categoryId: document.getElementById('filterCategory').value,
        walletId: document.getElementById('filterWallet').value,
        period: document.getElementById('filterPeriod').value
    };
    
    // Update tabel
    updateTransactionsTable();
    
    // Tampilkan notifikasi
    showNotification('Filter diterapkan', 'info');
}

/**
 * Reset filter transaksi
 */
function resetFilters() {
    // Reset nilai filter ke default
    document.getElementById('filterType').value = 'all';
    document.getElementById('filterCategory').value = 'all';
    document.getElementById('filterWallet').value = 'all';
    document.getElementById('filterPeriod').value = 'all';
    
    // Reset filter state
    currentFilters = {
        type: 'all',
        categoryId: 'all',
        walletId: 'all',
        period: 'all'
    };
    
    // Update tabel
    updateTransactionsTable();
    
    // Tampilkan notifikasi
    showNotification('Filter direset', 'info');
}

/**
 * Tampilkan notifikasi
 * @param {string} message - Pesan notifikasi
 * @param {string} type - Tipe notifikasi (success, error, info, warning)
 */
function showNotification(message, type = 'info') {
    // Hapus notifikasi sebelumnya jika ada
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) {
        oldNotification.remove();
    }
    
    // Buat elemen notifikasi
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Tambahkan ke body
    document.body.appendChild(notification);
    
    // Tampilkan notifikasi dengan animasi
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Event listener untuk tombol close
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Auto-hide setelah 5 detik
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
    
    // Tambahkan style untuk notifikasi
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: var(--card-bg);
            color: var(--text-color);
            border-radius: 8px;
            box-shadow: var(--shadow-hover);
            padding: 15px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 300px;
            max-width: 400px;
            z-index: 10000;
            transform: translateX(150%);
            transition: transform 0.3s ease;
            border-left: 4px solid;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification-success {
            border-left-color: var(--success-color);
        }
        
        .notification-error {
            border-left-color: var(--danger-color);
        }
        
        .notification-info {
            border-left-color: var(--info-color);
        }
        
        .notification-warning {
            border-left-color: var(--warning-color);
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;
        }
        
        .notification-content i {
            font-size: 1.2rem;
        }
        
        .notification-success .notification-content i {
            color: var(--success-color);
        }
        
        .notification-error .notification-content i {
            color: var(--danger-color);
        }
        
        .notification-info .notification-content i {
            color: var(--info-color);
        }
        
        .notification-warning .notification-content i {
            color: var(--warning-color);
        }
        
        .notification-close {
            background: none;
            border: none;
            color: var(--text-light);
            cursor: pointer;
            font-size: 1rem;
            margin-left: 10px;
            transition: color 0.2s;
        }
        
        .notification-close:hover {
            color: var(--text-color);
        }
    `;
    
    // Hapus style lama jika ada
    const oldStyle = document.getElementById('notification-style');
    if (oldStyle) {
        oldStyle.remove();
    }
    
    style.id = 'notification-style';
    document.head.appendChild(style);
}

/**
 * Inisialisasi event listeners untuk halaman transaksi
 */
function initTransactionsEventListeners() {
    // Tombol tambah transaksi
    document.getElementById('addTransactionBtn').addEventListener('click', addNewTransaction);
    
    // Tombol terapkan filter
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    
    // Tombol reset filter
    document.getElementById('resetFilters').addEventListener('click', resetFilters);
    
    // Form transaksi
    document.getElementById('transactionForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveTransaction();
    });
    
    // Update kategori berdasarkan tipe transaksi
    document.getElementById('transType').addEventListener('change', function() {
        const type = this.value;
        const categorySelect = document.getElementById('transCategory');
        
        // Simpan nilai yang dipilih sebelumnya
        const selectedValue = categorySelect.value;
        
        // Nonaktifkan semua option terlebih dahulu
        Array.from(categorySelect.options).forEach(option => {
            option.disabled = false;
        });
        
        // Nonaktifkan optgroup yang tidak sesuai dengan tipe
        Array.from(categorySelect.children).forEach(child => {
            if (child.tagName === 'OPTGROUP') {
                if (type === 'income' && child.label !== 'Pemasukan') {
                    Array.from(child.children).forEach(option => {
                        option.disabled = true;
                    });
                } else if (type === 'expense' && child.label !== 'Pengeluaran') {
                    Array.from(child.children).forEach(option => {
                        option.disabled = true;
                    });
                }
            }
        });
        
        // Reset ke opsi pertama yang tidak disabled jika yang dipilih sekarang disabled
        const selectedOption = categorySelect.options[categorySelect.selectedIndex];
        if (selectedOption.disabled) {
            // Cari opsi pertama yang tidak disabled
            const firstEnabledOption = Array.from(categorySelect.options).find(option => !option.disabled);
            if (firstEnabledOption) {
                categorySelect.value = firstEnabledOption.value;
            }
        }
    });
    
    // Trigger change event untuk mengatur kategori awal
    document.getElementById('transType').dispatchEvent(new Event('change'));
}

// Ekspos fungsi ke global scope untuk event handlers di HTML
window.editTransaction = editTransaction;
window.deleteTransaction = deleteTransaction;