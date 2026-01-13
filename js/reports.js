/**
 * Report Manager untuk FinTrack
 * Mengelola pembuatan dan export laporan keuangan
 */

class ReportManager {
    /**
     * Inisialisasi report manager
     */
    static init() {
        console.log('📊 Initializing report manager...');
        
        this.setupEventListeners();
        this.updateReportFilters();
        
        console.log('✅ Report manager initialized');
    }

    /**
     * Setup event listeners
     */
    static setupEventListeners() {
        // Generate report button
        document.getElementById('generateReportBtn')?.addEventListener('click', () => {
            this.generateReport();
        });

        // Export PDF button
        document.getElementById('exportPDFBtn')?.addEventListener('click', () => {
            this.exportPDF();
        });

        // Export Excel button
        document.getElementById('exportExcelBtn')?.addEventListener('click', () => {
            this.exportExcel();
        });

        // Report type change
        document.getElementById('reportType')?.addEventListener('change', () => {
            this.updateReportDateInput();
        });
    }

    /**
     * Update report filters
     */
    static updateReportFilters() {
        this.updateReportDateInput();
        
        // Set default date to current month
        const now = new Date();
        const currentMonth = now.toISOString().slice(0, 7);
        document.getElementById('reportDate').value = currentMonth;
    }

    /**
     * Update report date input berdasarkan jenis laporan
     */
    static updateReportDateInput() {
        const reportType = document.getElementById('reportType').value;
        const dateInput = document.getElementById('reportDate');
        
        switch (reportType) {
            case 'daily':
                dateInput.type = 'date';
                break;
            case 'weekly':
                dateInput.type = 'week';
                break;
            case 'monthly':
                dateInput.type = 'month';
                break;
        }
    }

    /**
     * Generate laporan keuangan
     */
    static generateReport() {
        console.log('📈 Generating report...');
        
        const reportType = document.getElementById('reportType').value;
        const dateValue = document.getElementById('reportDate').value;
        const categoryId = document.getElementById('reportCategory').value;
        const walletId = document.getElementById('reportWallet').value;
        
        // Validasi input
        if (!dateValue) {
            this.showError('Pilih periode laporan');
            return;
        }
        
        // Dapatkan transaksi berdasarkan filter
        let transactions = this.getFilteredTransactions(reportType, dateValue, categoryId, walletId);
        
        // Generate report data
        const reportData = this.processReportData(transactions, reportType);
        
        // Render report
        this.renderReport(reportData, transactions);
        
        this.showSuccess('Laporan berhasil digenerate');
    }

