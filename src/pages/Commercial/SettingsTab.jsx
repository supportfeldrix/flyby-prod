import { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Button, Grid, Divider, Chip } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { getCommercialSettings, updateCommercialSettings } from '../../services/commercialService';

export default function SettingsTab() {
  const { company } = useAuth();
  const { showToast } = useToast();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company?.id) return;
    setLoading(true);
    getCommercialSettings(company.id)
      .then(setSettings)
      .catch(err => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [company?.id, showToast]);

  const handleChange = (field, value) => {
    setSettings(s => ({ ...s, [field]: value }));
  };

  const handleSave = async () => {
    if (!company?.id || !settings) return;
    setSaving(true);
    try {
      const updated = await updateCommercialSettings(company.id, {
        currency: settings.currency,
        currency_symbol: settings.currency_symbol,
        vat_percentage: settings.vat_percentage,
        vat_registered: settings.vat_registered,
        invoice_prefix: settings.invoice_prefix,
        payment_terms_days: settings.payment_terms_days,
        default_mission_rate: settings.default_mission_rate,
        rate_per_hectare: settings.rate_per_hectare,
        bank_name: settings.bank_name,
        bank_account_name: settings.bank_account_name,
        bank_account_number: settings.bank_account_number,
        bank_branch_code: settings.bank_branch_code,
        bank_reference: settings.bank_reference,
        invoice_notes: settings.invoice_notes,
        invoice_footer: settings.invoice_footer,
      });
      setSettings(updated);
      showToast('Commercial settings saved');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  if (loading || !settings) return null;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon sx={{ fontSize: '1rem', color: 'text.tertiary' }} />
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>Commercial Configuration</Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>

      {/* Currency & Tax */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: '12px', mb: 3 }}>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em', mb: 2 }}>Currency & Tax</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" label="Currency" value={settings.currency || ''} onChange={e => handleChange('currency', e.target.value)} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" label="Symbol" value={settings.currency_symbol || ''} onChange={e => handleChange('currency_symbol', e.target.value)} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" label="VAT %" type="number" value={settings.vat_percentage || ''} onChange={e => handleChange('vat_percentage', parseFloat(e.target.value) || 0)} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" label="VAT Registered" select value={settings.vat_registered ? 'yes' : 'no'} onChange={e => handleChange('vat_registered', e.target.value === 'yes')}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Invoice Settings */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: '12px', mb: 3 }}>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em', mb: 2 }}>Invoice Settings</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" label="Invoice Prefix" value={settings.invoice_prefix || ''} onChange={e => handleChange('invoice_prefix', e.target.value)} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" label="Payment Terms (days)" type="number" value={settings.payment_terms_days || ''} onChange={e => handleChange('payment_terms_days', parseInt(e.target.value) || 30)} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" label="Default Rate (flat)" type="number" value={settings.default_mission_rate || ''} onChange={e => handleChange('default_mission_rate', parseFloat(e.target.value) || 0)} helperText="Per mission" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" label="Rate per Hectare" type="number" value={settings.rate_per_hectare || ''} onChange={e => handleChange('rate_per_hectare', parseFloat(e.target.value) || 0)} helperText="R/ha" />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth size="small" label="Invoice Notes" multiline rows={2} value={settings.invoice_notes || ''} onChange={e => handleChange('invoice_notes', e.target.value)} helperText="Appears on all invoices" />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth size="small" label="Invoice Footer" multiline rows={2} value={settings.invoice_footer || ''} onChange={e => handleChange('invoice_footer', e.target.value)} helperText="Bottom of every invoice" />
          </Grid>
        </Grid>
      </Paper>

      {/* Banking Details */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: '12px', mb: 3 }}>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em', mb: 2 }}>Banking Details</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Bank Name" value={settings.bank_name || ''} onChange={e => handleChange('bank_name', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Account Name" value={settings.bank_account_name || ''} onChange={e => handleChange('bank_account_name', e.target.value)} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField fullWidth size="small" label="Account Number" value={settings.bank_account_number || ''} onChange={e => handleChange('bank_account_number', e.target.value)} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField fullWidth size="small" label="Branch Code" value={settings.bank_branch_code || ''} onChange={e => handleChange('bank_branch_code', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" label="Payment Reference" value={settings.bank_reference || ''} onChange={e => handleChange('bank_reference', e.target.value)} helperText="Default reference for customers" />
          </Grid>
        </Grid>
      </Paper>

      {/* Future Integrations */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: '12px', opacity: 0.6 }}>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em', mb: 2 }}>Future Integrations</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {['PayFast', 'Stripe', 'Xero', 'QuickBooks', 'Sage', 'Pastel', 'Email Invoices', 'Recurring Invoices', 'Credit Notes', 'Customer Statements', 'Online Payments', 'Tax Reports'].map(item => (
            <Chip key={item} label={item} size="small" variant="outlined" sx={{ fontSize: '0.65rem', borderColor: 'rgba(15,23,42,0.1)', color: 'text.tertiary' }} />
          ))}
        </Box>
      </Paper>
    </Box>
  );
}
