/**
 * FILE: budgets.js
 * DESKRIPSI: Mengelola halaman budget
 */

/**
 * Load halaman budget
 */
function loadBudgets() {
    updateBudgetsDisplay();
    initBudgetsEventListeners();
}

/**
 * Update tampilan budget
 */
function updateBudgetsDisplay() {
    const container = document.getElementById('budgetsContainer');
    
    // Ambil data budget
    const budgets = app.getData('budgets');
    const categories = app.getData('categories');
    const transactions = app.getData('transactions');
    
    // Filter budget bulan ini
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const currentBudgets = budgets.filter(budget => 
        budget.month === currentMonth && budget.year === currentYear
    );
    
    // Jika tidak ada budget
    if (currentBudgets.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-chart-pie"></i>
                <h3>Belum Ada Budget</h3>
                <p>Tambahkan budget untuk mulai melacak pengeluaran Anda</p>
                <button class="btn-primary mt-2" id="addFirstBudget">
                    <i class="fas fa-plus"></i> Tambah Budget Pertama
                </button>
            </div>
        `;
        
        // Event listener untuk tombol tambah budget pertama
        document.getElementById('addFirstBudget')?.addEventListener('click', addNewBudget);
        return;
    }
    
    // Generate HTML untuk budget cards
    let html = '';
    
    currentBudgets.forEach(budget => {
        // Cari kategori
        const category = categories.find(cat => cat.id === budget.categoryId);
        if (!category) return;
        
        // Hitung total pengeluaran untuk kategori ini bulan ini
        const spent = transactions
            .filter(trans => 
                trans.type === 'expense' && 
                trans.categoryId === budget.categoryId &&
                new Date(trans.date).getMonth() + 1 === currentMonth &&
                new Date(trans.date).getFullYear() === currentYear
            )
            .reduce((sum, trans) => sum + trans.amount, 0);
        
        // Hitung persentase
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        const remaining = budget.amount - spent;
        
        // Tentukan status
        let status = 'Aman';
        let statusClass = 'status-safe';
        let progressClass = 'progress-safe';
        
        if (percentage >= 80 && percentage < 100) {
            status = 'Hampir Habis';
            statusClass = 'status-warning';
            progressClass = 'progress-warning';
        } else if (percentage >= 100) {
            status = 'Melewati Limit';
            statusClass = 'status-danger';
            progressClass = 'progress-danger';
        }
        
        html += `
            <div class="budget-card">
                <div class="budget-header">
                    <div class="budget-title">${category.name}</div>
                    <div class="budget-actions">
                        <button class="btn-edit" onclick="editBudget(${budget.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" onclick="deleteBudget(${budget.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="budget-amount">${app.formatCurrency(budget.amount)}</div>
                
                <div class="budget-progress ${progressClass}">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                    <div class="budget-status">
                        <span>${app.formatCurrency(spent)} terpakai</span>
                        <span class="status-badge ${statusClass}">${status}</span>
                    </div>
                </div>
                
                <div class="budget-details">
                    <div class="detail-row">
                        <span>Sisa:</span>
                        <span class="${remaining >= 0 ? 'text-success' : 'text-danger'}">
                            ${app.formatCurrency(remaining >= 0 ? remaining : 0)}
                        </span>
                    </div>
                    <div class="detail-row">
                        <span>Persentase:</span>
                        <span>${percentage.toFixed(1)}%</span>
                    </div>
                    <div class="detail-row">
                        <span>Periode:</span>
                        <span>${getMonthName(budget.month)} ${budget.year}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Tambahkan style untuk budget details
    const style = document.createElement('style');
    style.textContent = `
        .budget-details {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid var(--border-color);
        }
        
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 0.9rem;
        }
        
        .detail-row:last-child {
            margin-bottom: 0;
        }
        
        .detail-row span:first-child {
            color: var(--text-light);
        }
        
        .budget-actions {
            display: flex;
            gap: 5px;
        }
        
        .no-data {
            text-align: center;
            padding: 40px 20px;
            grid-column: 1 / -1;
        }
        
        .no-data i {
            font-size: 3rem;
            color: var(--text-light);
            margin-bottom: 15px;
        }
        
        .no-data h3 {
            margin-bottom: 10px;
            color: var(--text-color);
        }
        
        .no-data p {
            color: var(--text-light);
            margin-bottom: 20px;
        }
    `;
    
    // Hapus style lama jika ada
    const oldStyle = document.getElementById('budgets-style');
    if (oldStyle) {
        oldStyle.remove();
    }
    
    style.id = 'budgets-style';
    document.head.appendChild(style);
}

/**
 * Dapatkan nama bulan dari angka
 * @param {number} monthNumber - Nomor bulan (1-12)
 * @returns {string} - Nama bulan
 */
function getMonthName(monthNumber) {
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[monthNumber - 1] || 'Tidak Diketahui';
}

/**
 * Tambah budget baru
 */
function addNewBudget() {
    // Reset form
    document.getElementById('budgetForm').reset();
    
    // Update judul modal
    document.getElementById('modalBudgetTitle').textContent = 'Tambah Budget Baru';
    
    // Isi dropdown kategori (hanya kategori pengeluaran)
    const categorySelect = document.getElementById('budgetCategory');
    const categories = app.getData('categories');
    const expenseCategories = categories.filter(cat => cat.type === 'expense');
    
    categorySelect.innerHTML = '';
    expenseCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });
    
    // Set bulan dan tahun saat ini
    const now = new Date();
    document.getElementById('budgetMonth').value = now.getMonth() + 1;
    document.getElementById('budgetYear').value = now.getFullYear();
    
    // Reset ID budget
    document.getElementById('budgetId').value = '';
    
    // Tampilkan modal
    app.showModal('budgetModal');
}

