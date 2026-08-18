import { supabase } from '../lib/supabase';

/**
 * Get or create mission costs for a mission.
 */
export async function getMissionCosts(missionId) {
  const { data, error } = await supabase
    .from('mission_costs')
    .select('*')
    .eq('mission_id', missionId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

/**
 * Save/update mission costs.
 */
export async function saveMissionCosts(missionId, companyId, costs) {
  const totalCost = Number(costs.chemical_cost || 0) +
    Number(costs.pilot_cost || 0) +
    Number(costs.aircraft_cost || 0) +
    Number(costs.battery_cost || 0) +
    Number(costs.travel_cost || 0) +
    Number(costs.maintenance_cost || 0) +
    Number(costs.other_cost || 0);

  const { data, error } = await supabase
    .from('mission_costs')
    .upsert({
      company_id: companyId,
      mission_id: missionId,
      chemical_cost: costs.chemical_cost || 0,
      pilot_cost: costs.pilot_cost || 0,
      aircraft_cost: costs.aircraft_cost || 0,
      battery_cost: costs.battery_cost || 0,
      travel_cost: costs.travel_cost || 0,
      maintenance_cost: costs.maintenance_cost || 0,
      other_cost: costs.other_cost || 0,
      total_cost: totalCost,
      notes: costs.notes || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'company_id,mission_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Get profitability data for all completed missions.
 */
export async function getMissionProfitability(companyId, { customerId, pilotId, aircraftId, dateFrom, dateTo } = {}) {
  // Use the mission_profit view
  let query = supabase
    .from('mission_profit')
    .select('*')
    .eq('company_id', companyId);

  if (customerId) query = query.eq('customer_id', customerId);
  if (pilotId) query = query.eq('pilot_id', pilotId);
  if (aircraftId) query = query.eq('aircraft_id', aircraftId);
  if (dateFrom) query = query.gte('scheduled_date', dateFrom);
  if (dateTo) query = query.lte('scheduled_date', dateTo);

  query = query.order('scheduled_date', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Get profitability summary grouped by dimension.
 */
export async function getProfitabilitySummary(companyId, groupBy = 'month') {
  const data = await getMissionProfitability(companyId);

  if (groupBy === 'customer') {
    const grouped = {};
    data.forEach(m => {
      const key = m.customer_name || 'Unknown';
      if (!grouped[key]) grouped[key] = { name: key, revenue: 0, cost: 0, profit: 0, missions: 0 };
      grouped[key].revenue += Number(m.revenue || 0);
      grouped[key].cost += Number(m.total_cost || 0);
      grouped[key].profit += Number(m.net_profit || 0);
      grouped[key].missions++;
    });
    return Object.values(grouped).map(g => ({
      ...g,
      margin: g.revenue > 0 ? Math.round((g.profit / g.revenue) * 100) : 0,
    })).sort((a, b) => b.revenue - a.revenue);
  }

  if (groupBy === 'pilot') {
    const grouped = {};
    data.forEach(m => {
      const key = m.pilot_id || 'Unassigned';
      if (!grouped[key]) grouped[key] = { id: key, revenue: 0, cost: 0, profit: 0, missions: 0 };
      grouped[key].revenue += Number(m.revenue || 0);
      grouped[key].cost += Number(m.total_cost || 0);
      grouped[key].profit += Number(m.net_profit || 0);
      grouped[key].missions++;
    });
    return Object.values(grouped).map(g => ({
      ...g,
      margin: g.revenue > 0 ? Math.round((g.profit / g.revenue) * 100) : 0,
    })).sort((a, b) => b.revenue - a.revenue);
  }

  if (groupBy === 'aircraft') {
    const grouped = {};
    data.forEach(m => {
      const key = m.aircraft_id || 'Unassigned';
      if (!grouped[key]) grouped[key] = { id: key, revenue: 0, cost: 0, profit: 0, missions: 0 };
      grouped[key].revenue += Number(m.revenue || 0);
      grouped[key].cost += Number(m.total_cost || 0);
      grouped[key].profit += Number(m.net_profit || 0);
      grouped[key].missions++;
    });
    return Object.values(grouped).map(g => ({
      ...g,
      margin: g.revenue > 0 ? Math.round((g.profit / g.revenue) * 100) : 0,
    })).sort((a, b) => b.revenue - a.revenue);
  }

  // Default: month
  const grouped = {};
  data.forEach(m => {
    const d = new Date(m.scheduled_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!grouped[key]) grouped[key] = { month: key, revenue: 0, cost: 0, profit: 0, missions: 0 };
    grouped[key].revenue += Number(m.revenue || 0);
    grouped[key].cost += Number(m.total_cost || 0);
    grouped[key].profit += Number(m.net_profit || 0);
    grouped[key].missions++;
  });
  return Object.values(grouped).map(g => ({
    ...g,
    margin: g.revenue > 0 ? Math.round((g.profit / g.revenue) * 100) : 0,
  })).sort((a, b) => a.month.localeCompare(b.month));
}
