/**
 * FILE: ai-insights.js
 * DESKRIPSI: Fungsi AI Insights untuk analisis keuangan
 */

/**
 * Update AI insights dengan analisis keuangan
 */
function updateAIInsights() {
    const container = document.getElementById('aiInsights');
    
    try {
        // Hitung beberapa statistik untuk insights
        const monthlyIncome = app.calculateMonthlyIncome();
        const monthlyExpense = app.calculateMonthlyExpense();
        const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100 : 0;
        
        // Hitung pengeluaran per kategori
        const categoryExpenses = app.calculateCategoryExpenses();
        
        // Cari kategori dengan pengeluaran tertinggi
        let highestCategory = { name: 'Tidak ada', amount: 0 };
        Object.values(categoryExpenses).forEach(cat => {
            if (cat.total > highestCategory.amount) {
                highestCategory = { name: cat.name, amount: cat.total };
            }
        });
        
        // Bandingkan dengan bulan lalu
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        const lastMonthExpense = transactions
            .filter(trans => {
                const transDate = new Date(trans.date);
                return trans.type === 'expense' && 
                       transDate.getMonth() === lastMonth.getMonth() && 
                       transDate.getFullYear() === lastMonth.getFullYear();
            })
            .reduce((sum, trans) => sum + trans.amount, 0);
        
        const expenseChange = lastMonthExpense > 0 ? 
            ((monthlyExpense - lastMonthExpense) / lastMonthExpense) * 100 : 0;
        
        // Hitung pemasukan bulan lalu
        const lastMonthIncome = transactions
            .filter(trans => {
                const transDate = new Date(trans.date);
                return trans.type === 'income' && 
                       transDate.getMonth() === lastMonth.getMonth() && 
                       transDate.getFullYear() === lastMonth.getFullYear();
            })
            .reduce((sum, trans) => sum + trans.amount, 0);
        
        const incomeChange = lastMonthIncome > 0 ? 
            ((monthlyIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0;
        
        // Generate insights
        const insights = [];
        
        // Insight 1: Rasio tabungan
        if (savingsRate > 30) {
            insights.push({
                title: '💪 Tabungan Sangat Sehat',
                message: `Rasio tabungan Anda ${savingsRate.toFixed(1)}% luar biasa! Anda menyimpan lebih dari 30% dari pemasukan.`
            });
        } else if (savingsRate > 20) {
            insights.push({
                title: '✅ Tabungan Sehat',
                message: `Rasio tabungan Anda ${savingsRate.toFixed(1)}% sangat baik! Pertahankan kebiasaan finansial yang sehat ini.`
            });
        } else if (savingsRate > 0) {
            insights.push({
                title: '📉 Perbaiki Tabungan',
                message: `Rasio tabungan Anda ${savingsRate.toFixed(1)}% masih rendah. Coba kurangi pengeluaran tidak penting.`
            });
        } else if (savingsRate === 0) {
            insights.push({
                title: '⚖️ Break Even',
                message: 'Pemasukan dan pengeluaran Anda seimbang bulan ini. Coba sisihkan sedikit untuk tabungan.'
            });
        } else {
            insights.push({
                title: '⚠️ Perhatian: Defisit',
                message: 'Pengeluaran lebih besar dari pemasukan bulan ini. Evaluasi pengeluaran dan cari cara untuk mengurangi biaya.'
            });
        }
        
        // Insight 2: Kategori pengeluaran tertinggi
        if (highestCategory.amount > 0 && monthlyExpense > 0) {
            const percentage = (highestCategory.amount / monthlyExpense) * 100;
            if (percentage > 40) {
                insights.push({
                    title: `🎯 Fokus pada ${highestCategory.name}`,
                    message: `${highestCategory.name} adalah ${percentage.toFixed(1)}% dari total pengeluaran. Pertimbangkan untuk mengurangi pengeluaran ini.`
                });
            }
        }
        
        // Insight 3: Perbandingan bulan lalu
        if (Math.abs(expenseChange) > 15) {
            insights.push({
                title: expenseChange > 0 ? '📈 Pengeluaran Meningkat' : '📉 Pengeluaran Menurun',
                message: `Pengeluaran Anda ${expenseChange > 0 ? 'naik' : 'turun'} ${Math.abs(expenseChange).toFixed(1)}% dari bulan lalu.`
            });
        }
        
        if (Math.abs(incomeChange) > 15) {
            insights.push({
                title: incomeChange > 0 ? '💰 Pemasukan Meningkat' : '💸 Pemasukan Menurun',
                message: `Pemasukan Anda ${incomeChange > 0 ? 'naik' : 'turun'} ${Math.abs(incomeChange).toFixed(1)}% dari bulan lalu.`
            });
        }
        
        // Insight 4: Budget monitoring
        const budgets = JSON.parse(localStorage.getItem('budgets')) || [];
        if (budgets.length > 0) {
            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();
            
            let nearLimitCount = 0;
            let overLimitCount = 0;
            
            budgets.forEach(budget => {
                if (budget.month === currentMonth && budget.year === currentYear) {
                    // Hitung pengeluaran untuk budget ini
                    const categorySpent = transactions
                        .filter(trans => 
                            trans.type === 'expense' && 
                            trans.categoryId === budget.categoryId &&
                            new Date(trans.date).getMonth() + 1 === currentMonth &&
                            new Date(trans.date).getFullYear() === currentYear
                        )
                        .reduce((sum, trans) => sum + trans.amount, 0);
                    
                    const percentage = (categorySpent / budget.amount) * 100;
                    
                    if (percentage > 90 && percentage <= 100) {
                        nearLimitCount++;
                    } else if (percentage > 100) {
                        overLimitCount++;
                    }
                }
            });
            
            if (overLimitCount > 0) {
                insights.push({
                    title: '🚨 Budget Melebihi Limit',
                    message: `${overLimitCount} kategori budget telah melebihi limit. Segera evaluasi pengeluaran Anda.`
                });
            } else if (nearLimitCount > 0) {
                insights.push({
                    title: '⚠️ Budget Hampir Habis',
                    message: `${nearLimitCount} kategori budget hampir mencapai limit. Hati-hati dengan pengeluaran berikutnya.`
                });
            } else if (budgets.length > 0) {
                insights.push({
                    title: '✅ Budget Terkendali',
                    message: 'Semua budget Anda masih dalam kendali. Pertahankan pengelolaan anggaran yang baik.'
                });
            }
        }
        
        // Insight 5: Cashflow
        const netCashflow = monthlyIncome - monthlyExpense;
        if (netCashflow > 0) {
            insights.push({
                title: '💎 Cashflow Positif',
                message: `Cashflow Anda positif sebesar ${app.formatCurrency(netCashflow)}. Pertimbangkan untuk menginvestasikan kelebihan ini.`
            });
        }
        
        // Jika tidak cukup insights, tambahkan yang umum
        if (insights.length < 3) {
            insights.push({
                title: '📊 Analisis Keuangan',
                message: 'AI sedang menganalisis pola keuangan Anda. Tambahkan lebih banyak transaksi untuk insight yang lebih akurat.'
            });
        }
        
        // Generate HTML untuk insights (maksimal 4 insights)
        const maxInsights = Math.min(insights.length, 4);
        let html = '';
        
        for (let i = 0; i < maxInsights; i++) {
            html += `
                <div class="insight-item">
                    <h4>${insights[i].title}</h4>
                    <p>${insights[i].message}</p>
                </div>
            `;
        }
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error generating AI insights:', error);
        container.innerHTML = `
            <div class="insight-item">
                <h4>⚠️ Error Analisis</h4>
                <p>Terjadi kesalahan dalam menganalisis data keuangan Anda. Coba refresh halaman.</p>
            </div>
        `;
    }
}

// Ekspos fungsi ke global scope
window.updateAIInsights = updateAIInsights;