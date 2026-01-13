/**
 * Wallet Manager untuk FinTrack
 * Mengelola semua operasi terkait dompet
 */

class WalletManager {
    /**
     * Inisialisasi wallet manager
     */
    static init() {
        console.log('💰 Initializing wallet manager...');
        
        this.loadWallets();
        this.setupEventListeners();
        
        console.log('✅ Wallet manager initialized');
    }

    /**
     * Load wallets dari storage
     */
    static loadWallets() {
        this.wallets = StorageManager.getWallets();
        this.updateWalletSelects();
        this.renderWallets();
    }

    /**
     * Setup event listeners untuk wallet operations
     */
    static setupEventListeners() {
        console.log('🔗 Setting up wallet event listeners...');
        
        // Add wallet button
        const addWalletBtn = document.getElementById('addWalletBtn');
        if (addWalletBtn) {
            addWalletBtn.addEventListener('click', () => {
                this.openWalletModal();
            });
        }

        // Wallet form submission
        const walletForm = document.getElementById('walletForm');
        if (walletForm) {
            walletForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleWalletSubmit(e);
            });
        }

        // Transfer form submission
        const transferForm = document.getElementById('transferForm');
        if (transferForm) {
            transferForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleTransferSubmit(e);
            });
        }

        // Color picker
        this.setupColorPicker();

        // Event delegation untuk wallet actions
        document.addEventListener('click', (e) => {
            console.log('Click event:', e.target);
            
            // Edit wallet button
            const editBtn = e.target.closest('.edit-wallet-btn');
            if (editBtn) {
                e.preventDefault();
                e.stopPropagation();
                const walletId = editBtn.dataset.walletId;
                console.log('Edit wallet clicked:', walletId);
                this.editWallet(walletId);
                return;
            }
            
            // Delete wallet button
            const deleteBtn = e.target.closest('.delete-wallet-btn');
            if (deleteBtn) {
                e.preventDefault();
                e.stopPropagation();
                const walletId = deleteBtn.dataset.walletId;
                console.log('Delete wallet clicked:', walletId);
                this.confirmDeleteWallet(walletId);
                return;
            }
        });

        console.log('✅ Wallet event listeners setup complete');
    }

    /**
     * Setup color picker
     */
    static setupColorPicker() {
        const colors = [
            '#4f46e5', '#10b981', '#f59e0b', '#ef4444',
            '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
            '#14b8a6', '#84cc16', '#f43f5e', '#6366f1'
        ];
        
        const container = document.getElementById('colorPicker');
        if (!container) {
            console.warn('Color picker container not found');
            return;
        }
        
        container.innerHTML = colors.map(color => `
            <div class="color-option" data-color="${color}" style="background-color: ${color}"></div>
        `).join('');
        
        // Add click event listeners
        container.querySelectorAll('.color-option').forEach(color => {
            color.addEventListener('click', (e) => {
                container.querySelectorAll('.color-option').forEach(c => c.classList.remove('selected'));
                color.classList.add('selected');
                document.getElementById('selectedColor').value = color.dataset.color;
            });
        });
        
        // Select first color by default
        if (container.firstChild) {
            container.firstChild.classList.add('selected');
            document.getElementById('selectedColor').value = container.firstChild.dataset.color;
        }
    }

    /**
     * Open wallet modal (add/edit)
     * @param {Object} walletData - Data wallet untuk edit (optional)
     */
    static openWalletModal(walletData = null) {
        console.log('Opening wallet modal:', walletData);
        
        const modal = document.getElementById('walletModal');
        const form = document.getElementById('walletForm');
        const title = document.getElementById('walletModalTitle');
        
        if (!modal || !form || !title) {
            console.error('Wallet modal elements not found');
            return;
        }
        
        // Reset form
        form.reset();
        
        if (walletData) {
            // Edit mode
            title.textContent = 'Edit Dompet';
            document.getElementById('walletId').value = walletData.id;
            document.getElementById('walletName').value = walletData.name;
            document.getElementById('walletType').value = walletData.type;
            document.getElementById('walletBalance').value = walletData.balance;
            document.getElementById('selectedColor').value = walletData.color;
            
            // Select color
            const colorPicker = document.getElementById('colorPicker');
            if (colorPicker) {
                colorPicker.querySelectorAll('.color-option').forEach(color => {
                    color.classList.remove('selected');
                    if (color.dataset.color === walletData.color) {
                        color.classList.add('selected');
                    }
                });
            }
        } else {
            // Add mode
            title.textContent = 'Tambah Dompet';
            document.getElementById('walletId').value = '';
            document.getElementById('walletBalance').value = 0;
            
            // Reset color selection
            const colorPicker = document.getElementById('colorPicker');
            if (colorPicker && colorPicker.firstChild) {
                colorPicker.querySelectorAll('.color-option').forEach(c => c.classList.remove('selected'));
                colorPicker.firstChild.classList.add('selected');
                document.getElementById('selectedColor').value = colorPicker.firstChild.dataset.color;
            }
        }
        
        modal.classList.add('active');
    }

    /**
     * Handle wallet form submission
     */
    static handleWalletSubmit(e) {
        e.preventDefault();
        
        console.log('Handling wallet form submission...');
        
        const formData = {
            id: document.getElementById('walletId').value || StorageManager.generateId(),
            name: document.getElementById('walletName').value.trim(),
            type: document.getElementById('walletType').value,
            balance: parseFloat(document.getElementById('walletBalance').value) || 0,
            color: document.getElementById('selectedColor').value,
            createdAt: new Date().toISOString()
        };
        
        console.log('Form data:', formData);
        
        // Validation
        if (!formData.name) {
            this.showError('Nama dompet tidak boleh kosong');
            return;
        }
        
        if (formData.balance < 0) {
            this.showError('Saldo tidak boleh negatif');
            return;
        }
        
        // Check for duplicate name (excluding current wallet in edit mode)
        const existingWallet = this.wallets.find(w => 
            w.name.toLowerCase() === formData.name.toLowerCase() &&
            w.id !== formData.id
        );
        
        if (existingWallet) {
            this.showError('Nama dompet sudah ada');
            return;
        }
        
        // Save wallet
        let success = false;
        if (document.getElementById('walletId').value) {
            // Update existing wallet
            console.log('Updating existing wallet:', formData.id);
            success = StorageManager.updateWallet(formData.id, formData);
            if (success) {
                this.showSuccess('Dompet berhasil diupdate');
            }
        } else {
            // Add new wallet
            console.log('Adding new wallet');
            success = StorageManager.addWallet(formData);
            if (success) {
                this.showSuccess('Dompet berhasil ditambahkan');
            }
        }
        
        if (success) {
            // Update UI
            this.loadWallets();
            this.closeModal();
            
            // Trigger dashboard update
            if (typeof window.updateDashboard === 'function') {
                window.updateDashboard();
            }
        } else {
            this.showError('Gagal menyimpan dompet');
        }
    }

    /**
     * Edit wallet
     * @param {string} walletId - ID wallet yang akan diedit
     */
    static editWallet(walletId) {
        console.log('Editing wallet:', walletId);
        
        const wallet = this.wallets.find(w => w.id === walletId);
        if (wallet) {
            console.log('Found wallet:', wallet);
            this.openWalletModal(wallet);
        } else {
            console.error('Wallet not found:', walletId);
            this.showError('Dompet tidak ditemukan');
        }
    }

    /**
     * Confirm delete wallet
     * @param {string} walletId - ID wallet yang akan dihapus
     */
    static confirmDeleteWallet(walletId) {
        const wallet = this.wallets.find(w => w.id === walletId);
        if (!wallet) {
            this.showError('Dompet tidak ditemukan');
            return;
        }
        
        // Check if wallet has transactions
        const transactions = StorageManager.getTransactions();
        const hasTransactions = transactions.some(t => 
            t.wallet === walletId || t.toWallet === walletId
        );
        
        let message = `Apakah Anda yakin ingin menghapus dompet "${wallet.name}"?`;
        
        if (hasTransactions) {
            message += '\n\n⚠️ Dompet ini memiliki transaksi. Semua transaksi terkait juga akan dihapus.';
        }
        
        // Show confirmation modal
        const modal = document.getElementById('confirmModal');
        const messageElement = document.getElementById('confirmMessage');
        const deleteBtn = document.getElementById('confirmDelete');
        
        if (!modal || !messageElement || !deleteBtn) {
            this.showError('Modal konfirmasi tidak ditemukan');
            return;
        }
        
        messageElement.textContent = message;
        
        // Set up delete button
        const originalOnClick = deleteBtn.onclick;
        deleteBtn.onclick = () => {
            this.deleteWallet(walletId);
            modal.classList.remove('active');
            deleteBtn.onclick = originalOnClick; // Restore original handler
        };
        
        modal.classList.add('active');
    }

    /**
     * Delete wallet
     * @param {string} walletId - ID wallet yang akan dihapus
     */
    static deleteWallet(walletId) {
        console.log('Deleting wallet:', walletId);
        
        // Delete related transactions
        const transactions = StorageManager.getTransactions();
        const filteredTransactions = transactions.filter(t => 
            t.wallet !== walletId && t.toWallet !== walletId
        );
        StorageManager.saveTransactions(filteredTransactions);
        
        // Delete wallet
        const success = StorageManager.deleteWallet(walletId);
        
        if (success) {
            this.showSuccess('Dompet berhasil dihapus');
            this.loadWallets();
            
            // Trigger dashboard update
            if (typeof window.updateDashboard === 'function') {
                window.updateDashboard();
            }
        } else {
            this.showError('Gagal menghapus dompet');
        }
    }

    /**
     * Handle transfer form submission
     */
    static handleTransferSubmit(e) {
        e.preventDefault();
        
        console.log('Handling transfer form submission...');
        
        const fromWalletId = document.getElementById('transferFrom').value;
        const toWalletId = document.getElementById('transferTo').value;
        const amount = parseFloat(document.getElementById('transferAmount').value);
        const note = document.getElementById('transferNote').value.trim();
        
        console.log('Transfer data:', { fromWalletId, toWalletId, amount, note });
        
        // Validation
        if (!fromWalletId || !toWalletId) {
            this.showError('Pilih dompet asal dan tujuan');
            return;
        }
        
        if (fromWalletId === toWalletId) {
            this.showError('Tidak bisa transfer ke dompet yang sama');
            return;
        }
        
        if (!amount || amount <= 0) {
            this.showError('Jumlah transfer harus lebih dari 0');
            return;
        }
        
        // Check balance
        const fromWallet = this.wallets.find(w => w.id === fromWalletId);
        if (!fromWallet || fromWallet.balance < amount) {
            this.showError('Saldo tidak mencukupi');
            return;
        }
        
        // Process transfer
        const success = StorageManager.transferWalletBalance(fromWalletId, toWalletId, amount);
        
        if (success) {
            // Create transfer transaction
            const toWallet = this.wallets.find(w => w.id === toWalletId);
            const transferTransaction = {
                id: StorageManager.generateId(),
                type: 'transfer',
                amount: amount,
                date: new Date().toISOString().split('T')[0],
                description: note || `Transfer dari ${fromWallet.name} ke ${toWallet.name}`,
                wallet: fromWalletId,
                toWallet: toWalletId,
                notes: 'Transfer antar dompet',
                createdAt: new Date().toISOString()
            };
            
            StorageManager.addTransaction(transferTransaction);
            
            this.showSuccess('Transfer berhasil');
            e.target.reset();
            
            // Update UI
            this.loadWallets();
            
            // Trigger dashboard update
            if (typeof window.updateDashboard === 'function') {
                window.updateDashboard();
            }
            
            // Trigger transactions update
            if (typeof window.updateTransactionsTable === 'function') {
                window.updateTransactionsTable();
            }
        } else {
            this.showError('Gagal melakukan transfer');
        }
    }

    /**
     * Render wallets ke UI
     */
    static renderWallets() {
        const container = document.getElementById('walletsGrid');
        if (!container) {
            console.error('Wallets grid container not found');
            return;
        }
        
        console.log('Rendering wallets:', this.wallets.length);
        
        if (this.wallets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-wallet"></i>
                    <p>Belum ada dompet</p>
                    <button class="btn btn-primary" id="addFirstWalletBtn">
                        <i class="fas fa-plus"></i> Tambah Dompet Pertama
                    </button>
                </div>
            `;
            
            // Add event listener to the button
            const addFirstWalletBtn = document.getElementById('addFirstWalletBtn');
            if (addFirstWalletBtn) {
                addFirstWalletBtn.addEventListener('click', () => {
                    this.openWalletModal();
                });
            }
            
            return;
        }
        
        container.innerHTML = this.wallets.map(wallet => {
            const icon = this.getWalletIcon(wallet.type);
            const typeName = this.getWalletTypeName(wallet.type);
            const formattedBalance = StorageManager.formatCurrency(wallet.balance);
            
            return `
                <div class="wallet-card" style="--wallet-color: ${wallet.color}">
                    <div class="wallet-header">
                        <div class="wallet-name">
                            <i class="fas ${icon}" style="color: ${wallet.color}"></i>
                            <h3>${wallet.name}</h3>
                        </div>
                        <span class="wallet-type">${typeName}</span>
                    </div>
                    <div class="wallet-balance" id="wallet-balance-${wallet.id}">
                        ${formattedBalance}
                    </div>
                    <div class="wallet-meta">
                        <span>Saldo saat ini</span>
                        <span>${StorageManager.formatShortDate(new Date())}</span>
                    </div>
                    <div class="wallet-actions">
                        <button class="btn btn-secondary btn-sm edit-wallet-btn" 
                                data-wallet-id="${wallet.id}"
                                title="Edit dompet">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger btn-sm delete-wallet-btn" 
                                data-wallet-id="${wallet.id}"
                                title="Hapus dompet">
                            <i class="fas fa-trash"></i> Hapus
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Apply blur effect if balance is hidden
        this.updateBalanceBlur();
        
        console.log('Wallets rendered successfully');
    }

    /**
     * Update wallet selects di semua form
     */
    static updateWalletSelects() {
        console.log('Updating wallet selects...');
        
        const selects = [
            { id: 'filterWallet', defaultOption: 'Semua Dompet' },
            { id: 'transWallet', defaultOption: 'Pilih Dompet' },
            { id: 'transferFrom', defaultOption: 'Pilih Dompet' },
            { id: 'transferTo', defaultOption: 'Pilih Dompet' },
            { id: 'reportWallet', defaultOption: 'Semua Dompet' }
        ];
        
        selects.forEach(selectInfo => {
            const select = document.getElementById(selectInfo.id);
            if (select) {
                const currentValue = select.value;
                const options = this.wallets.map(wallet => 
                    `<option value="${wallet.id}">${wallet.name}</option>`
                ).join('');
                
                select.innerHTML = `<option value="all">${selectInfo.defaultOption}</option>` + options;
                
                // Preserve current value if it exists
                if (currentValue && select.querySelector(`option[value="${currentValue}"]`)) {
                    select.value = currentValue;
                } else if (selectInfo.id === 'transferFrom' && this.wallets.length > 0) {
                    // Default select first wallet for transfer from
                    select.value = this.wallets[0].id;
                }
            }
        });
        
        console.log('Wallet selects updated');
    }

    /**
     * Update balance blur effect
     */
    static updateBalanceBlur() {
        const isHidden = StorageManager.getHideBalance();
        
        // Update all balance elements
        const balanceElements = document.querySelectorAll('.balance-amount, .wallet-balance');
        balanceElements.forEach(el => {
            if (isHidden) {
                el.classList.add('blurred');
            } else {
                el.classList.remove('blurred');
            }
        });
        
        // Update button states
        this.updateHideBalanceButtons();
    }

    /**
     * Update hide balance buttons
     */
    static updateHideBalanceButtons() {
        const isHidden = StorageManager.getHideBalance();
        const hideBtn = document.getElementById('hideBalanceBtn');
        const mobileHideBtn = document.getElementById('mobileHideBalance');
        
        if (hideBtn) {
            if (isHidden) {
                hideBtn.classList.add('active');
                hideBtn.innerHTML = '<i class="fas fa-eye"></i>';
                hideBtn.title = 'Tampilkan Saldo';
            } else {
                hideBtn.classList.remove('active');
                hideBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
                hideBtn.title = 'Sembunyikan Saldo';
            }
        }
        
        if (mobileHideBtn) {
            if (isHidden) {
                mobileHideBtn.classList.add('active');
                mobileHideBtn.innerHTML = '<i class="fas fa-eye"></i><span>Tampilkan Saldo</span>';
            } else {
                mobileHideBtn.classList.remove('active');
                mobileHideBtn.innerHTML = '<i class="fas fa-eye-slash"></i><span>Sembunyikan Saldo</span>';
            }
        }
    }

    /**
     * Get wallet icon berdasarkan type
     */
    static getWalletIcon(type) {
        const icons = {
            cash: 'fa-money-bill-wave',
            bank: 'fa-university',
            ewallet: 'fa-mobile-alt',
            savings: 'fa-piggy-bank',
            investment: 'fa-chart-line'
        };
        return icons[type] || 'fa-wallet';
    }

    /**
     * Get wallet type name
     */
    static getWalletTypeName(type) {
        const names = {
            cash: 'Tunai',
            bank: 'Bank',
            ewallet: 'E-Wallet',
            savings: 'Tabungan',
            investment: 'Investasi'
        };
        return names[type] || type;
    }

    /**
     * Calculate total balance dari semua dompet
     */
    static getTotalBalance() {
        return this.wallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);
    }

    /**
     * Get wallet by ID
     */
    static getWalletById(walletId) {
        return this.wallets.find(w => w.id === walletId);
    }

    /**
     * Close modal
     */
    static closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    /**
     * Show success message
     */
    static showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * Show error message
     */
    static showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Show notification
     */
    static showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'exclamation-circle' : 'info-circle';
        
        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Auto-initialize wallet manager
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing WalletManager...');
    WalletManager.init();
});
