/**
 * FILE: wallets.js
 * DESKRIPSI: Mengelola halaman dompet
 */

/**
 * Load halaman dompet
 */
function loadWallets() {
    updateWalletsDisplay();
    initWalletsEventListeners();
}

/**
 * Update tampilan dompet
 */
function updateWalletsDisplay() {
    const container = document.getElementById('walletsContainer');
    
    // Ambil data dompet
    const wallets = app.getData('wallets');
    
    // Hitung total saldo
    const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
    
    // Generate HTML untuk dompet cards
    let html = '';
    
    wallets.forEach(wallet => {
        // Hitung persentase dari total saldo
        const percentage = totalBalance > 0 ? (wallet.balance / totalBalance) * 100 : 0;
        
        // Tentukan icon berdasarkan tipe dompet
        let walletIcon = 'fa-wallet';
        switch(wallet.type) {
            case 'bank':
                walletIcon = 'fa-university';
                break;
            case 'digital':
                walletIcon = 'fa-mobile-alt';
                break;
            case 'savings':
                walletIcon = 'fa-piggy-bank';
                break;
            case 'cash':
                walletIcon = 'fa-money-bill-wave';
                break;
        }
        
        html += `
            <div class="wallet-card" style="border-left: 4px solid ${wallet.color}">
                <div class="wallet-header">
                    <div class="wallet-title">${wallet.name}</div>
                    <div class="wallet-actions">
                        <button class="btn-edit" onclick="editWallet(${wallet.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" onclick="deleteWallet(${wallet.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="wallet-type">
                    <i class="fas ${walletIcon}"></i> ${getWalletTypeName(wallet.type)}
                </div>
                
                <div class="wallet-balance">${app.formatCurrency(wallet.balance)}</div>
                
                <div class="wallet-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%; background-color: ${wallet.color};"></div>
                    </div>
                    <div class="wallet-percentage">${percentage.toFixed(1)}% dari total saldo</div>
                </div>
                
                <div class="wallet-details">
                    <div class="detail-row">
                        <span>Warna:</span>
                        <div class="color-preview" style="background-color: ${wallet.color}; width: 20px; height: 20px; border-radius: 4px;"></div>
                    </div>
                    <div class="detail-row">
                        <span>Dibuat:</span>
                        <span>${app.formatDate(wallet.createdAt)}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    // Tambahkan card untuk total saldo
    html += `
        <div class="wallet-card total-balance">
            <div class="wallet-header">
                <div class="wallet-title">Total Saldo</div>
                <div class="wallet-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
            </div>
            
            <div class="wallet-type">
                <i class="fas fa-layer-group"></i> Semua Dompet
            </div>
            
            <div class="wallet-balance">${app.formatCurrency(totalBalance)}</div>
            
            <div class="wallet-stats">
                <div class="stat-item">
                    <span class="stat-label">Jumlah Dompet</span>
                    <span class="stat-value">${wallets.length}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Rata-rata Saldo</span>
                    <span class="stat-value">${app.formatCurrency(wallets.length > 0 ? totalBalance / wallets.length : 0)}</span>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Tambahkan style untuk halaman dompet
    addWalletsStyles();
}

/**
 * Dapatkan nama tipe dompet
 * @param {string} type - Tipe dompet
 * @returns {string} - Nama tipe dompet
 */
function getWalletTypeName(type) {
    const typeNames = {
        'cash': 'Tunai',
        'bank': 'Rekening Bank',
        'digital': 'Dompet Digital',
        'savings': 'Tabungan',
        'other': 'Lainnya'
    };
    
    return typeNames[type] || 'Tidak Diketahui';
}

/**
 * Tambah dompet baru
 */
function addNewWallet() {
    // Reset form
    document.getElementById('walletForm').reset();
    
    // Set warna default
    document.getElementById('walletColor').value = '#4a6bff';
    
    // Update judul modal
    document.getElementById('modalWalletTitle').textContent = 'Tambah Dompet Baru';
    
    // Reset ID dompet
    document.getElementById('walletId').value = '';
    
    // Tampilkan modal
    app.showModal('walletModal');
}

/**
 * Edit dompet
 * @param {number} id - ID dompet
 */
function editWallet(id) {
    // Ambil data dompet
    const wallets = app.getData('wallets');
    const wallet = wallets.find(w => w.id === id);
    
    if (!wallet) {
        showNotification('Dompet tidak ditemukan', 'error');
        return;
    }
    
    // Set nilai form
    document.getElementById('walletId').value = wallet.id;
    document.getElementById('walletName').value = wallet.name;
    document.getElementById('walletType').value = wallet.type;
    document.getElementById('walletBalance').value = wallet.balance;
    document.getElementById('walletColor').value = wallet.color;
    
    // Update judul modal
    document.getElementById('modalWalletTitle').textContent = 'Edit Dompet';
    
    // Tampilkan modal
    app.showModal('walletModal');
}

/**
 * Hapus dompet
 * @param {number} id - ID dompet
 */
function deleteWallet(id) {
    // Cek apakah dompet memiliki transaksi
    const transactions = app.getData('transactions');
    const walletTransactions = transactions.filter(trans => trans.walletId === id);
    
    if (walletTransactions.length > 0) {
        if (!confirm(`Dompet ini memiliki ${walletTransactions.length} transaksi. Menghapus dompet akan menghapus semua transaksi terkait. Apakah Anda yakin?`)) {
            return;
        }
        
        // Hapus transaksi terkait
        const updatedTransactions = transactions.filter(trans => trans.walletId !== id);
        app.saveData('transactions', updatedTransactions);
    }
    
    // Hapus dompet
    let wallets = app.getData('wallets');
    const walletIndex = wallets.findIndex(w => w.id === id);
    
    if (walletIndex === -1) {
        showNotification('Dompet tidak ditemukan', 'error');
        return;
    }
    
    wallets.splice(walletIndex, 1);
    app.saveData('wallets', wallets);
    
    // Update tampilan
    updateWalletsDisplay();
    
    // Update dashboard jika sedang aktif
    if (document.getElementById('dashboard').classList.contains('active')) {
        loadDashboard();
    }
    
    // Tampilkan notifikasi
    showNotification('Dompet berhasil dihapus', 'success');
}

/**
 * Transfer dana antar dompet
 */
function transferFunds() {
    // Reset form
    document.getElementById('transferForm').reset();
    
    // Isi dropdown dompet
    const fromWalletSelect = document.getElementById('fromWallet');
    const toWalletSelect = document.getElementById('toWallet');
    const wallets = app.getData('wallets');
    
    fromWalletSelect.innerHTML = '';
    toWalletSelect.innerHTML = '';
    
    wallets.forEach(wallet => {
        const option1 = document.createElement('option');
        option1.value = wallet.id;
        option1.textContent = `${wallet.name} (${app.formatCurrency(wallet.balance)})`;
        
        const option2 = document.createElement('option');
        option2.value = wallet.id;
        option2.textContent = `${wallet.name} (${app.formatCurrency(wallet.balance)})`;
        
        fromWalletSelect.appendChild(option1.cloneNode(true));
        toWalletSelect.appendChild(option2.cloneNode(true));
    });
    
    // Set tanggal hari ini
    document.getElementById('transferDate').value = new Date().toISOString().split('T')[0];
    
    // Event listener untuk update saldo saat dompet berubah
    fromWalletSelect.addEventListener('change', updateWalletBalances);
    toWalletSelect.addEventListener('change', updateWalletBalances);
    
    // Inisialisasi saldo
    updateWalletBalances();
    
    // Tampilkan modal
    app.showModal('transferModal');
}

/**
 * Update tampilan saldo dompet di form transfer
 */
function updateWalletBalances() {
    const fromWalletId = parseInt(document.getElementById('fromWallet').value);
    const toWalletId = parseInt(document.getElementById('toWallet').value);
    
    const wallets = app.getData('wallets');
    
    const fromWallet = wallets.find(w => w.id === fromWalletId);
    const toWallet = wallets.find(w => w.id === toWalletId);
    
    if (fromWallet) {
        document.getElementById('fromWalletBalance').textContent = `Saldo: ${app.formatCurrency(fromWallet.balance)}`;
    }
    
    if (toWallet) {
        document.getElementById('toWalletBalance').textContent = `Saldo: ${app.formatCurrency(toWallet.balance)}`;
    }
}

/**
 * Simpan transfer dana
 */
function saveTransfer() {
    // Validasi form
    const form = document.getElementById('transferForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Ambil nilai form
    const fromWalletId = parseInt(document.getElementById('fromWallet').value);
    const toWalletId = parseInt(document.getElementById('toWallet').value);
    const amount = parseFloat(document.getElementById('transferAmount').value);
    const date = document.getElementById('transferDate').value;
    const notes = document.getElementById('transferNotes').value;
    
    // Validasi
    if (fromWalletId === toWalletId) {
        showNotification('Dompet sumber dan tujuan tidak boleh sama', 'error');
        return;
    }
    
    if (amount <= 0) {
        showNotification('Jumlah transfer harus lebih dari 0', 'error');
        return;
    }
    
    // Ambil data dompet
    let wallets = app.getData('wallets');
    const fromWalletIndex = wallets.findIndex(w => w.id === fromWalletId);
    const toWalletIndex = wallets.findIndex(w => w.id === toWalletId);
    
    if (fromWalletIndex === -1 || toWalletIndex === -1) {
        showNotification('Dompet tidak ditemukan', 'error');
        return;
    }
    
    // Cek saldo dompet sumber
    if (wallets[fromWalletIndex].balance < amount) {
        showNotification('Saldo dompet sumber tidak mencukupi', 'error');
        return;
    }
    
    // Update saldo dompet
    wallets[fromWalletIndex].balance -= amount;
    wallets[toWalletIndex].balance += amount;
    
    // Simpan perubahan saldo
    app.saveData('wallets', wallets);
    
    // Buat transaksi transfer
    let transactions = app.getData('transactions');
    const transferId = app.generateId('transaction');
    
    // Transaksi pengeluaran dari dompet sumber
    const expenseTransaction = {
        id: transferId,
        description: notes || 'Transfer ke ' + wallets[toWalletIndex].name,
        amount: amount,
        type: 'expense',
        categoryId: 10, // Kategori tagihan
        walletId: fromWalletId,
        date: new Date(date).toISOString(),
        notes: `Transfer ke ${wallets[toWalletIndex].name}`,
        createdAt: new Date().toISOString()
    };
    
    // Transaksi pemasukan ke dompet tujuan
    const incomeTransaction = {
        id: transferId + 1, // ID unik berikutnya
        description: notes || 'Transfer dari ' + wallets[fromWalletIndex].name,
        amount: amount,
        type: 'income',
        categoryId: 10, // Kategori tagihan
        walletId: toWalletId,
        date: new Date(date).toISOString(),
        notes: `Transfer dari ${wallets[fromWalletIndex].name}`,
        createdAt: new Date().toISOString()
    };
    
    transactions.push(expenseTransaction, incomeTransaction);
    app.saveData('transactions', transactions);
    
    // Update ID counter untuk transaksi (karena kita tambah 2 transaksi)
    const lastId = parseInt(localStorage.getItem('lastTransactionId')) || 0;
    localStorage.setItem('lastTransactionId', (lastId + 2).toString());
    
    // Tutup modal
    app.closeAllModals();
    
    // Update tampilan
    updateWalletsDisplay();
    
    // Update dashboard jika sedang aktif
    if (document.getElementById('dashboard').classList.contains('active')) {
        loadDashboard();
    }
    
    // Update halaman transaksi jika sedang aktif
    if (document.getElementById('transactions').classList.contains('active')) {
        loadTransactions();
    }
    
    // Tampilkan notifikasi
    showNotification(`Transfer ${app.formatCurrency(amount)} berhasil`, 'success');
}

/**
 * Simpan dompet (tambah atau edit)
 */
function saveWallet() {
    // Validasi form
    const form = document.getElementById('walletForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Ambil nilai form
    const id = document.getElementById('walletId').value;
    const name = document.getElementById('walletName').value;
    const type = document.getElementById('walletType').value;
    const balance = parseFloat(document.getElementById('walletBalance').value) || 0;
    const color = document.getElementById('walletColor').value;
    
    // Ambil data dompet
    let wallets = app.getData('wallets');
    
    if (id) {
        // Edit dompet yang ada
        const walletIndex = wallets.findIndex(w => w.id === parseInt(id));
        
        if (walletIndex === -1) {
            showNotification('Dompet tidak ditemukan', 'error');
            return;
        }
        
        // Update dompet
        wallets[walletIndex] = {
            ...wallets[walletIndex],
            name,
            type,
            balance,
            color,
            updatedAt: new Date().toISOString()
        };
    } else {
        // Tambah dompet baru
        const newId = app.generateId('wallet');
        
        const newWallet = {
            id: newId,
            name,
            type,
            balance,
            color,
            createdAt: new Date().toISOString()
        };
        
        wallets.push(newWallet);
    }
    
    // Simpan ke localStorage
    app.saveData('wallets', wallets);
    
    // Tutup modal
    app.closeAllModals();
    
    // Update tampilan
    updateWalletsDisplay();
    
    // Update dashboard jika sedang aktif
    if (document.getElementById('dashboard').classList.contains('active')) {
        loadDashboard();
    }
    
    // Tampilkan notifikasi
    showNotification(
        id ? 'Dompet berhasil diperbarui' : 'Dompet berhasil ditambahkan',
        'success'
    );
}

/**
 * Tambahkan style untuk halaman dompet
 */
function addWalletsStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .wallet-progress {
            margin: 15px 0;
        }
        
        .wallet-percentage {
            font-size: 0.85rem;
            color: var(--text-light);
            margin-top: 5px;
        }
        
        .wallet-details {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid var(--border-color);
        }
        
        .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .detail-row:last-child {
            margin-bottom: 0;
        }
        
        .detail-row span:first-child {
            color: var(--text-light);
            font-size: 0.9rem;
        }
        
        .wallet-actions {
            display: flex;
            gap: 5px;
        }
        
        .total-balance {
            background-color: rgba(74, 107, 255, 0.05);
            border-left: 4px solid var(--primary-color) !important;
        }
        
        .wallet-stats {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid var(--border-color);
        }
        
        .stat-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        
        .stat-item:last-child {
            margin-bottom: 0;
        }
        
        .stat-label {
            color: var(--text-light);
            font-size: 0.9rem;
        }
        
        .stat-value {
            font-weight: 600;
            color: var(--text-color);
        }
    `;
    
    // Hapus style lama jika ada
    const oldStyle = document.getElementById('wallets-style');
    if (oldStyle) {
        oldStyle.remove();
    }
    
    style.id = 'wallets-style';
    document.head.appendChild(style);
}

/**
 * Inisialisasi event listeners untuk halaman dompet
 */
function initWalletsEventListeners() {
    // Tombol tambah dompet
    document.getElementById('addWalletBtn').addEventListener('click', addNewWallet);
    
    // Tombol transfer dana
    document.getElementById('transferFundsBtn').addEventListener('click', transferFunds);
    
    // Form dompet
    document.getElementById('walletForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveWallet();
    });
    
    // Form transfer
    document.getElementById('transferForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveTransfer();
    });
}

// Ekspos fungsi ke global scope untuk event handlers di HTML
window.editWallet = editWallet;
window.deleteWallet = deleteWallet;