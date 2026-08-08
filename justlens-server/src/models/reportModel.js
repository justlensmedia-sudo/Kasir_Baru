const { query, get } = require('../config/database');

const ReportModel = {
  getSalesReport: async (startDate = null, endDate = null) => {
    let dateFilter = '';
    const params = [];

    if (startDate && endDate) {
      dateFilter = ' WHERE created_at BETWEEN ? AND ?';
      params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
    }

    const summary = await get(
      `SELECT 
        COUNT(*) as total_transactions, 
        COALESCE(SUM(total_amount), 0) as total_sales, 
        COALESCE(SUM(dp_amount), 0) as total_dp_collected,
        SUM(CASE WHEN payment_status = 'Lunas' THEN 1 ELSE 0 END) as total_lunas,
        SUM(CASE WHEN payment_status = 'DP' THEN 1 ELSE 0 END) as total_dp
       FROM transactions${dateFilter}`,
      params
    );

    const statusBreakdown = await query(
      `SELECT order_status, COUNT(*) as count, SUM(total_amount) as amount 
       FROM transactions${dateFilter} 
       GROUP BY order_status`,
      params
    );

    const recentTransactions = await query(
      `SELECT * FROM transactions${dateFilter} ORDER BY id DESC LIMIT 10`,
      params
    );

    return {
      period: { startDate: startDate || 'Semua Waktu', endDate: endDate || 'Semua Waktu' },
      summary,
      status_breakdown: statusBreakdown,
      recent_transactions: recentTransactions
    };
  },

  getVendorMarginReport: async (startDate = null, endDate = null) => {
    let dateFilter = '';
    const params = [];

    if (startDate && endDate) {
      dateFilter = ' WHERE ti.created_at BETWEEN ? AND ?';
      params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
    }

    const sql = `
      SELECT 
        p.name as product_name,
        p.code as product_code,
        COUNT(ti.id) as total_orders,
        SUM(ti.qty) as total_qty,
        SUM(ti.subtotal) as total_revenue,
        SUM(ti.vendor_cost) as total_vendor_cost,
        (SUM(ti.subtotal) - SUM(ti.vendor_cost)) as gross_margin,
        CASE 
          WHEN SUM(ti.subtotal) > 0 THEN ((SUM(ti.subtotal) - SUM(ti.vendor_cost)) / SUM(ti.subtotal)) * 100 
          ELSE 0 
        END as margin_percent
      FROM transaction_items ti
      JOIN products p ON ti.product_id = p.id
      WHERE p.is_outsource = 1
      ${dateFilter ? 'AND ' + dateFilter.replace(' WHERE ', '') : ''}
      GROUP BY p.id
      ORDER BY gross_margin DESC
    `;

    const vendorItems = await query(sql, params);

    let totalRevenue = 0;
    let totalVendorCost = 0;
    vendorItems.forEach((v) => {
      totalRevenue += v.total_revenue || 0;
      totalVendorCost += v.total_vendor_cost || 0;
    });

    const totalMargin = totalRevenue - totalVendorCost;
    const marginPercent = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

    return {
      period: { startDate: startDate || 'Semua Waktu', endDate: endDate || 'Semua Waktu' },
      summary: {
        total_outsource_revenue: totalRevenue,
        total_vendor_cost: totalVendorCost,
        total_gross_margin: totalMargin,
        margin_percent: Math.round(marginPercent * 100) / 100
      },
      items: vendorItems
    };
  },

  getProfitLoss: async (startDate = null, endDate = null) => {
    let dateFilterTx = '';
    let dateFilterItem = '';
    let dateFilterPurchase = '';
    const paramsTx = [];
    const paramsItem = [];
    const paramsPurchase = [];

    if (startDate && endDate) {
      dateFilterTx = ' WHERE created_at BETWEEN ? AND ?';
      dateFilterItem = ' WHERE ti.created_at BETWEEN ? AND ?';
      dateFilterPurchase = ' WHERE created_at BETWEEN ? AND ?';

      paramsTx.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
      paramsItem.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
      paramsPurchase.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
    }

    // Total Omset
    const txSummary = await get(
      `SELECT COUNT(*) as total_transactions, COALESCE(SUM(total_amount), 0) as total_revenue FROM transactions${dateFilterTx}`,
      paramsTx
    );

    // Total Pembelian Material (Material Purchases)
    const purchaseSummary = await get(
      `SELECT COALESCE(SUM(total_amount), 0) as total_material_purchases FROM material_purchases${dateFilterPurchase}`,
      paramsPurchase
    );

    // Total HPP Per-Item Produk & Outsource Cost
    const itemSql = `
      SELECT 
        ti.qty, ti.width, ti.length, ti.subtotal, ti.vendor_cost,
        p.is_metered, COALESCE(p.base_price, 0) as base_price
      FROM transaction_items ti
      LEFT JOIN products p ON ti.product_id = p.id
      ${dateFilterItem}
    `;

    const items = await query(itemSql, paramsItem);

    let totalBaseCost = 0;
    let totalVendorCost = 0;

    items.forEach((item) => {
      totalVendorCost += item.vendor_cost || 0;
      if (item.base_price > 0) {
        if (item.is_metered && item.width > 0 && item.length > 0) {
          totalBaseCost += item.width * item.length * item.base_price * item.qty;
        } else {
          totalBaseCost += item.base_price * item.qty;
        }
      }
    });

    const materialPurchasesCost = purchaseSummary.total_material_purchases || 0;
    const totalCost = totalBaseCost + totalVendorCost;
    const grossProfit = txSummary.total_revenue - totalCost;
    const netProfit = grossProfit - materialPurchasesCost;

    const profitMargin = txSummary.total_revenue > 0 ? (grossProfit / txSummary.total_revenue) * 100 : 0;

    return {
      period: { startDate: startDate || 'Semua Waktu', endDate: endDate || 'Semua Waktu' },
      summary: {
        total_transactions: txSummary.total_transactions,
        total_revenue: txSummary.total_revenue,
        total_base_cost: totalBaseCost,
        total_vendor_cost: totalVendorCost,
        total_material_purchases: materialPurchasesCost,
        total_cogs: totalCost,
        gross_profit: grossProfit,
        net_profit: netProfit,
        profit_margin_percent: Math.round(profitMargin * 100) / 100
      }
    };
  }
};

module.exports = ReportModel;
