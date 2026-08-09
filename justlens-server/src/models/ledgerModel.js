const { query, run, get } = require('../config/database');

const LedgerModel = {
  // 1. Account Management
  getAllAccounts: async () => {
    return await query('SELECT * FROM ledger_accounts ORDER BY code ASC');
  },

  getAccountById: async (id) => {
    return await get('SELECT * FROM ledger_accounts WHERE id = ?', [id]);
  },

  createAccount: async (data) => {
    const { code, name, type, description } = data;
    const result = await run(
      'INSERT INTO ledger_accounts (code, name, type, description) VALUES (?, ?, ?, ?)',
      [code, name, type, description || '']
    );
    return await get('SELECT * FROM ledger_accounts WHERE id = ?', [result.id]);
  },

  // 2. Journal Entry Management (Kas Masuk & Kas Keluar)
  getEntries: async (filters = {}) => {
    let sql = `
      SELECT j.*, a.name as account_name, a.code as account_code, a.type as account_type
      FROM journal_entries j
      JOIN ledger_accounts a ON j.account_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.account_id) {
      sql += ' AND j.account_id = ?';
      params.push(filters.account_id);
    }
    if (filters.type) {
      sql += ' AND j.type = ?';
      params.push(filters.type);
    }
    if (filters.payment_method) {
      sql += ' AND j.payment_method = ?';
      params.push(filters.payment_method);
    }
    if (filters.start_date) {
      sql += ' AND date(j.entry_date) >= date(?)';
      params.push(filters.start_date);
    }
    if (filters.end_date) {
      sql += ' AND date(j.entry_date) <= date(?)';
      params.push(filters.end_date);
    }

    sql += ' ORDER BY j.entry_date DESC, j.id DESC';
    return await query(sql, params);
  },

  createEntry: async (data) => {
    const {
      account_id,
      type,
      amount,
      payment_method,
      category,
      description,
      reference_no,
      created_by,
      entry_date
    } = data;

    // Generate unique entry_no e.g. JRN-20260809-123
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(100 + Math.random() * 900);
    const entry_no = `JRN-${dateStr}-${randomNum}`;

    const result = await run(
      `INSERT INTO journal_entries 
        (entry_no, account_id, type, amount, payment_method, category, description, reference_no, created_by, entry_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry_no,
        account_id,
        type,
        amount || 0,
        payment_method || 'Tunai',
        category || 'Operasional',
        description || '',
        reference_no || '',
        created_by || 'Admin',
        entry_date || new Date().toISOString().slice(0, 10)
      ]
    );

    return await get(`
      SELECT j.*, a.name as account_name, a.code as account_code, a.type as account_type
      FROM journal_entries j
      JOIN ledger_accounts a ON j.account_id = a.id
      WHERE j.id = ?
    `, [result.id]);
  },

  deleteEntry: async (id) => {
    const result = await run('DELETE FROM journal_entries WHERE id = ?', [id]);
    return result.changes > 0;
  },

  // 3. Profit Loss Calculation (Laba Rugi Otomatis)
  getProfitLossReport: async (startDate = null, endDate = null) => {
    let dateFilterTx = '';
    let dateFilterJrn = '';
    const paramsTx = [];
    const paramsJrn = [];

    if (startDate && endDate) {
      dateFilterTx = ' AND date(created_at) >= date(?) AND date(created_at) <= date(?)';
      paramsTx.push(startDate, endDate);

      dateFilterJrn = ' AND date(entry_date) >= date(?) AND date(entry_date) <= date(?)';
      paramsJrn.push(startDate, endDate);
    }

    // Total Penjualan Kasir (Lunas / Paid)
    const salesRow = await get(`
      SELECT COALESCE(SUM(total_amount), 0) as total_sales, COUNT(*) as tx_count
      FROM transactions
      WHERE payment_status = 'Lunas' ${dateFilterTx}
    `, paramsTx);

    // Total HPP / Modal Barang & Outsource yang terjual
    const hppRow = await get(`
      SELECT COALESCE(SUM(
        (ti.vendor_cost + p.base_price) * 
        CASE WHEN ti.unit = p.purchase_unit AND p.conversion_ratio > 0 THEN (ti.qty * p.conversion_ratio) ELSE ti.qty END
      ), 0) as total_hpp
      FROM transaction_items ti
      JOIN transactions t ON ti.transaction_id = t.id
      LEFT JOIN products p ON ti.product_id = p.id
      WHERE t.payment_status = 'Lunas' ${dateFilterTx}
    `, paramsTx);

    // Kas Masuk Tambahan dari Jurnal
    const otherIncomeRow = await get(`
      SELECT COALESCE(SUM(amount), 0) as total_income
      FROM journal_entries
      WHERE type = 'Kas Masuk' ${dateFilterJrn}
    `, paramsJrn);

    // Total Beban Operasional Kas Keluar dari Jurnal
    const expensesBreakdown = await query(`
      SELECT a.name as category_name, COALESCE(SUM(j.amount), 0) as total_amount
      FROM journal_entries j
      JOIN ledger_accounts a ON j.account_id = a.id
      WHERE j.type = 'Kas Keluar' ${dateFilterJrn}
      GROUP BY a.id, a.name
    `, paramsJrn);

    const totalSales = salesRow ? salesRow.total_sales : 0;
    const totalHpp = hppRow ? hppRow.total_hpp : 0;
    const otherIncome = otherIncomeRow ? otherIncomeRow.total_income : 0;
    const grossProfit = (totalSales + otherIncome) - totalHpp;

    const totalOperationalExpenses = expensesBreakdown.reduce((sum, item) => sum + item.total_amount, 0);
    const netProfit = grossProfit - totalOperationalExpenses;

    return {
      period: { startDate: startDate || 'Semua', endDate: endDate || 'Semua' },
      revenue: {
        total_sales: totalSales,
        transaction_count: salesRow ? salesRow.tx_count : 0,
        other_income: otherIncome,
        total_revenue: totalSales + otherIncome
      },
      cogs: {
        total_hpp: totalHpp
      },
      gross_profit: grossProfit,
      expenses: {
        breakdown: expensesBreakdown,
        total_expenses: totalOperationalExpenses
      },
      net_profit: netProfit
    };
  }
};

module.exports = LedgerModel;
