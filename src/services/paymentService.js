import { supabase } from '../lib/supabase';

/**
 * Get all payments for a company.
 */
export async function getPayments(companyId, { customerId, invoiceId, sortOrder = 'desc' } = {}) {
  let query = supabase
    .from('payments')
    .select('*, invoices(invoice_number, total_amount, status), customers(customer_name)')
    .eq('company_id', companyId);

  if (customerId) query = query.eq('customer_id', customerId);
  if (invoiceId) query = query.eq('invoice_id', invoiceId);

  query = query.order('payment_date', { ascending: sortOrder === 'asc' });

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Get a single payment by ID.
 */
export async function getPaymentById(paymentId) {
  const { data, error } = await supabase
    .from('payments')
    .select('*, invoices(invoice_number, total_amount, customer_id, status), customers(customer_name)')
    .eq('id', paymentId)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Record a payment against an invoice.
 * Automatically updates invoice amount_paid, balance_due, and status.
 */
export async function recordPayment(paymentData, companyId, userId, userName) {
  const { invoice_id, amount, payment_method, payment_date, reference, notes } = paymentData;

  // Create payment record
  const { data: payment, error: payErr } = await supabase
    .from('payments')
    .insert({
      company_id: companyId,
      invoice_id,
      customer_id: paymentData.customer_id,
      amount: Number(amount),
      payment_method: payment_method || 'EFT',
      payment_date: payment_date || new Date().toISOString().split('T')[0],
      reference: reference || null,
      notes: notes || null,
      status: 'Paid',
      created_by: userId,
      created_by_name: userName,
    })
    .select()
    .single();
  if (payErr) throw payErr;

  // Update invoice totals
  const { data: invoice } = await supabase
    .from('invoices')
    .select('total_amount, amount_paid')
    .eq('id', invoice_id)
    .single();

  if (invoice) {
    const newAmountPaid = Number(invoice.amount_paid || 0) + Number(amount);
    const newBalance = Number(invoice.total_amount) - newAmountPaid;
    const newStatus = newBalance <= 0 ? 'Paid' : 'Partial';

    await supabase.from('invoices').update({
      amount_paid: newAmountPaid,
      balance_due: Math.max(0, newBalance),
      status: newStatus,
      paid_date: newStatus === 'Paid' ? new Date().toISOString().split('T')[0] : null,
      updated_at: new Date().toISOString(),
    }).eq('id', invoice_id);
  }

  return payment;
}

/**
 * Cancel a payment and reverse invoice totals.
 */
export async function cancelPayment(paymentId) {
  const payment = await getPaymentById(paymentId);
  if (!payment) throw new Error('Payment not found');

  // Update payment status
  await supabase.from('payments').update({ status: 'Cancelled' }).eq('id', paymentId);

  // Reverse invoice totals
  const { data: invoice } = await supabase
    .from('invoices')
    .select('total_amount, amount_paid, status')
    .eq('id', payment.invoice_id)
    .single();

  if (invoice) {
    const newAmountPaid = Math.max(0, Number(invoice.amount_paid || 0) - Number(payment.amount));
    const newBalance = Number(invoice.total_amount) - newAmountPaid;
    const newStatus = newAmountPaid <= 0 ? 'Sent' : 'Partial';

    await supabase.from('invoices').update({
      amount_paid: newAmountPaid,
      balance_due: newBalance,
      status: newStatus,
      paid_date: null,
      updated_at: new Date().toISOString(),
    }).eq('id', payment.invoice_id);
  }
}

/**
 * Get payment summary stats.
 */
export async function getPaymentStats(companyId) {
  const { data, error } = await supabase
    .from('payments')
    .select('amount, payment_date, status')
    .eq('company_id', companyId)
    .eq('status', 'Paid');
  if (error) throw error;

  const now = new Date();
  const thisMonth = data.filter(p => {
    const d = new Date(p.payment_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  return {
    totalPayments: data.length,
    totalReceived: data.reduce((sum, p) => sum + Number(p.amount), 0),
    thisMonthPayments: thisMonth.length,
    thisMonthReceived: thisMonth.reduce((sum, p) => sum + Number(p.amount), 0),
  };
}