/**
 * Edit budget
 * @param {number} id - ID budget
 */
function editBudget(id) {
    // Ambil data budget
    const budgets = app.getData('budgets');
    const budget = budgets.find(b => b.id === id);
    
    if (!budget) {
        showNotification('Budget tidak ditemukan', 'error');
        return;
    }
    
    // Isi dropdown kategori
    const categorySelect = document.getElementById('budgetCategory');
    const categories = app.getData('categories');
    const expenseCategories = categories.filter(cat => cat.type === 'expense');
    
    categorySelect.innerHTML = '';
    expenseCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        if (category.id === budget.categoryId) {
            option.selected = true;
        }
        categorySelect.appendChild(option);
    });
    
    // Set nilai form
    document.getElementById('budgetId').value = budget.id;
    document.getElementById('budgetAmount').value = budget.amount;
    document.getElementById('budgetMonth').value = budget.month;
    document.getElementById('budgetYear').value = budget.year;
    
    // Update judul modal
    document.getElementById('modalBudgetTitle').textContent = 'Edit Budget';
    
    // Tampilkan modal
    app.showModal('budgetModal');
}

/**
 * Hapus budget
 * @param {number} id - ID budget
 */
function deleteBudget(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus budget ini?')) {
        return;
    }
    
    // Ambil data budget
    let budgets = app.getData('budgets');
    const budgetIndex = budgets.findIndex(b => b.id === id);
    
    if (budgetIndex === -1) {
        showNotification('Budget tidak ditemukan', 'error');
        return;
    }
    
    // Hapus budget
    budgets.splice(budgetIndex, 1);
    
    // Simpan ke localStorage
    app.saveData('budgets', budgets);
    
    // Update tampilan
    updateBudgetsDisplay();
    
    // Update dashboard jika sedang aktif
    if (document.getElementById('dashboard').classList.contains('active')) {
        loadDashboard();
    }
    
    // Tampilkan notifikasi
    showNotification('Budget berhasil dihapus', 'success');
}

/**
 * Simpan budget (tambah atau edit)
 */
function saveBudget() {
    // Validasi form
    const form = document.getElementById('budgetForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Ambil nilai form
    const id = document.getElementById('budgetId').value;
    const categoryId = parseInt(document.getElementById('budgetCategory').value);
    const amount = parseFloat(document.getElementById('budgetAmount').value);
    const month = parseInt(document.getElementById('budgetMonth').value);
    const year = parseInt(document.getElementById('budgetYear').value);
    
    // Validasi tambahan
    if (amount <= 0) {
        showNotification('Jumlah budget harus lebih dari 0', 'error');
        return;
    }
    
    // Ambil data budget
    let budgets = app.getData('budgets');
    
    if (id) {
        // Edit budget yang ada
        const budgetIndex = budgets.findIndex(b => b.id === parseInt(id));
        
        if (budgetIndex === -1) {
            showNotification('Budget tidak ditemukan', 'error');
            return;
        }
        
        // Update budget
        budgets[budgetIndex] = {
            ...budgets[budgetIndex],
            categoryId,
            amount,
            month,
            year,
            updatedAt: new Date().toISOString()
        };
    } else {
        // Tambah budget baru
        const newId = app.generateId('budget');
        
        // Cek apakah sudah ada budget untuk kategori dan periode yang sama
        const existingBudget = budgets.find(b => 
            b.categoryId === categoryId && 
            b.month === month && 
            b.year === year
        );
        
        if (existingBudget) {
            if (!confirm(`Sudah ada budget untuk kategori ini di periode ${getMonthName(month)} ${year}. Apakah Anda ingin menggantinya?`)) {
                return;
            }
            
            // Update budget yang ada
            const existingIndex = budgets.findIndex(b => b.id === existingBudget.id);
            budgets[existingIndex] = {
                ...budgets[existingIndex],
                amount,
                updatedAt: new Date().toISOString()
            };
        } else {
            // Tambah budget baru
            const newBudget = {
                id: newId,
                categoryId,
                amount,
                month,
                year,
                createdAt: new Date().toISOString()
            };
            
            budgets.push(newBudget);
        }
    }
    
    // Simpan ke localStorage
    app.saveData('budgets', budgets);
    
    // Tutup modal
    app.closeAllModals();
    
    // Update tampilan
    updateBudgetsDisplay();
    
    // Update dashboard jika sedang aktif
    if (document.getElementById('dashboard').classList.contains('active')) {
        loadDashboard();
    }
    
    // Tampilkan notifikasi
    showNotification(
        id ? 'Budget berhasil diperbarui' : 'Budget berhasil ditambahkan',
        'success'
    );
}

/**
 * Inisialisasi event listeners untuk halaman budget
 */
function initBudgetsEventListeners() {
    // Tombol tambah budget
    document.getElementById('addBudgetBtn').addEventListener('click', addNewBudget);
    
    // Form budget
    document.getElementById('budgetForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveBudget();
    });
}

// Ekspos fungsi ke global scope untuk event handlers di HTML
window.editBudget = editBudget;
window.deleteBudget = deleteBudget;