    /**
     * Dapatkan transaksi yang difilter
     */
    static getFilteredTransactions(reportType, dateValue, categoryId, walletId) {
        let transactions = StorageManager.getTransactions();
        
        // Filter berdasarkan tanggal
        const dateFilter = this.getDateFilter(reportType, dateValue);
        if (dateFilter) {
            transactions = transactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate >= dateFilter.start && transactionDate <= dateFilter.end;
            });
        }
        
        // Filter berdasarkan kategori
        if (categoryId !== 'all') {
            transactions = transactions.filter(t => t.category === categoryId);
        }
        
        // Filter berdasarkan dompet
        if (walletId !== 'all') {
            transactions = transactions.filter(t => t.wallet === walletId);
        }
        
        return transactions;
    }

    /**
     * Dapatkan filter tanggal berdasarkan jenis laporan
     */
    static getDateFilter(reportType, dateValue) {
        if (!dateValue) return null;
        
        const date = new Date(dateValue);
        
        switch (reportType) {
            case 'daily':
                const start = new Date(date);
                start.setHours(0, 0, 0, 0);
                
                const end = new Date(date);
                end.setHours(23, 59, 59, 999);
                
                return { start, end };
                
            case 'weekly':
                // Cari hari Senin dari minggu tersebut
                const monday = new Date(date);
                const day = monday.getDay();
                const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
                monday.setDate(diff);
                monday.setHours(0, 0, 0, 0);
                
                // Tambah 6 hari untuk mendapatkan Minggu
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                sunday.setHours(23, 59, 59, 999);
                
                return { start: monday, end: sunday };
                
            case 'monthly':
                const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
                const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                monthEnd.setHours(23, 59, 59, 999);
                
                return { start: monthStart, end: monthEnd };
                
            default:
                return null;
        }
    }

    /**
     * Proses data untuk laporan
     */
    static processReportData(transactions, reportType) {
        const reportData = {
            totalIncome: 0,
            totalExpense: 0,
            netBalance: 0,
            transactionCount: transactions.length,
            byCategory: {},
            byDay: {},
            summary: {}
        };
        
        // Hitung total
        transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                reportData.totalIncome += transaction.amount;
            } else if (transaction.type === 'expense') {
                reportData.totalExpense += transaction.amount;
            }
        });
        
        reportData.netBalance = reportData.totalIncome - reportData.totalExpense;
        
        // Kelompokkan berdasarkan kategori
        transactions.forEach(transaction => {
            if (transaction.category) {
                const category = StorageManager.getCategories().find(c => c.id === transaction.category);
                const categoryName = category ? category.name : 'Tidak ada kategori';
                
                if (!reportData.byCategory[categoryName]) {
                    reportData.byCategory[categoryName] = {
                        income: 0,
                        expense: 0,
                        count: 0
                    };
                }
                
                if (transaction.type === 'income') {
                    reportData.byCategory[categoryName].income += transaction.amount;
                } else if (transaction.type === 'expense') {
                    reportData.byCategory[categoryName].expense += transaction.amount;
                }
                
                reportData.byCategory[categoryName].count++;
            }
        });
        
        // Kelompokkan berdasarkan hari (untuk laporan harian/mingguan)
        if (reportType === 'daily' || reportType === 'weekly') {
            transactions.forEach(transaction => {
                const date = new Date(transaction.date);
                const dayKey = date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
                
                if (!reportData.byDay[dayKey]) {
                    reportData.byDay[dayKey] = {
                        income: 0,
                        expense: 0,
                        count: 0
                    };
                }
                
                if (transaction.type === 'income') {
                    reportData.byDay[dayKey].income += transaction.amount;
                } else if (transaction.type === 'expense') {
                    reportData.byDay[dayKey].expense += transaction.amount;
                }
                
                reportData.byDay[dayKey].count++;
            });
        }
        
        // Summary
        reportData.summary = {
            incomePercentage: reportData.totalIncome > 0 ? 
                ((reportData.totalIncome - reportData.totalExpense) / reportData.totalIncome * 100).toFixed(1) : 0,
            averageTransaction: reportData.transactionCount > 0 ?
                ((reportData.totalIncome + reportData.totalExpense) / reportData.transactionCount).toFixed(0) : 0,
            largestTransaction: transactions.length > 0 ?
                Math.max(...transactions.map(t => t.amount)) : 0
        };
        
        return reportData;
    }

    /**
     * Render laporan ke UI
     */
    static renderReport(reportData, transactions) {
        const summaryContainer = document.getElementById('reportSummary');
        const tableContainer = document.getElementById('reportTable');
        
        if (!summaryContainer || !tableContainer) return;
        
        // Render summary
        summaryContainer.innerHTML = `
            <div class="report-summary-cards">
                <div class="summary-card">
                    <div class="card-header">
                        <h3>Total Pemasukan</h3>
                        <i class="fas fa-arrow-up" style="color: var(--success-color)"></i>
                    </div>
                    <div class="card-body">
                        <p class="balance-amount">${StorageManager.formatCurrency(reportData.totalIncome)}</p>
                        <div class="trend-indicator positive">
                            <span>${reportData.transactionCount} transaksi</span>
                        </div>
                    </div>
                </div>
                
                <div class="summary-card">
                    <div class="card-header">
                        <h3>Total Pengeluaran</h3>
                        <i class="fas fa-arrow-down" style="color: var(--danger-color)"></i>
                    </div>
                    <div class="card-body">
                        <p class="balance-amount">${StorageManager.formatCurrency(reportData.totalExpense)}</p>
                        <div class="trend-indicator negative">
                            <span>${reportData.transactionCount} transaksi</span>
                        </div>
                    </div>
                </div>
                
                <div class="summary-card">
                    <div class="card-header">
                        <h3>Saldo Bersih</h3>
                        <i class="fas fa-coins" style="color: var(--primary-color)"></i>
                    </div>
                    <div class="card-body">
                        <p class="balance-amount ${reportData.netBalance >= 0 ? 'positive' : 'negative'}">
                            ${StorageManager.formatCurrency(reportData.netBalance)}
                        </p>
                        <div class="trend-indicator ${reportData.netBalance >= 0 ? 'positive' : 'negative'}">
                            <span>${reportData.summary.incomePercentage}% dari pemasukan</span>
                        </div>
                    </div>
                </div>
                
                <div class="summary-card">
                    <div class="card-header">
                        <h3>Rata-rata Transaksi</h3>
                        <i class="fas fa-chart-bar" style="color: var(--info-color)"></i>
                    </div>
                    <div class="card-body">
                        <p class="balance-amount">${StorageManager.formatCurrency(reportData.summary.averageTransaction)}</p>
                        <div class="trend-indicator">
                            <span>Transaksi terbesar: ${StorageManager.formatCurrency(reportData.summary.largestTransaction)}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            ${Object.keys(reportData.byCategory).length > 0 ? `
                <div class="category-breakdown">
                    <h4><i class="fas fa-tags"></i> Breakdown per Kategori</h4>
                    <div class="category-list">
                        ${Object.entries(reportData.byCategory).map(([category, data]) => `
                            <div class="category-item">
                                <span class="category-name">${category}</span>
                                <div class="category-stats">
                                    <span class="income">${StorageManager.formatCurrency(data.income)}</span>
                                    <span class="expense">${StorageManager.formatCurrency(data.expense)}</span>
                                    <span class="count">${data.count}x</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;
        
        // Render table
        if (transactions.length === 0) {
            tableContainer.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-receipt"></i>
                        <p>Tidak ada transaksi ditemukan</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tableContainer.innerHTML = transactions.map(transaction => {
            const category = StorageManager.getCategories().find(c => c.id === transaction.category);
            const wallet = StorageManager.getWallets().find(w => w.id === transaction.wallet);
            
            return `
                <tr>
                    <td>${StorageManager.formatShortDate(transaction.date)}</td>
                    <td>${transaction.description}</td>
                    <td>${category ? category.name : 'Tidak ada'}</td>
                    <td><span class="badge ${transaction.type}">${transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</span></td>
                    <td>${wallet ? wallet.name : 'Tidak ada'}</td>
                    <td class="${transaction.type}">${StorageManager.formatCurrency(transaction.amount)}</td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Export laporan ke PDF
     */
    static exportPDF() {
        console.log('📤 Exporting to PDF...');
        
        // Check if there's report data
        const reportTable = document.getElementById('reportTable');
        if (!reportTable || reportTable.querySelector('.empty-state')) {
            this.showError('Tidak ada data laporan untuk diexport');
            return;
        }
        
        // Prepare report data for PDF
        const reportType = document.getElementById('reportType').value;
        const dateValue = document.getElementById('reportDate').value;
        const reportTitle = this.getReportTitle(reportType, dateValue);
        
        // Get all transactions from current report
        const rows = reportTable.querySelectorAll('tr:not(.empty-state)');
        if (rows.length === 0) {
            this.showError('Tidak ada data transaksi untuk diexport');
            return;
        }
        
        // Collect transaction data
        const transactions = [];
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 6) {
                transactions.push({
                    date: cells[0].textContent,
                    description: cells[1].textContent,
                    category: cells[2].textContent,
                    type: cells[3].querySelector('.badge').className.includes('income') ? 'Pemasukan' : 'Pengeluaran',
                    wallet: cells[4].textContent,
                    amount: cells[5].textContent
                });
            }
        });
        
        // Get summary data
        const summaryCards = document.querySelectorAll('.report-summary-cards .summary-card');
        const summary = {
            totalIncome: summaryCards[0]?.querySelector('.balance-amount')?.textContent || 'Rp 0',
            totalExpense: summaryCards[1]?.querySelector('.balance-amount')?.textContent || 'Rp 0',
            netBalance: summaryCards[2]?.querySelector('.balance-amount')?.textContent || 'Rp 0'
        };
        
        // Create PDF content
        const pdfContent = this.generatePDFContent(reportTitle, summary, transactions);
        
        // Create and download PDF
        this.downloadPDF(pdfContent, reportTitle);
        
        this.showSuccess('PDF berhasil diexport');
    }

    /**
     * Generate PDF content
     */
    static generatePDFContent(title, summary, transactions) {
        const now = new Date();
        const exportDate = now.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${title}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        color: #333;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 2px solid #4f46e5;
                        padding-bottom: 20px;
                    }
                    .header h1 {
                        color: #4f46e5;
                        margin-bottom: 5px;
                    }
                    .header .subtitle {
                        color: #666;
                        font-size: 14px;
                    }
                    .summary {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 15px;
                        margin-bottom: 30px;
                    }
                    .summary-card {
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        padding: 15px;
                        text-align: center;
                    }
                    .summary-card h3 {
                        font-size: 14px;
                        color: #64748b;
                        margin-bottom: 10px;
                        text-transform: uppercase;
                    }
                    .summary-card .amount {
                        font-size: 18px;
                        font-weight: bold;
                        margin: 0;
                    }
                    .income { color: #10b981; }
                    .expense { color: #ef4444; }
                    .balance { color: #4f46e5; }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    th {
                        background: #f1f5f9;
                        color: #475569;
                        font-weight: 600;
                        text-transform: uppercase;
                        font-size: 12px;
                        padding: 12px 8px;
                        text-align: left;
                        border-bottom: 2px solid #e2e8f0;
                    }
                    td {
                        padding: 10px 8px;
                        border-bottom: 1px solid #e2e8f0;
                        font-size: 13px;
                    }
                    tr:hover {
                        background: #f8fafc;
                    }
                    .footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 1px solid #e2e8f0;
                        font-size: 12px;
                        color: #64748b;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${title}</h1>
                    <div class="subtitle">
                        Laporan keuangan pribadi - Diexport pada ${exportDate}
                    </div>
                </div>
                
                <div class="summary">
                    <div class="summary-card">
                        <h3>Total Pemasukan</h3>
                        <p class="amount income">${summary.totalIncome}</p>
                    </div>
                    <div class="summary-card">
                        <h3>Total Pengeluaran</h3>
                        <p class="amount expense">${summary.totalExpense}</p>
                    </div>
                    <div class="summary-card">
                        <h3>Saldo Bersih</h3>
                        <p class="amount balance">${summary.netBalance}</p>
                    </div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Tanggal</th>
                            <th>Deskripsi</th>
                            <th>Kategori</th>
                            <th>Tipe</th>
                            <th>Dompet</th>
                            <th>Jumlah</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${transactions.map(transaction => `
                            <tr>
                                <td>${transaction.date}</td>
                                <td>${transaction.description}</td>
                                <td>${transaction.category}</td>
                                <td>${transaction.type}</td>
                                <td>${transaction.wallet}</td>
                                <td class="${transaction.type === 'Pemasukan' ? 'income' : 'expense'}">
                                    ${transaction.amount}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="footer">
                    <p>FinTrack - Manajemen Keuangan Pribadi</p>
                    <p>Untuk penggunaan pribadi</p>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Download PDF
     */
    static downloadPDF(content, filename) {
        // Create blob
        const blob = new Blob([content], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
    }

    /**
     * Export laporan ke Excel
     */
    static exportExcel() {
        console.log('📤 Exporting to Excel...');
        
        // Check if there's report data
        const reportTable = document.getElementById('reportTable');
        if (!reportTable || reportTable.querySelector('.empty-state')) {
            this.showError('Tidak ada data laporan untuk diexport');
            return;
        }
        
        const reportType = document.getElementById('reportType').value;
        const dateValue = document.getElementById('reportDate').value;
        const reportTitle = this.getReportTitle(reportType, dateValue);
        
        // Get all transactions from current report
        const rows = reportTable.querySelectorAll('tr:not(.empty-state)');
        if (rows.length === 0) {
            this.showError('Tidak ada data transaksi untuk diexport');
            return;
        }
        
        // Prepare Excel data
        const excelData = [];
        
        // Add header
        excelData.push(['LAPORAN KEUANGAN', reportTitle]);
        excelData.push(['Diexport pada', new Date().toLocaleDateString('id-ID')]);
        excelData.push([]); // Empty row
        
        // Add summary headers
        const summaryCards = document.querySelectorAll('.report-summary-cards .summary-card');
        if (summaryCards.length >= 3) {
            excelData.push(['RINGKASAN']);
            excelData.push([
                'Total Pemasukan',
                'Total Pengeluaran',
                'Saldo Bersih'
            ]);
            excelData.push([
                summaryCards[0]?.querySelector('.balance-amount')?.textContent || 'Rp 0',
                summaryCards[1]?.querySelector('.balance-amount')?.textContent || 'Rp 0',
                summaryCards[2]?.querySelector('.balance-amount')?.textContent || 'Rp 0'
            ]);
            excelData.push([]); // Empty row
        }
        
        // Add transaction headers
        excelData.push(['DETAIL TRANSAKSI']);
        excelData.push([
            'Tanggal',
            'Deskripsi',
            'Kategori',
            'Tipe',
            'Dompet',
            'Jumlah'
        ]);
        
        // Add transaction data
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 6) {
                excelData.push([
                    cells[0].textContent,
                    cells[1].textContent,
                    cells[2].textContent,
                    cells[3].querySelector('.badge').className.includes('income') ? 'Pemasukan' : 'Pengeluaran',
                    cells[4].textContent,
                    cells[5].textContent
                ]);
            }
        });
        
        // Convert to CSV
        const csvContent = excelData.map(row => 
            row.map(cell => `"${cell}"`).join(',')
        ).join('\n');
        
        // Create and download CSV file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportTitle.replace(/\s+/g, '_')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showSuccess('Excel berhasil diexport');
    }

    /**
     * Get report title
     */
    static getReportTitle(reportType, dateValue) {
        const date = new Date(dateValue);
        
        switch (reportType) {
            case 'daily':
                return `Laporan Harian - ${date.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                })}`;
                
            case 'weekly':
                // Calculate week range
                const monday = new Date(date);
                const day = monday.getDay();
                const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
                monday.setDate(diff);
                
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                
                return `Laporan Mingguan - ${monday.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short'
                })} - ${sunday.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                })}`;
                
            case 'monthly':
                return `Laporan Bulanan - ${date.toLocaleDateString('id-ID', {
                    month: 'long',
                    year: 'numeric'
                })}`;
                
            default:
                return 'Laporan Keuangan';
        }
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

// Auto-initialize report manager
document.addEventListener('DOMContentLoaded', () => {
    ReportManager.init();
});