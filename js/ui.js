/**
 * UI Manager untuk FinTrack
 * Mengelola semua interaksi dan tampilan UI
 */

class UIManager {
    /**
     * Inisialisasi UI Manager
     */
    static init() {
        console.log('🎨 Initializing UI manager...');
        
        this.currentSection = 'dashboard';
        this.hideBalance = StorageManager.getHideBalance();
        this.theme = StorageManager.getTheme();
        
        this.setupEventListeners();
        this.applyTheme();
        this.updateBalanceBlur();
        this.updateCurrentDate();
        this.updateMobileMenu();
        
        console.log('✅ UI manager initialized');
    }

    /**
     * Setup semua event listeners
     */
    static setupEventListeners() {
        // Navigation
        this.setupNavigation();
        
        // Modal controls
        this.setupModalControls();
        
        // Theme toggle
        this.setupThemeToggle();
        
        // Hide balance toggle
        this.setupHideBalanceToggle();
        
        // Form controls
        this.setupFormControls();
        
        // Disable text selection and blue focus
        this.disableDefaultInteractions();
    }

    /**
     * Setup navigation
     */
    static setupNavigation() {
        // Desktop navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('href').substring(1);
                this.switchSection(section);
            });
        });

        // Mobile navigation
        document.querySelectorAll('.mobile-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('href').substring(1);
                this.switchSection(section);
                this.closeMobileMenu();
            });
        });

        // Mobile menu button
        document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
            this.toggleMobileMenu();
        });

        // Mobile menu close
        document.getElementById('mobileMenuClose')?.addEventListener('click', () => {
            this.closeMobileMenu();
        });

        // Mobile menu overlay
        document.getElementById('mobileMenuOverlay')?.addEventListener('click', () => {
            this.closeMobileMenu();
        });

        // View all link
        document.querySelector('.view-all-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchSection('transactions');
        });
    }

    /**
     * Setup modal controls
     */
    static setupModalControls() {
        // Close modal buttons
        document.querySelectorAll('.modal-close, .close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        // Modal background click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeAllModals();
                }
            });
        });

        // Transaction type selector
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.setTransactionType(type);
            });
        });
    }

    /**
     * Setup theme toggle
     */
    static setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggleBtn');
        const mobileThemeToggle = document.getElementById('mobileThemeToggle');

        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        if (mobileThemeToggle) {
            mobileThemeToggle.addEventListener('click', () => {
                this.toggleTheme();
                this.closeMobileMenu();
            });
        }
    }

    /**
     * Setup hide balance toggle
     */
    static setupHideBalanceToggle() {
        const hideBtn = document.getElementById('hideBalanceBtn');
        const mobileHideBtn = document.getElementById('mobileHideBalance');

        if (hideBtn) {
            hideBtn.addEventListener('click', () => this.toggleHideBalance());
        }

        if (mobileHideBtn) {
            mobileHideBtn.addEventListener('click', () => {
                this.toggleHideBalance();
                this.closeMobileMenu();
            });
        }
    }

    /**
     * Setup form controls
     */
    static setupFormControls() {
        // Date inputs - set today as default
        const today = new Date().toISOString().split('T')[0];
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            if (!input.value) {
                input.value = today;
            }
        });

        // Month input - set current month
        const monthInputs = document.querySelectorAll('input[type="month"]');
        monthInputs.forEach(input => {
            if (!input.value) {
                input.value = today.substring(0, 7);
            }
        });

        // Clear filters button
        document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
            this.clearFilters();
        });
    }

    /**
     * Disable default interactions (text selection, blue focus)
     */
    static disableDefaultInteractions() {
        // Disable text selection on non-input elements
        document.addEventListener('selectstart', (e) => {
            if (!e.target.matches('input, textarea, [contenteditable="true"]')) {
                e.preventDefault();
            }
        });

        // Custom focus styles
        document.addEventListener('focusin', (e) => {
            if (e.target.matches('button, a, input, select, textarea')) {
                e.target.classList.add('custom-focus');
            }
        });

        document.addEventListener('focusout', (e) => {
            if (e.target.matches('button, a, input, select, textarea')) {
                e.target.classList.remove('custom-focus');
            }
        });

        // Prevent blue highlight on tap (mobile)
        document.addEventListener('touchstart', (e) => {
            if (!e.target.matches('input, textarea, select')) {
                e.preventDefault();
            }
        }, { passive: false });

        // Prevent context menu
        document.addEventListener('contextmenu', (e) => {
            if (!e.target.matches('input, textarea')) {
                e.preventDefault();
            }
        });
    }

    /**
     * Switch between sections
     */
    static switchSection(sectionId) {
        console.log(`🔄 Switching to section: ${sectionId}`);
        
        // Update navigation
        document.querySelectorAll('.nav-item, .mobile-menu-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${sectionId}`) {
                item.classList.add('active');
            }
        });

        // Update sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Load section data
            this.loadSectionData(sectionId);
        }
    }

    /**
     * Load data for specific section
     */
    static loadSectionData(sectionId) {
        switch (sectionId) {
            case 'dashboard':
                if (typeof window.updateDashboard === 'function') {
                    window.updateDashboard();
                }
                break;
                
            case 'transactions':
                if (typeof window.updateTransactionsTable === 'function') {
                    window.updateTransactionsTable();
                }
                break;
                
            case 'wallets':
                if (typeof WalletManager !== 'undefined') {
                    WalletManager.loadWallets();
                }
                break;
                
            case 'reports':
                // Reports will load when generated
                break;
        }
    }

    /**
     * Toggle mobile menu
     */
    static toggleMobileMenu() {
        const menu = document.getElementById('mobileMenu');
        const overlay = document.getElementById('mobileMenuOverlay');
        
        if (menu && overlay) {
            menu.classList.toggle('active');
            overlay.classList.toggle('active');
            
            // Animate hamburger icon
            const menuBtn = document.getElementById('mobileMenuBtn');
            if (menuBtn) {
                menuBtn.classList.toggle('active');
            }
        }
    }

    /**
     * Close mobile menu
     */
    static closeMobileMenu() {
        const menu = document.getElementById('mobileMenu');
        const overlay = document.getElementById('mobileMenuOverlay');
        const menuBtn = document.getElementById('mobileMenuBtn');
        
        if (menu) menu.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        if (menuBtn) menuBtn.classList.remove('active');
    }

    /**
     * Update mobile menu content
     */
    static updateMobileMenu() {
        // Update current section in mobile menu
        const mobileItems = document.querySelectorAll('.mobile-menu-item');
        mobileItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${this.currentSection}`) {
                item.classList.add('active');
            }
        });
    }

    /**
     * Toggle theme (dark/light mode)
     */
    static toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        
        // Apply theme
        this.applyTheme();
        
        // Save to storage
        StorageManager.setTheme(this.theme);
        
        // Update button icons
        this.updateThemeIcons();
        
        // Update charts for new theme
        if (typeof ChartManager !== 'undefined') {
            setTimeout(() => ChartManager.updateAll(), 300);
        }
    }

    /**
     * Apply current theme
     */
    static applyTheme() {
        document.body.setAttribute('data-theme', this.theme);
    }

    /**
     * Update theme icons
     */
    static updateThemeIcons() {
        const themeToggle = document.getElementById('themeToggleBtn');
        const mobileThemeToggle = document.getElementById('mobileThemeToggle');
        
        if (themeToggle) {
            themeToggle.innerHTML = this.theme === 'dark' 
                ? '<i class="fas fa-sun"></i>' 
                : '<i class="fas fa-moon"></i>';
            
            themeToggle.title = this.theme === 'dark' 
                ? 'Mode Terang' 
                : 'Mode Gelap';
        }
        
        if (mobileThemeToggle) {
            mobileThemeToggle.innerHTML = this.theme === 'dark'
                ? '<i class="fas fa-sun"></i><span>Mode Terang</span>'
                : '<i class="fas fa-moon"></i><span>Mode Gelap</span>';
        }
    }

    /**
     * Toggle hide balance
     */
    static toggleHideBalance() {
        this.hideBalance = !this.hideBalance;
        
        // Apply blur effect
        this.updateBalanceBlur();
        
        // Save to storage
        StorageManager.setHideBalance(this.hideBalance);
        
        // Update button states
        this.updateHideBalanceButtons();
    }

    /**
     * Update balance blur effect
     */
    static updateBalanceBlur() {
        const balanceElements = document.querySelectorAll('.balance-amount, .wallet-balance');
        
        balanceElements.forEach(el => {
            if (this.hideBalance) {
                el.classList.add('blurred');
            } else {
                el.classList.remove('blurred');
            }
        });
    }

    /**
     * Update hide balance buttons
     */
    static updateHideBalanceButtons() {
        const hideBtn = document.getElementById('hideBalanceBtn');
        const mobileHideBtn = document.getElementById('mobileHideBalance');
        
        if (hideBtn) {
            if (this.hideBalance) {
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
            if (this.hideBalance) {
                mobileHideBtn.classList.add('active');
                mobileHideBtn.innerHTML = '<i class="fas fa-eye"></i><span>Tampilkan Saldo</span>';
            } else {
                mobileHideBtn.classList.remove('active');
                mobileHideBtn.innerHTML = '<i class="fas fa-eye-slash"></i><span>Sembunyikan Saldo</span>';
            }
        }
    }

    /**
     * Set transaction type in form
     */
    static setTransactionType(type) {
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.type === type) {
                btn.classList.add('active');
            }
        });
        
        document.getElementById('transType').value = type;
        
        // Update category options based on type
        this.updateCategoryOptions(type);
    }

    /**
     * Update category options based on transaction type
     */
    static updateCategoryOptions(type = null) {
        const categories = StorageManager.getCategories();
        const select = document.getElementById('transCategory');
        
        if (!select) return;
        
        let filteredCategories = categories;
        if (type) {
            filteredCategories = categories.filter(c => c.type === type);
        }
        
        const options = filteredCategories.map(cat => 
            `<option value="${cat.id}">${cat.name}</option>`
        ).join('');
        
        select.innerHTML = '<option value="">Pilih Kategori</option>' + options;
    }

    /**
     * Open modal
     */
    static openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    /**
     * Close all modals
     */
    static closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    /**
     * Clear all filters
     */
    static clearFilters() {
        // Reset filter selects
        document.getElementById('filterType').value = 'all';
        document.getElementById('filterCategory').value = 'all';
        document.getElementById('filterWallet').value = 'all';
        document.getElementById('filterDate').value = 'month';
        
        // Update transactions table
        if (typeof window.updateTransactionsTable === 'function') {
            window.updateTransactionsTable();
        }
        
        this.showNotification('Filter telah direset', 'success');
    }

    /**
     * Update current date display
     */
    static updateCurrentDate() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        
        const dateElement = document.getElementById('currentDate');
        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString('id-ID', options);
        }
    }

    /**
     * Format currency
     */
    static formatCurrency(amount) {
        return StorageManager.formatCurrency(amount);
    }

    /**
     * Format date
     */
    static formatDate(date) {
        return StorageManager.formatDate(date);
    }

    /**
     * Format short date
     */
    static formatShortDate(date) {
        return StorageManager.formatShortDate(date);
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

    /**
     * Show loading state
     */
    static showLoading(element) {
        element.classList.add('loading');
    }

    /**
     * Hide loading state
     */
    static hideLoading(element) {
        element.classList.remove('loading');
    }

    /**
     * Create pagination
     */
    static createPagination(currentPage, totalPages, containerId, callback) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        
        let paginationHTML = `
            <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} 
                onclick="${callback}(${currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // Show first page, last page, and pages around current page
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                paginationHTML += `
                    <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                        onclick="${callback}(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                paginationHTML += `<span class="pagination-dots">...</span>`;
            }
        }
        
        paginationHTML += `
            <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''}
                onclick="${callback}(${currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
            <span class="pagination-info">
                Halaman ${currentPage} dari ${totalPages}
            </span>
        `;
        
        container.innerHTML = paginationHTML;
    }

    /**
     * Create transaction item HTML
     */
    static createTransactionItem(transaction) {
        const categories = StorageManager.getCategories();
        const wallets = StorageManager.getWallets();
        
        const category = categories.find(c => c.id === transaction.category);
        const wallet = wallets.find(w => w.id === transaction.wallet);
        
        return `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="description">${transaction.description}</div>
                    <div class="meta">
                        <span class="category">${category ? category.name : 'Tidak ada kategori'}</span>
                        <span class="date">${this.formatShortDate(transaction.date)}</span>
                        <span class="wallet">${wallet ? wallet.name : 'Tidak ada dompet'}</span>
                    </div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                </div>
            </div>
        `;
    }

    /**
     * Create transaction table row HTML
     */
    static createTransactionRow(transaction) {
        const categories = StorageManager.getCategories();
        const wallets = StorageManager.getWallets();
        
        const category = categories.find(c => c.id === transaction.category);
        const wallet = wallets.find(w => w.id === transaction.wallet);
        const typeText = transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
        
        return `
            <tr>
                <td>${this.formatShortDate(transaction.date)}</td>
                <td>${transaction.description}</td>
                <td>${category ? category.name : 'Tidak ada'}</td>
                <td><span class="badge ${transaction.type}">${typeText}</span></td>
                <td>${wallet ? wallet.name : 'Tidak ada'}</td>
                <td class="${transaction.type}">
                    ${this.formatCurrency(transaction.amount)}
                </td>
                <td>
                    <button class="btn-small edit-transaction-btn" data-id="${transaction.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-small btn-danger delete-transaction-btn" data-id="${transaction.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    /**
     * Update category selects in all forms
     */
    static updateCategorySelects() {
        const categories = StorageManager.getCategories();
        const selects = [
            document.getElementById('filterCategory'),
            document.getElementById('transCategory'),
            document.getElementById('reportCategory')
        ];
        
        const options = categories.map(cat => 
            `<option value="${cat.id}">${cat.name}</option>`
        ).join('');
        
        selects.forEach(select => {
            if (select) {
                const currentValue = select.value;
                select.innerHTML = '<option value="all">Semua Kategori</option>' + options;
                select.value = currentValue;
                
                // Reset to "all" if current value is not valid
                if (!select.querySelector(`option[value="${currentValue}"]`)) {
                    select.value = 'all';
                }
            }
        });
        
        // Update transaction category select separately
        const transCategorySelect = document.getElementById('transCategory');
        if (transCategorySelect) {
            const currentValue = transCategorySelect.value;
            transCategorySelect.innerHTML = '<option value="">Pilih Kategori</option>' + options;
            transCategorySelect.value = currentValue;
        }
    }

    /**
     * Generate unique ID
     */
    static generateId() {
        return StorageManager.generateId();
    }
}

// Auto-initialize UI manager
document.addEventListener('DOMContentLoaded', () => {
    UIManager.init();
});