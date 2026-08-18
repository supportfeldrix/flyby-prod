import { supabase } from '../lib/supabase';

/**
 * Generate the next invoice number atomically via Postgres RPC.
 */
export async function generateInvoiceNumber(companyId) {
  const { data, error } = await supabase.rpc('next_invoice_number', {
    p_company_id: companyId,
  });
  if (error) throw error;
  return data;
}

/**
 * Get all invoices for a company with optional filters.
 */
export async function getInvoices(companyId, { status, customerId, search, sortOrder = 'desc' } = {}) {
  let query = supabase
    .from('invoices')
    .select('*, customers(customer_name), missions(mission_number)')
    .eq('company_id', companyId);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  if (customerId) {
    query = query.eq('customer_id', customerId);
  }

  query = query.order('invoice_date', { ascending: sortOrder === 'asc' });

  const { data, error } = await query;
  if (error) throw error;

  if (search && search.trim()) {
    const term = search.toLowerCase();
    return data.filter(inv =>
      inv.invoice_number?.toLowerCase().includes(term) ||
      inv.customers?.customer_name?.toLowerCase().includes(term) ||
      inv.missions?.mission_number?.toLowerCase().includes(term) ||
      inv.description?.toLowerCase().includes(term)
    );
  }

  return data;
}

/**
 * Get a single invoice with items and payments.
 */
export async function getInvoiceById(invoiceId) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, customers(customer_name, contact_person, phone, email), missions(mission_number, actual_area, actual_duration, scheduled_date), invoice_items(*), payments(*)')
    .eq('id', invoiceId)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Get invoice by mission ID.
 */
export async function getInvoiceByMissionId(missionId) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, customers(customer_name)')
    .eq('mission_id', missionId)
    .neq('status', 'Cancelled')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

/**
 * Create a new invoice from a completed mission.
 */
export async function generateInvoiceFromMission(mission, companyId, userId, userName, settings = {}) {
  const invoiceNumber = await generateInvoiceNumber(companyId);

  const vatPct = settings.vat_percentage || 15;
  const ratePerHa = settings.rate_per_hectare || settings.default_mission_rate || 0;
  const area = mission.actual_area || mission.estimated_area || 0;
  const subtotal = ratePerHa > 0 ? ratePerHa * area : settings.default_mission_rate || 0;
  const vatAmount = settings.vat_registered ? Math.round(subtotal * (vatPct / 100) * 100) / 100 : 0;
  const totalAmount = subtotal + vatAmount;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (settings.payment_terms_days || 30));

  // Create invoice
  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .insert({
      company_id: companyId,
      invoice_number: invoiceNumber,
      mission_id: mission.id,
      customer_id: mission.customer_id,
      farm_id: mission.farm_id,
      subtotal,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      balance_due: totalAmount,
      status: 'Draft',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      description: `Aerial application services — ${mission.mission_number || ''}`,
      notes: settings.invoice_notes || null,
      footer: settings.invoice_footer || null,
      payment_terms: `Payment due within ${settings.payment_terms_days || 30} days`,
      vat_percentage: vatPct,
      currency: settings.currency || 'ZAR',
      created_by: userId,
      created_by_name: userName,
    })
    .select()
    .single();
  if (invErr) throw invErr;

  // Create line items
  const items = [];

  if (area > 0 && ratePerHa > 0) {
    items.push({
      company_id: companyId,
      invoice_id: invoice.id,
      description: `Aerial spray application — ${mission.fields?.field_name || mission.crop || 'Field'}`,
      quantity: area,
      unit: 'ha',
      unit_price: ratePerHa,
      amount: subtotal,
      sort_order: 0,
    });
  } else {
    items.push({
      company_id: companyId,
      invoice_id: invoice.id,
      description: `Drone mission services — ${mission.mission_number || ''}`,
      quantity: 1,
      unit: 'mission',
      unit_price: subtotal,
      amount: subtotal,
      sort_order: 0,
    });
  }

  if (items.length > 0) {
    const { error: itemErr } = await supabase.from('invoice_items').insert(items);
    if (itemErr) throw itemErr;
  }

  return invoice;
}

