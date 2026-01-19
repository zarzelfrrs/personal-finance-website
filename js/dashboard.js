/**
 * FILE: dashboard.js
 * DESKRIPSI: Mengelola dashboard dan komponennya
 */

// Inisialisasi charts
let cashflowChart = null;
let expenseChart = null;

/**
 * Load dashboard dengan semua komponennya
 */
function loadDashboard() {
    console.log('Loading dashboard...');
    try {
        updateSummaryCards();
        updateCharts();
        updateRecentTransactions();
        updateAIInsights();
        
        // Inisialisasi event listeners untuk dashboard
        initDashboardEventListeners();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showNotification('Error loading dashboard: ' + error.message, 'error');
    }
}

/**
 * Update summary cards di dashboard
 */
function updateSummaryCards() {
    const cardsContainer = document.getElementById('summaryCards');
    if (!cardsContainer) return;
    
    try {
        // Hitung data untuk cards
        const totalBalance = app.calculateTotalBalance();
        const monthlyIncome = app.calculateMonthlyIncome();
        const monthlyExpense = app.calculateMonthlyExpense();
        
        // Hitung perubahan dari bulan lalu (sederhana, dalam aplikasi nyata akan lebih kompleks)
        // Untuk demo, kita gunakan angka acak
        const balanceChange = 2.5; // +2.5%
        const incomeChange = 5.7;  // +5.7%
        const expenseChange = -3.2; // -3.2%
        
        // Hitung sisa budget (total budget - pengeluaran bulan ini)
        const budgets = app.getData('budgets');
        const categories = app.getData('categories');
        
        let totalBudget = 0;
        let totalSpent = 0;
        
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        budgets.forEach(budget => {
            if (budget.month === currentMonth && budget.year === currentYear) {
                totalBudget += (budget.amount || 0);
                
                // Hitung pengeluaran untuk kategori ini bulan ini
                const transactions = app.getData('transactions');
                const categorySpent = transactions
                    .filter(trans => {
                        try {
                            const transDate = new Date(trans.date);
                            return trans.type === 'expense' && 
                                   trans.categoryId === budget.categoryId &&
                                   transDate.getMonth() + 1 === currentMonth &&
                                   transDate.getFullYear() === currentYear;
                        } catch (error) {
                            return false;
                        }
                    })
                    .reduce((sum, trans) => sum + (trans.amount || 0), 0);
                
                totalSpent += categorySpent;
            }
        });
        
        const budgetRemaining = totalBudget - totalSpent;
        const budgetPercentage = totalBudget > 0 ? (budgetRemaining / totalBudget) * 100 : 100;
        
        // Tentukan status budget
        let budgetStatus = 'Aman';
        let budgetStatusClass = 'status-safe';
        let budgetProgressClass = 'progress-safe';
        
        if (budgetPercentage < 20) {
            budgetStatus = 'Hampir Habis';
            budgetStatusClass = 'status-warning';
            budgetProgressClass = 'progress-warning';
        }
        
        if (budgetRemaining < 0) {
            budgetStatus = 'Melewati Limit';
            budgetStatusClass = 'status-danger';
            budgetProgressClass = 'progress-danger';
        }
        
        // Generate HTML untuk cards
        cardsContainer.innerHTML = `
            <div class="summary-card balance">
                <div class="card-header">
                    <div class="card-title">Total Saldo</div>
                    <div class="card-icon">
                        <i class="fas fa-wallet"></i>
                    </div>
                </div>
                <div class="card-value">${app.formatCurrency(totalBalance)}</div>
                <div class="card-change ${balanceChange >= 0 ? 'positive' : 'negative'}">
                    <i class="fas fa-${balanceChange >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
                    ${Math.abs(balanceChange)}% dari bulan lalu
                </div>
            </div>
            
            <div class="summary-card income">
                <div class="card-header">
                    <div class="card-title">Pemasukan Bulan Ini</div>
                    <div class="card-icon">
                        <i class="fas fa-money-bill-wave"></i>
                    </div>
                </div>
                <div class="card-value">${app.formatCurrency(monthlyIncome)}</div>
                <div class="card-change ${incomeChange >= 0 ? 'positive' : 'negative'}">
                    <i class="fas fa-${incomeChange >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
                    ${Math.abs(incomeChange)}% dari bulan lalu
                </div>
            </div>
            
            <div class="summary-card expense">
                <div class="card-header">
                    <div class="card-title">Pengeluaran Bulan Ini</div>
                    <div class="card-icon">
                        <i class="fas fa-shopping-cart"></i>
                    </div>
                </div>
                <div class="card-value">${app.formatCurrency(monthlyExpense)}</div>
                <div class="card-change ${expenseChange >= 0 ? 'positive' : 'negative'}">
                    <i class="fas fa-${expenseChange >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
                    ${Math.abs(expenseChange)}% dari bulan lalu
                </div>
            </div>
            
            <div class="summary-card budget">
                <div class="card-header">
                    <div class="card-title">Sisa Budget</div>
                    <div class="card-icon">
                        <i class="fas fa-chart-pie"></i>
                    </div>
                </div>
                <div class="card-value">${app.formatCurrency(budgetRemaining > 0 ? budgetRemaining : 0)}</div>
                <div class="budget-progress ${budgetProgressClass}">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(budgetPercentage, 100)}%"></div>
                    </div>
                    <div class="budget-status">
                        <span>${budgetPercentage.toFixed(1)}% tersisa</span>
                        <span class="status-badge ${budgetStatusClass}">${budgetStatus}</span>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error updating summary cards:', error);
        cardsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Gagal memuat data ringkasan</p>
            </div>
        `;
    }
}

