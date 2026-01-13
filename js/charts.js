/**
 * Chart Manager untuk FinTrack
 * Mengelola semua chart dan visualisasi data
 */

class ChartManager {
    static charts = {};
    static colors = {
        primary: '#4f46e5',
        secondary: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        info: '#06b6d4',
        purple: '#8b5cf6',
        pink: '#ec4899',
        orange: '#f97316',
        teal: '#14b8a6',
        lime: '#84cc16',
        rose: '#f43f5e',
        indigo: '#6366f1'
    };

    /**
     * Inisialisasi semua chart
     */
    static init() {
        console.log('📈 Initializing charts...');
        
        this.initCashflowChart();
        this.initCategoryChart();
        
        console.log('✅ Charts initialized');
    }

    /**
     * Inisialisasi chart cashflow
     */
    static initCashflowChart() {
        const ctx = document.getElementById('cashflowChart');
        if (!ctx) return;
        
        this.charts.cashflow = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Pemasukan',
                        data: [],
                        backgroundColor: this.colors.secondary,
                        borderRadius: 6,
                        borderSkipped: false
                    },
                    {
                        label: 'Pengeluaran',
                        data: [],
                        backgroundColor: this.colors.danger,
                        borderRadius: 6,
                        borderSkipped: false
                    }
                ]
            },
            options: this.getChartOptions('Cashflow Bulanan')
        });
    }

    /**
     * Inisialisasi chart kategori
     */
    static initCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;
        
        this.charts.category = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [],
                    borderColor: 'transparent',
                    borderWidth: 1,
                    hoverOffset: 15
                }]
            },
            options: this.getDoughnutOptions()
        });
    }

    /**
     * Update semua chart dengan data terbaru
     */
    static updateAll() {
        console.log('🔄 Updating charts...');
        
        this.updateCashflowChart();
        this.updateCategoryChart();
        
        console.log('✅ Charts updated');
    }

    /**
     * Update chart cashflow
     */
    static updateCashflowChart() {
        if (!this.charts.cashflow) return;
        
        const period = parseInt(document.getElementById('cashflowPeriod')?.value || 6);
        const transactions = StorageManager.getTransactions();
        const now = new Date();
        
        // Siapkan data untuk periode yang diminta
        const labels = [];
        const incomeData = [];
        const expenseData = [];
        
        for (let i = period - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthLabel = date.toLocaleDateString('id-ID', { 
                month: 'short',
                year: '2-digit'
            });
            labels.push(monthLabel);
            
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            
            // Filter transaksi untuk bulan ini
            const monthTransactions = transactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate >= monthStart && 
                       transactionDate <= monthEnd &&
                       t.type !== 'transfer';
            });
            
            const income = monthTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
            
            const expense = monthTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
            
            incomeData.push(income);
            expenseData.push(expense);
        }
        
        // Update chart
        this.charts.cashflow.data.labels = labels;
        this.charts.cashflow.data.datasets[0].data = incomeData;
        this.charts.cashflow.data.datasets[1].data = expenseData;
        
        // Update Y-axis scale
        const maxValue = Math.max(...incomeData, ...expenseData);
        if (maxValue > 0) {
            const stepSize = this.getStepSize(maxValue);
            this.charts.cashflow.options.scales.y.ticks.stepSize = stepSize;
            this.charts.cashflow.options.scales.y.suggestedMax = Math.ceil(maxValue / stepSize) * stepSize;
        }
        
        this.charts.cashflow.update();
    }

    /**
     * Update chart kategori
     */
    static updateCategoryChart() {
        if (!this.charts.category) return;
        
        const period = document.getElementById('categoryPeriod')?.value || 'month';
        const transactions = StorageManager.getTransactions();
        const categories = StorageManager.getCategories();
        const now = new Date();
        
        // Tentukan range tanggal berdasarkan periode
        let startDate, endDate;
        
        if (period === 'year') {
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31);
        } else {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }
        
        // Filter transaksi pengeluaran dalam periode
        const periodTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= startDate && 
                   transactionDate <= endDate &&
                   t.type === 'expense';
        });
        
        // Kelompokkan pengeluaran per kategori
        const categoryMap = new Map();
        periodTransactions.forEach(t => {
            const current = categoryMap.get(t.category) || 0;
            categoryMap.set(t.category, current + (t.amount || 0));
        });
        
        // Siapkan data untuk chart
        const labels = [];
        const data = [];
        const backgroundColors = [];
        
        // Urutkan berdasarkan jumlah (terbesar ke terkecil)
        const sortedEntries = Array.from(categoryMap.entries())
            .sort((a, b) => b[1] - a[1]);
        
        // Ambil top 8 kategori atau semua jika kurang dari 8
        const topEntries = sortedEntries.slice(0, 8);
        
        topEntries.forEach(([categoryId, amount], index) => {
            const category = categories.find(c => c.id === categoryId);
            if (category && amount > 0) {
                labels.push(category.name);
                data.push(amount);
                backgroundColors.push(category.color || this.getColorByIndex(index));
            }
        });
        
        // Tambahkan "Lainnya" jika ada kategori lain
        if (sortedEntries.length > 8) {
            const otherAmount = sortedEntries.slice(8)
                .reduce((sum, [, amount]) => sum + amount, 0);
            
            if (otherAmount > 0) {
                labels.push('Lainnya');
                data.push(otherAmount);
                backgroundColors.push('#64748b');
            }
        }
        
        // Update chart
        this.charts.category.data.labels = labels;
        this.charts.category.data.datasets[0].data = data;
        this.charts.category.data.datasets[0].backgroundColor = backgroundColors;
        
        this.charts.category.update();
    }

    /**
     * Generate chart untuk laporan
     * @param {string} containerId - ID container chart
     * @param {Array} data - Data untuk chart
     * @param {string} type - Tipe chart (bar, line, pie)
     * @param {Object} options - Opsi tambahan
     */
    static generateReportChart(containerId, data, type = 'bar', options = {}) {
        const canvas = document.getElementById(containerId);
        if (!canvas) return null;
        
        // Hapus chart lama jika ada
        if (this.charts[containerId]) {
            this.charts[containerId].destroy();
        }
        
        const ctx = canvas.getContext('2d');
        const chartOptions = type === 'doughnut' || type === 'pie' 
            ? this.getDoughnutOptions()
            : this.getChartOptions(options.title || 'Laporan');
        
        this.charts[containerId] = new Chart(ctx, {
            type: type,
            data: data,
            options: chartOptions
        });
        
        return this.charts[containerId];
    }

    /**
     * Export chart sebagai gambar
     * @param {string} chartId - ID chart
     * @param {string} format - Format gambar (png, jpeg, webp)
     */
    static exportChart(chartId, format = 'png') {
        if (!this.charts[chartId]) {
            console.error('❌ Chart not found:', chartId);
            return;
        }
        
        try {
            const link = document.createElement('a');
            link.download = `chart_${chartId}_${new Date().toISOString().split('T')[0]}.${format}`;
            link.href = this.charts[chartId].toBase64Image();
            link.click();
            console.log('📤 Chart exported:', chartId);
        } catch (error) {
            console.error('❌ Error exporting chart:', error);
        }
    }

    /**
     * Reset semua chart
     */
    static reset() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
        this.init();
    }

    /**
     * Get chart options untuk bar/line charts
     */
    static getChartOptions(title = '') {
        const textColor = getComputedStyle(document.body).getPropertyValue('--text-color');
        const textSecondary = getComputedStyle(document.body).getPropertyValue('--text-secondary');
        const borderColor = getComputedStyle(document.body).getPropertyValue('--border-color');
        const bgColor = getComputedStyle(document.body).getPropertyValue('--card-bg');
        
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: textColor,
                        padding: 15,
                        font: {
                            size: 12
                        },
                        usePointStyle: true
                    }
                },
                title: {
                    display: !!title,
                    text: title,
                    color: textColor,
                    font: {
                        size: 14,
                        weight: '600'
                    },
                    padding: {
                        bottom: 20
                    }
                },
                tooltip: {
                    backgroundColor: bgColor,
                    titleColor: textColor,
                    bodyColor: textColor,
                    borderColor: borderColor,
                    borderWidth: 1,
                    padding: 10,
                    boxPadding: 5,
                    usePointStyle: true,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += StorageManager.formatCurrency(context.raw);
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: borderColor,
                        drawBorder: false
                    },
                    ticks: {
                        color: textSecondary,
                        font: {
                            size: 11
                        },
                        maxRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: borderColor,
                        drawBorder: false
                    },
                    ticks: {
                        color: textSecondary,
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            if (value >= 1000000) {
                                return 'Rp' + (value / 1000000).toFixed(1) + 'Jt';
                            }
                            if (value >= 1000) {
                                return 'Rp' + (value / 1000).toFixed(0) + 'K';
                            }
                            return 'Rp' + value;
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        };
    }

    /**
     * Get chart options untuk doughnut/pie charts
     */
    static getDoughnutOptions() {
        const textColor = getComputedStyle(document.body).getPropertyValue('--text-color');
        const bgColor = getComputedStyle(document.body).getPropertyValue('--card-bg');
        
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: textColor,
                        padding: 15,
                        font: {
                            size: 11
                        },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: bgColor,
                    titleColor: textColor,
                    bodyColor: textColor,
                    borderColor: getComputedStyle(document.body).getPropertyValue('--border-color'),
                    borderWidth: 1,
                    padding: 10,
                    boxPadding: 5,
                    usePointStyle: true,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${StorageManager.formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%',
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 1000
            }
        };
    }

    /**
     * Helper: Calculate step size untuk Y-axis
     */
    static getStepSize(maxValue) {
        if (maxValue === 0) return 10000;
        
        const magnitude = Math.floor(Math.log10(maxValue));
        const scale = Math.pow(10, magnitude);
        const normalized = maxValue / scale;
        
        if (normalized <= 2) return scale / 5;
        if (normalized <= 5) return scale / 2;
        if (normalized <= 10) return scale;
        return scale * 2;
    }

    /**
     * Helper: Get color by index
     */
    static getColorByIndex(index) {
        const colors = Object.values(this.colors);
        return colors[index % colors.length];
    }

    /**
     * Helper: Generate gradient
     */
    static generateGradient(ctx, color1, color2) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        return gradient;
    }

    /**
     * Helper: Hex to RGBA
     */
    static hexToRgba(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Helper: Darken color
     */
    static darkenColor(hex, percent) {
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);

        r = Math.floor(r * (100 - percent) / 100);
        g = Math.floor(g * (100 - percent) / 100);
        b = Math.floor(b * (100 - percent) / 100);

        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
}

// Auto-initialize charts
document.addEventListener('DOMContentLoaded', () => {
    ChartManager.init();
});