/**
 * Create a blank invoice manually.
 */
export async function createInvoice(invoiceData, companyId, userId, userName) {
  const invoiceNumber = await generateInvoiceNumber(companyId);

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      ...invoiceData,
      company_id: companyId,
      invoice_number: invoiceNumber,
      created_by: userId,
      created_by_name: userName,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Update an invoice.
 */
export async function updateInvoice(invoiceId, updates) {
  const { data, error } = await supabase
    .from('invoices')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', invoiceId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Update invoice status.
 */
export async function updateInvoiceStatus(invoiceId, status) {
  const updates = { status, updated_at: new Date().toISOString() };
  if (status === 'Sent') updates.sent_at = new Date().toISOString();
  if (status === 'Viewed') updates.viewed_at = new Date().toISOString();
  if (status === 'Paid') updates.paid_date = new Date().toISOString().split('T')[0];

  const { error } = await supabase.from('invoices').update(updates).eq('id', invoiceId);
  if (error) throw error;
}

/**
 * Delete (cancel) an invoice.
 */
export async function cancelInvoice(invoiceId) {
  const { error } = await supabase
    .from('invoices')
    .update({ status: 'Cancelled', updated_at: new Date().toISOString() })
    .eq('id', invoiceId);
  if (error) throw error;
}

/**
 * Duplicate an invoice.
 */
export async function duplicateInvoice(invoiceId, companyId, userId, userName) {
  const original = await getInvoiceById(invoiceId);
  if (!original) throw new Error('Invoice not found');

  const invoiceNumber = await generateInvoiceNumber(companyId);

  const { data: newInvoice, error } = await supabase
    .from('invoices')
    .insert({
      company_id: companyId,
      invoice_number: invoiceNumber,
      mission_id: original.mission_id,
      customer_id: original.customer_id,
      farm_id: original.farm_id,
      subtotal: original.subtotal,
      vat_amount: original.vat_amount,
      total_amount: original.total_amount,
      balance_due: original.total_amount,
      status: 'Draft',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: original.due_date,
      description: original.description,
      notes: original.notes,
      footer: original.footer,
      payment_terms: original.payment_terms,
      vat_percentage: original.vat_percentage,
      currency: original.currency,
      created_by: userId,
      created_by_name: userName,
    })
    .select()
    .single();
  if (error) throw error;

  // Copy line items
  if (original.invoice_items?.length > 0) {
    const items = original.invoice_items.map(item => ({
      company_id: companyId,
      invoice_id: newInvoice.id,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      amount: item.amount,
      sort_order: item.sort_order,
    }));
    await supabase.from('invoice_items').insert(items);
  }

  return newInvoice;
}

/**
 * Get invoice items for an invoice.
 */
export async function getInvoiceItems(invoiceId) {
  const { data, error } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('sort_order');
  if (error) throw error;
  return data;
}

/**
 * Add a line item to an invoice.
 */
export async function addInvoiceItem(item) {
  const { data, error } = await supabase
    .from('invoice_items')
    .insert(item)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Remove a line item.
 */
export async function deleteInvoiceItem(itemId) {
  const { error } = await supabase.from('invoice_items').delete().eq('id', itemId);
  if (error) throw error;
}

/**
 * Recalculate invoice totals from line items.
 */
export async function recalculateInvoice(invoiceId) {
  const items = await getInvoiceItems(invoiceId);
  const subtotal = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const { data: invoice } = await supabase.from('invoices').select('vat_percentage, amount_paid').eq('id', invoiceId).single();
  const vatPct = invoice?.vat_percentage || 15;
  const vatAmount = Math.round(subtotal * (vatPct / 100) * 100) / 100;
  const totalAmount = subtotal + vatAmount;
  const balanceDue = totalAmount - (invoice?.amount_paid || 0);

  await updateInvoice(invoiceId, { subtotal, vat_amount: vatAmount, total_amount: totalAmount, balance_due: balanceDue });
}