/**
 * Update charts di dashboard
 */
function updateCharts() {
    try {
        updateCashflowChart();
        updateExpenseChart();
    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

/**
 * Update cashflow chart
 */
function updateCashflowChart() {
    const canvas = document.getElementById('cashflowChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    try {
        // Ambil data untuk 6 bulan terakhir
        const now = new Date();
        const months = [];
        const incomeData = [];
        const expenseData = [];
        const balanceData = [];
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthYear = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
            months.push(monthYear);
            
            // Hitung pemasukan dan pengeluaran untuk bulan ini
            const month = date.getMonth();
            const year = date.getFullYear();
            
            const transactions = app.getData('transactions');
            
            const income = transactions
                .filter(trans => {
                    try {
                        const transDate = new Date(trans.date);
                        return trans.type === 'income' && 
                               transDate.getMonth() === month && 
                               transDate.getFullYear() === year;
                    } catch (error) {
                        return false;
                    }
                })
                .reduce((sum, trans) => sum + (trans.amount || 0), 0);
            
            const expense = transactions
                .filter(trans => {
                    try {
                        const transDate = new Date(trans.date);
                        return trans.type === 'expense' && 
                               transDate.getMonth() === month && 
                               transDate.getFullYear() === year;
                    } catch (error) {
                        return false;
                    }
                })
                .reduce((sum, trans) => sum + (trans.amount || 0), 0);
            
            incomeData.push(income);
            expenseData.push(expense);
            balanceData.push(income - expense);
        }
        
        // Hancurkan chart sebelumnya jika ada
        if (cashflowChart) {
            cashflowChart.destroy();
        }
        
        // Buat chart baru
        cashflowChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Pemasukan',
                        data: incomeData,
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Pengeluaran',
                        data: expenseData,
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Saldo',
                        data: balanceData,
                        borderColor: '#4a6bff',
                        backgroundColor: 'rgba(74, 107, 255, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${app.formatCurrency(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                if (value >= 1000000) {
                                    return 'Rp' + (value / 1000000).toFixed(1) + 'Jt';
                                } else if (value >= 1000) {
                                    return 'Rp' + (value / 1000).toFixed(0) + 'Rb';
                                }
                                return 'Rp' + value;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating cashflow chart:', error);
        // Tampilkan pesan error
        const chartContainer = canvas.closest('.chart-wrapper');
        if (chartContainer) {
            chartContainer.innerHTML = '<div class="chart-error">Gagal memuat chart</div>';
        }
    }
}

/**
 * Update expense chart
 */
