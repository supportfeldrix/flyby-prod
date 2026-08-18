import { supabase } from '../lib/supabase';

/**
 * Get monthly revenue data for charts.
 */
export async function getMonthlyRevenue(companyId, months = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const { data, error } = await supabase
    .from('invoices')
    .select('total_amount, invoice_date, status')
    .eq('company_id', companyId)
    .neq('status', 'Cancelled')
    .gte('invoice_date', startDate.toISOString().split('T')[0])
    .order('invoice_date');
  if (error) throw error;

  const monthly = {};
  data.forEach(inv => {
    const d = new Date(inv.invoice_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-ZA', { month: 'short', year: '2-digit' });
    if (!monthly[key]) monthly[key] = { month: key, label, revenue: 0, count: 0 };
    monthly[key].revenue += Number(inv.total_amount || 0);
    monthly[key].count++;
  });

  return Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Get revenue by customer for charts.
 */
export async function getRevenueByCustomer(companyId) {
  const { data, error } = await supabase
    .from('invoices')
    .select('customer_id, total_amount, customers(customer_name)')
    .eq('company_id', companyId)
    .neq('status', 'Cancelled');
  if (error) throw error;

  const customerMap = {};
  data.forEach(inv => {
    const name = inv.customers?.customer_name || 'Unknown';
    if (!customerMap[name]) customerMap[name] = { name, revenue: 0, count: 0 };
    customerMap[name].revenue += Number(inv.total_amount || 0);
    customerMap[name].count++;
  });

  return Object.values(customerMap).sort((a, b) => b.revenue - a.revenue);
}

/**
 * Get revenue by pilot.
 */
export async function getRevenueByPilot(companyId) {
  const { data, error } = await supabase
    .from('invoices')
    .select('total_amount, missions(pilot_id, pilots(first_name, last_name, display_name))')
    .eq('company_id', companyId)
    .neq('status', 'Cancelled');
  if (error) throw error;

  const pilotMap = {};
  data.forEach(inv => {
    const pilot = inv.missions?.pilots;
    const name = pilot ? (pilot.display_name || `${pilot.first_name} ${pilot.last_name}`) : 'Unassigned';
    if (!pilotMap[name]) pilotMap[name] = { name, revenue: 0, count: 0 };
    pilotMap[name].revenue += Number(inv.total_amount || 0);
    pilotMap[name].count++;
  });

  return Object.values(pilotMap).sort((a, b) => b.revenue - a.revenue);
}

/**
 * Get revenue by aircraft.
 */
export async function getRevenueByAircraft(companyId) {
  const { data, error } = await supabase
    .from('invoices')
    .select('total_amount, missions(aircraft_id, aircraft(aircraft_name))')
    .eq('company_id', companyId)
    .neq('status', 'Cancelled');
  if (error) throw error;

  const aircraftMap = {};
  data.forEach(inv => {
    const name = inv.missions?.aircraft?.aircraft_name || 'Unassigned';
    if (!aircraftMap[name]) aircraftMap[name] = { name, revenue: 0, count: 0 };
    aircraftMap[name].revenue += Number(inv.total_amount || 0);
    aircraftMap[name].count++;
  });

  return Object.values(aircraftMap).sort((a, b) => b.revenue - a.revenue);
}

/**
 * Get profit trend (monthly).
 */
export async function getProfitTrend(companyId, months = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  const startStr = startDate.toISOString().split('T')[0];

  // Revenue by month
  const { data: invoices, error: invErr } = await supabase
    .from('invoices')
    .select('total_amount, invoice_date')
    .eq('company_id', companyId)
    .neq('status', 'Cancelled')
    .gte('invoice_date', startStr);
  if (invErr) throw invErr;

  // Costs by month
  const { data: costs, error: costErr } = await supabase
    .from('mission_costs')
    .select('total_cost, created_at')
    .eq('company_id', companyId)
    .gte('created_at', startDate.toISOString());
  if (costErr) throw costErr;

  const monthly = {};

  invoices.forEach(inv => {
    const d = new Date(inv.invoice_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-ZA', { month: 'short', year: '2-digit' });
    if (!monthly[key]) monthly[key] = { month: key, label, revenue: 0, cost: 0, profit: 0 };
    monthly[key].revenue += Number(inv.total_amount || 0);
  });

  costs.forEach(c => {
    const d = new Date(c.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-ZA', { month: 'short', year: '2-digit' });
    if (!monthly[key]) monthly[key] = { month: key, label, revenue: 0, cost: 0, profit: 0 };
    monthly[key].cost += Number(c.total_cost || 0);
  });

  return Object.values(monthly).map(m => ({
    ...m,
    profit: m.revenue - m.cost,
    margin: m.revenue > 0 ? Math.round(((m.revenue - m.cost) / m.revenue) * 100) : 0,
  })).sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Get outstanding accounts overview.
 */
export async function getOutstandingAccounts(companyId) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, customers(customer_name)')
    .eq('company_id', companyId)
    .in('status', ['Sent', 'Viewed', 'Overdue', 'Partial'])
    .gt('balance_due', 0)
    .order('due_date');
  if (error) throw error;

  return data.map(inv => ({
    ...inv,
    days_overdue: inv.due_date ? Math.max(0, Math.floor((new Date() - new Date(inv.due_date)) / (1000 * 60 * 60 * 24))) : 0,
  }));
}
