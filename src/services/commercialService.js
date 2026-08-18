import { supabase } from '../lib/supabase';

/**
 * Get commercial settings for a company. Creates defaults if none exist.
 */
export async function getCommercialSettings(companyId) {
  const { data, error } = await supabase
    .from('commercial_settings')
    .select('*')
    .eq('company_id', companyId)
    .single();

  if (error && error.code === 'PGRST116') {
    // No settings yet — create defaults
    const { data: created, error: createErr } = await supabase
      .from('commercial_settings')
      .insert({ company_id: companyId })
      .select()
      .single();
    if (createErr) throw createErr;
    return created;
  }
  if (error) throw error;
  return data;
}

/**
 * Update commercial settings.
 */
export async function updateCommercialSettings(companyId, updates) {
  const { data, error } = await supabase
    .from('commercial_settings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('company_id', companyId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Get dashboard KPIs for the commercial module.
 */
export async function getCommercialKPIs(companyId) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const today = now.toISOString().split('T')[0];

  // Get all non-cancelled invoices
  const { data: invoices, error: invErr } = await supabase
    .from('invoices')
    .select('total_amount, balance_due, status, invoice_date, paid_date, amount_paid')
    .eq('company_id', companyId)
    .neq('status', 'Cancelled');
  if (invErr) throw invErr;

  // Get this month's payments
  const { data: payments, error: payErr } = await supabase
    .from('payments')
    .select('amount, payment_date')
    .eq('company_id', companyId)
    .eq('status', 'Paid')
    .gte('payment_date', monthStart);
  if (payErr) throw payErr;

  // Get this month's costs
  const { data: costs, error: costErr } = await supabase
    .from('mission_costs')
    .select('total_cost, created_at')
    .eq('company_id', companyId)
    .gte('created_at', new Date(now.getFullYear(), now.getMonth(), 1).toISOString());
  if (costErr) throw costErr;

  // Calculate KPIs
  const thisMonthInvoices = invoices.filter(i => i.invoice_date >= monthStart);
  const revenueThisMonth = thisMonthInvoices.reduce((sum, i) => sum + Number(i.total_amount || 0), 0);
  const outstanding = invoices.filter(i => ['Sent', 'Viewed', 'Overdue', 'Partial'].includes(i.status));
  const outstandingTotal = outstanding.reduce((sum, i) => sum + Number(i.balance_due || 0), 0);
  const awaitingPayment = invoices.filter(i => ['Sent', 'Viewed'].includes(i.status)).length;
  const paidInvoices = invoices.filter(i => i.status === 'Paid').length;
  const totalCostsThisMonth = costs.reduce((sum, c) => sum + Number(c.total_cost || 0), 0);
  const profitThisMonth = revenueThisMonth - totalCostsThisMonth;

  // Average mission value
  const completedInvoices = invoices.filter(i => i.status !== 'Draft');
  const avgMissionValue = completedInvoices.length > 0
    ? completedInvoices.reduce((sum, i) => sum + Number(i.total_amount || 0), 0) / completedInvoices.length
    : 0;

  // Average payment time (days from invoice to paid)
  const paidWithDates = invoices.filter(i => i.status === 'Paid' && i.invoice_date && i.paid_date);
  const avgPaymentDays = paidWithDates.length > 0
    ? Math.round(paidWithDates.reduce((sum, i) => {
        const inv = new Date(i.invoice_date);
        const paid = new Date(i.paid_date);
        return sum + (paid - inv) / (1000 * 60 * 60 * 24);
      }, 0) / paidWithDates.length)
    : 0;

  // Profit margin
  const avgProfitMargin = revenueThisMonth > 0
    ? Math.round((profitThisMonth / revenueThisMonth) * 100)
    : 0;

  return {
    revenueThisMonth,
    outstandingTotal,
    outstandingCount: outstanding.length,
    awaitingPayment,
    paidInvoices,
    avgMissionValue: Math.round(avgMissionValue * 100) / 100,
    avgPaymentDays,
    profitThisMonth,
    avgProfitMargin,
    totalInvoices: invoices.length,
  };
}

/**
 * Get recent payments for overview.
 */
export async function getRecentPayments(companyId, limit = 5) {
  const { data, error } = await supabase
    .from('payments')
    .select('*, invoices(invoice_number), customers(customer_name)')
    .eq('company_id', companyId)
    .eq('status', 'Paid')
    .order('payment_date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

/**
 * Get invoices due soon (within 7 days).
 */
export async function getInvoicesDue(companyId, daysAhead = 7) {
  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  const futureDateStr = futureDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('invoices')
    .select('*, customers(customer_name)')
    .eq('company_id', companyId)
    .in('status', ['Sent', 'Viewed', 'Partial'])
    .lte('due_date', futureDateStr)
    .order('due_date');
  if (error) throw error;
  return data;
}

/**
 * Get top customers by revenue.
 */
export async function getTopCustomers(companyId, limit = 5) {
  const { data, error } = await supabase
    .from('invoices')
    .select('customer_id, total_amount, customers(customer_name)')
    .eq('company_id', companyId)
    .neq('status', 'Cancelled');
  if (error) throw error;

  // Aggregate by customer
  const customerMap = {};
  data.forEach(inv => {
    const cid = inv.customer_id;
    if (!cid) return;
    if (!customerMap[cid]) {
      customerMap[cid] = { customer_id: cid, customer_name: inv.customers?.customer_name, total_revenue: 0, invoice_count: 0 };
    }
    customerMap[cid].total_revenue += Number(inv.total_amount || 0);
    customerMap[cid].invoice_count++;
  });

  return Object.values(customerMap)
    .sort((a, b) => b.total_revenue - a.total_revenue)
    .slice(0, limit);
}

/**
 * Get customer billing details.
 */
export async function getCustomerBilling(companyId) {
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('customer_id, total_amount, balance_due, status, invoice_date, paid_date, customers(customer_name)')
    .eq('company_id', companyId)
    .neq('status', 'Cancelled');
  if (error) throw error;

  const customerMap = {};
  invoices.forEach(inv => {
    const cid = inv.customer_id;
    if (!cid) return;
    if (!customerMap[cid]) {
      customerMap[cid] = {
        customer_id: cid,
        customer_name: inv.customers?.customer_name,
        total_revenue: 0,
        total_paid: 0,
        outstanding: 0,
        invoice_count: 0,
        paid_count: 0,
        avg_payment_days: 0,
        last_invoice_date: null,
        payment_days_sum: 0,
      };
    }
    const c = customerMap[cid];
    c.total_revenue += Number(inv.total_amount || 0);
    c.outstanding += Number(inv.balance_due || 0);
    c.total_paid += Number(inv.total_amount || 0) - Number(inv.balance_due || 0);
    c.invoice_count++;
    if (inv.status === 'Paid') c.paid_count++;
    if (inv.invoice_date && (!c.last_invoice_date || inv.invoice_date > c.last_invoice_date)) {
      c.last_invoice_date = inv.invoice_date;
    }
    if (inv.paid_date && inv.invoice_date) {
      c.payment_days_sum += (new Date(inv.paid_date) - new Date(inv.invoice_date)) / (1000 * 60 * 60 * 24);
    }
  });

  return Object.values(customerMap).map(c => ({
    ...c,
    avg_payment_days: c.paid_count > 0 ? Math.round(c.payment_days_sum / c.paid_count) : 0,
    status: c.outstanding > 0 ? 'Outstanding' : 'Current',
  })).sort((a, b) => b.total_revenue - a.total_revenue);
}