function updateExpenseChart() {
    const canvas = document.getElementById('expenseChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    try {
        // Ambil data pengeluaran per kategori bulan ini
        const categoryExpenses = calculateCategoryExpenses();
        
        const labels = Object.values(categoryExpenses).map(cat => cat.name);
        const data = Object.values(categoryExpenses).map(cat => cat.total);
        const backgroundColors = Object.values(categoryExpenses).map(cat => cat.color);
        
        // Jika tidak ada data, tampilkan pesan
        if (labels.length === 0) {
            if (expenseChart) {
                expenseChart.destroy();
            }
            
            // Tampilkan pesan "Tidak ada data"
            const chartContainer = canvas.closest('.chart-wrapper');
            if (chartContainer) {
                chartContainer.innerHTML = `
                    <div class="no-data-message">
                        <i class="fas fa-chart-pie"></i>
                        <p>Tidak ada pengeluaran bulan ini</p>
                    </div>
                `;
            }
            return;
        }
        
        // Hancurkan chart sebelumnya jika ada
        if (expenseChart) {
            expenseChart.destroy();
        }
        
        // Buat chart baru
        expenseChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 1,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${context.label}: ${app.formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    } catch (error) {
        console.error('Error creating expense chart:', error);
        // Tampilkan pesan error
        const chartContainer = canvas.closest('.chart-wrapper');
        if (chartContainer) {
            chartContainer.innerHTML = '<div class="chart-error">Gagal memuat chart</div>';
        }
    }
}

/**
 * Update recent transactions list
 */
function updateRecentTransactions() {
    const container = document.getElementById('recentTransactions');
    if (!container) return;
    
    try {
        const filterValue = document.getElementById('transactionFilter')?.value || '7';
        
        // Tentukan filter berdasarkan pilihan
        let filters = {};
        
        switch(filterValue) {
            case '1':
                filters.period = 'today';
                break;
            case '7':
                // Untuk minggu ini, kita atur custom
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                filters.startDate = weekAgo.toISOString().split('T')[0];
                filters.endDate = new Date().toISOString().split('T')[0];
                break;
            case '30':
                filters.period = 'month';
                break;
            case '365':
                filters.period = 'year';
                break;
            case 'all':
                // Tidak ada filter
                break;
        }
        
        const transactions = app.getFilteredTransactions(filters);
        const recentTransactions = transactions.slice(0, 5); // Ambil 5 transaksi terbaru
        
        // Generate HTML
        if (recentTransactions.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-receipt"></i>
                    <p>Tidak ada transaksi</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        
        recentTransactions.forEach(trans => {
            const category = app.getCategoryById(trans.categoryId);
            const wallet = app.getWalletById(trans.walletId);
            const isIncome = trans.type === 'income';
            
            html += `
                <div class="transaction-item ${isIncome ? 'transaction-income' : 'transaction-expense'}">
                    <div class="transaction-info">
                        <div class="transaction-icon">
                            <i class="fas fa-${isIncome ? 'arrow-down' : 'arrow-up'}"></i>
                        </div>
                        <div class="transaction-details">
                            <h4>${trans.description || 'Tidak ada deskripsi'}</h4>
                            <p>${category.name} • ${wallet.name} • ${app.formatDate(trans.date)}</p>
                        </div>
                    </div>
                    <div class="transaction-amount">
                        ${isIncome ? '+' : '-'} ${app.formatCurrency(trans.amount || 0)}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Error updating recent transactions:', error);
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Gagal memuat transaksi terbaru</p>
            </div>
        `;
    }
}

/**
 * Inisialisasi event listeners untuk dashboard
 */
function initDashboardEventListeners() {
    try {
        // Event listeners untuk mengubah tipe cashflow chart
        document.querySelectorAll('#cashflowChart').closest('.chart-container')?.querySelectorAll('.btn-chart-type').forEach(btn => {
            btn.addEventListener('click', function() {
                const chartType = this.getAttribute('data-chart');
                
                // Update active state
                this.closest('.chart-controls')?.querySelectorAll('.btn-chart-type').forEach(b => {
                    b.classList.remove('active');
                });
                this.classList.add('active');
                
                // Ubah tipe chart
                if (cashflowChart) {
                    cashflowChart.config.type = chartType;
                    cashflowChart.update();
                }
            });
        });
        
        // Event listeners untuk mengubah tipe expense chart
        document.querySelectorAll('#expenseChart').closest('.chart-container')?.querySelectorAll('.btn-chart-type').forEach(btn => {
            btn.addEventListener('click', function() {
                const chartType = this.getAttribute('data-chart');
                
                // Update active state
                this.closest('.chart-controls')?.querySelectorAll('.btn-chart-type').forEach(b => {
                    b.classList.remove('active');
                });
                this.classList.add('active');
                
                // Ubah tipe chart
                if (expenseChart) {
                    expenseChart.config.type = chartType;
                    expenseChart.update();
                }
            });
        });
    } catch (error) {
        console.error('Error initializing dashboard event listeners:', error);
    }
}

// Tambahkan helper function untuk calculateCategoryExpenses
function calculateCategoryExpenses() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const transactions = app.getData('transactions');
    const categories = app.getData('categories');
    
    const result = {};
    
    try {
        // Inisialisasi semua kategori pengeluaran dengan 0
        categories
            .filter(cat => cat.type === 'expense')
            .forEach(cat => {
                result[cat.id] = {
                    name: cat.name,
                    color: cat.color,
                    total: 0
                };
            });
        
        // Hitung total per kategori
        transactions
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
            .forEach(trans => {
                if (result[trans.categoryId]) {
                    result[trans.categoryId].total += (trans.amount || 0);
                }
            });
        
        // Filter hanya kategori dengan total > 0
        const filteredResult = {};
        Object.keys(result).forEach(key => {
            if (result[key].total > 0) {
                filteredResult[key] = result[key];
            }
        });
        
        return filteredResult;
    } catch (error) {
        console.error('Error calculating category expenses:', error);
        return {};
    }
}

/**
 * Update cashflow chart dengan tipe yang dapat diubah
 */
function updateCashflowChart(chartType = 'line') {
    const ctx = document.getElementById('cashflowChart').getContext('2d');
    
    // Ambil data untuk 6 bulan terakhir
    const now = new Date();
    const months = [];
    const incomeData = [];
    const expenseData = [];
    const balanceData = [];
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthYear = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        months.push(monthYear);
        
        // Hitung pemasukan dan pengeluaran untuk bulan ini
        const month = date.getMonth();
        const year = date.getFullYear();
        
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        
        const income = transactions
            .filter(trans => {
                const transDate = new Date(trans.date);
                return trans.type === 'income' && 
                       transDate.getMonth() === month && 
                       transDate.getFullYear() === year;
            })
            .reduce((sum, trans) => sum + trans.amount, 0);
        
        const expense = transactions
            .filter(trans => {
                const transDate = new Date(trans.date);
                return trans.type === 'expense' && 
                       transDate.getMonth() === month && 
                       transDate.getFullYear() === year;
            })
            .reduce((sum, trans) => sum + trans.amount, 0);
        
        incomeData.push(income);
        expenseData.push(expense);
        balanceData.push(income - expense);
    }
    
    // Hancurkan chart sebelumnya jika ada
    if (cashflowChart) {
        cashflowChart.destroy();
    }
    
    // Buat chart baru
    cashflowChart = new Chart(ctx, {
        type: chartType,
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Pemasukan',
                    data: incomeData,
                    borderColor: '#28a745',
                    backgroundColor: chartType === 'bar' ? 'rgba(40, 167, 69, 0.7)' : 'rgba(40, 167, 69, 0.1)',
                    borderWidth: 3,
                    fill: chartType === 'line',
                    tension: 0.3
                },
                {
                    label: 'Pengeluaran',
                    data: expenseData,
                    borderColor: '#dc3545',
                    backgroundColor: chartType === 'bar' ? 'rgba(220, 53, 69, 0.7)' : 'rgba(220, 53, 69, 0.1)',
                    borderWidth: 3,
                    fill: chartType === 'line',
                    tension: 0.3
                },
                {
                    label: 'Saldo',
                    data: balanceData,
                    borderColor: '#4a6bff',
                    backgroundColor: chartType === 'bar' ? 'rgba(74, 107, 255, 0.7)' : 'rgba(74, 107, 255, 0.1)',
                    borderWidth: 3,
                    fill: chartType === 'line',
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${app.formatCurrency(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000000) {
                                return 'Rp' + (value / 1000000).toFixed(1) + 'Jt';
                            } else if (value >= 1000) {
                                return 'Rp' + (value / 1000).toFixed(0) + 'Rb';
                            }
                            return 'Rp' + value;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Update expense chart dengan tipe yang dapat diubah
 */
function updateExpenseChart(chartType = 'doughnut') {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    // Ambil data pengeluaran per kategori bulan ini
    const categoryExpenses = app.calculateCategoryExpenses();
    
    const labels = Object.values(categoryExpenses).map(cat => cat.name);
    const data = Object.values(categoryExpenses).map(cat => cat.total);
    const backgroundColors = Object.values(categoryExpenses).map(cat => cat.color);
    
    // Jika tidak ada data, tampilkan pesan
    if (labels.length === 0) {
        if (expenseChart) {
            expenseChart.destroy();
        }
        
        // Buat chart kosong dengan pesan
        expenseChart = new Chart(ctx, {
            type: chartType,
            data: {
                labels: ['Tidak ada data'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#e9ecef'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                }
            }
        });
        
        return;
    }
    
    // Hancurkan chart sebelumnya jika ada
    if (expenseChart) {
        expenseChart.destroy();
    }
    
    // Konfigurasi berdasarkan tipe chart
    let chartConfig = {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 1,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: chartType === 'bar' ? 'top' : 'right',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${context.label}: ${app.formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    };
    
    // Konfigurasi khusus untuk bar chart
    if (chartType === 'bar') {
        chartConfig.options.scales = {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        if (value >= 1000000) {
                            return 'Rp' + (value / 1000000).toFixed(1) + 'Jt';
                        } else if (value >= 1000) {
                            return 'Rp' + (value / 1000).toFixed(0) + 'Rb';
                        }
                        return 'Rp' + value;
                    }
                }
            }
        };
    } else {
        // Untuk pie dan doughnut, tambahkan cutout
        chartConfig.options.cutout = chartType === 'doughnut' ? '60%' : 0;
    }
    
    // Buat chart baru
    expenseChart = new Chart(ctx, chartConfig);
}

/**
 * Inisialisasi event listeners untuk dashboard
 */
function initDashboardEventListeners() {
    // Event listeners untuk mengubah tipe cashflow chart
    const cashflowChartControls = document.querySelector('#cashflowChart').closest('.chart-container').querySelector('.chart-controls');
    if (cashflowChartControls) {
        cashflowChartControls.addEventListener('click', function(e) {
            if (e.target.classList.contains('btn-chart-type')) {
                const chartType = e.target.getAttribute('data-chart');
                
                // Update active state
                this.querySelectorAll('.btn-chart-type').forEach(b => {
                    b.classList.remove('active');
                });
                e.target.classList.add('active');
                
                // Ubah tipe chart
                updateCashflowChart(chartType);
            }
        });
    }
    
    // Event listeners untuk mengubah tipe expense chart
    const expenseChartControls = document.querySelector('#expenseChart').closest('.chart-container').querySelector('.chart-controls');
    if (expenseChartControls) {
        expenseChartControls.addEventListener('click', function(e) {
            if (e.target.classList.contains('btn-chart-type')) {
                const chartType = e.target.getAttribute('data-chart');
                
                // Update active state
                this.querySelectorAll('.btn-chart-type').forEach(b => {
                    b.classList.remove('active');
                });
                e.target.classList.add('active');
                
                // Ubah tipe chart
                updateExpenseChart(chartType);
            }
        });
    }
}

/**
 * Load dashboard dengan semua komponennya
 */
function loadDashboard() {
    try {
        updateSummaryCards();
        
        // Inisialisasi charts dengan tipe default
        updateCashflowChart('line');
        updateExpenseChart('doughnut');
        
        updateRecentTransactions();
        updateAIInsights();
        
        // Inisialisasi event listeners untuk dashboard
        initDashboardEventListeners();
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showNotification('Error loading dashboard. Please refresh the page.', 'error');
    }
}