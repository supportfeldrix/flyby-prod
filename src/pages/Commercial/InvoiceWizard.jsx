import { useState, useEffect } from 'react';
import {
  Dialog,
  Box,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Grid,
  Paper,
  Chip,
  Divider,
  Alert,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { generateInvoiceFromMission, getInvoiceByMissionId } from '../../services/invoiceService';
import { getCommercialSettings } from '../../services/commercialService';

const STEPS = ['Select Mission', 'Review & Adjust', 'Generate Invoice'];

function formatCurrency(amount) {
  return `R ${Number(amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Multi-step Invoice Wizard.
 * Step 1: Select completed mission
 * Step 2: Review/adjust charges
 * Step 3: Generate & save
 */
export default function InvoiceWizard({ open, onClose, onComplete, preselectedMission = null }) {
  const { company, profile } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [missions, setMissions] = useState([]);
  const [selectedMission, setSelectedMission] = useState(null);
  const [existingInvoice, setExistingInvoice] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);

  // Charges form
  const [charges, setCharges] = useState({
    areaRate: 0,
    chemicalCost: 0,
    travelCost: 0,
    otherCharges: 0,
    discount: 0,
    description: '',
  });

  // Load completed missions and settings on open
  useEffect(() => {
    if (!open || !company?.id) return;
    setStep(0);
    setSelectedMission(preselectedMission || null);
    setExistingInvoice(null);
    setGeneratedInvoice(null);

    // Fetch settings
    getCommercialSettings(company.id).then(s => {
      setSettings(s);
      setCharges(prev => ({
        ...prev,
        areaRate: s?.rate_per_hectare || s?.default_mission_rate || 0,
      }));
    }).catch(() => {});

    // If preselected, skip to step 2
    if (preselectedMission) {
      checkExistingInvoice(preselectedMission.id);
      setStep(1);
      return;
    }

    // Fetch completed missions without invoices
    setLoading(true);
    supabase
      .from('missions')
      .select('*, customers(customer_name), farms(farm_name), fields(field_name, crop, area_hectares), aircraft(aircraft_name), pilots(first_name, last_name, display_name)')
      .eq('company_id', company.id)
      .eq('status', 'Completed')
      .order('completed_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setMissions(data);
        setLoading(false);
      });
  }, [open, company?.id, preselectedMission]);

  const checkExistingInvoice = async (missionId) => {
    try {
      const inv = await getInvoiceByMissionId(missionId);
      setExistingInvoice(inv);
    } catch {
      setExistingInvoice(null);
    }
  };

  const handleSelectMission = async (mission) => {
    setSelectedMission(mission);
    await checkExistingInvoice(mission.id);

    // Pre-fill charges
    const area = mission.actual_area || mission.estimated_area || 0;
    setCharges(prev => ({
      ...prev,
      areaRate: settings?.rate_per_hectare || settings?.default_mission_rate || 0,
      description: `Aerial application — ${mission.fields?.field_name || ''} (${area} ha)`,
    }));
    setStep(1);
  };

  const calculateTotals = () => {
    const area = selectedMission?.actual_area || selectedMission?.estimated_area || 0;
    const subtotal = (Number(charges.areaRate) * area) +
      Number(charges.chemicalCost || 0) +
      Number(charges.travelCost || 0) +
      Number(charges.otherCharges || 0) -
      Number(charges.discount || 0);
    const vatPct = settings?.vat_percentage || 15;
    const vatAmount = settings?.vat_registered ? Math.round(subtotal * (vatPct / 100) * 100) / 100 : 0;
    const total = subtotal + vatAmount;
    return { subtotal, vatAmount, vatPct, total, area };
  };

  const handleGenerate = async () => {
    if (!selectedMission || !company?.id) return;
    setGenerating(true);
    try {
      // Build settings with overridden rates
      const area = selectedMission.actual_area || selectedMission.estimated_area || 0;
      const baseRate = Number(charges.areaRate) || 0;
      const extras = Number(charges.chemicalCost || 0) + Number(charges.travelCost || 0) + Number(charges.otherCharges || 0) - Number(charges.discount || 0);
      const effectiveRate = area > 0 ? baseRate + (extras / area) : baseRate;

      const invoiceSettings = {
        ...settings,
        rate_per_hectare: effectiveRate,
      };

      const invoice = await generateInvoiceFromMission(
        selectedMission,
        company.id,
        profile?.id,
        profile?.full_name,
        invoiceSettings
      );

      setGeneratedInvoice(invoice);
      setStep(2);
      showToast('Invoice generated successfully');
    } catch (err) {
      console.error('[FlyBy] Invoice generation failed:', err);
      showToast(err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleFinish = () => {
    onComplete?.(generatedInvoice);
    onClose();
  };

  const totals = selectedMission ? calculateTotals() : { subtotal: 0, vatAmount: 0, vatPct: 0, total: 0, area: 0 };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: '16px', maxHeight: '90vh' } }}
    >
      {/* Header */}
      <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ReceiptLongIcon sx={{ color: '#16A34A' }} />
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 700 }}>Generate Invoice</Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </Box>

      {/* Stepper */}
      <Box sx={{ px: 4, pt: 3 }}>
        <Stepper activeStep={step} alternativeLabel sx={{ '& .MuiStepIcon-root.Mui-active': { color: '#16A34A' }, '& .MuiStepIcon-root.Mui-completed': { color: '#16A34A' } }}>
          {STEPS.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>
      </Box>

      {/* Content */}
      <Box sx={{ px: 4, py: 3, overflow: 'auto', flex: 1 }}>
        {/* STEP 0: Select Mission */}
        {step === 0 && (
          <Box>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mb: 2 }}>
              Select a completed mission to generate an invoice from.
            </Typography>
            {missions.length === 0 && !loading ? (
              <Alert severity="info" sx={{ borderRadius: '12px' }}>
                No completed missions available. Complete a mission first.
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 400, overflow: 'auto' }}>
                {missions.map(m => (
                  <Paper
                    key={m.id}
                    onClick={() => handleSelectMission(m)}
                    sx={{
                      p: 2,
                      borderRadius: '12px',
                      border: '1px solid rgba(15,23,42,0.06)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      '&:hover': { borderColor: '#16A34A', bgcolor: 'rgba(22,163,74,0.02)' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <FlightTakeoffIcon sx={{ fontSize: '1.1rem', color: '#16A34A' }} />
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'monospace' }}>{m.mission_number}</Typography>
                          <Chip label="Completed" size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: 'rgba(22,163,74,0.08)', color: '#16A34A' }} />
                        </Box>
                        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                          {m.customers?.customer_name} • {m.fields?.field_name} • {m.actual_area || m.estimated_area || '?'} ha
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                        {formatDate(m.completed_at || m.scheduled_date)}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* STEP 1: Review & Adjust */}
        {step === 1 && selectedMission && (
          <Box>
            {/* Existing invoice warning */}
            {existingInvoice && (
              <Alert severity="warning" sx={{ mb: 3, borderRadius: '12px' }}>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 0.5 }}>This mission has already been invoiced</Typography>
                <Typography sx={{ fontSize: '0.8rem', mb: 1 }}>
                  Invoice {existingInvoice.invoice_number} — {formatCurrency(existingInvoice.total_amount)} ({existingInvoice.status})
                </Typography>
                <Button size="small" variant="outlined" onClick={handleFinish}>View Invoice</Button>
              </Alert>
            )}

            {!existingInvoice && (
              <>
                {/* Mission Summary */}
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px', mb: 3 }}>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em', mb: 1.5 }}>Mission Details</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography sx={{ fontSize: '0.55rem', color: 'text.tertiary', textTransform: 'uppercase' }}>Mission</Typography>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'monospace' }}>{selectedMission.mission_number}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography sx={{ fontSize: '0.55rem', color: 'text.tertiary', textTransform: 'uppercase' }}>Customer</Typography>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{selectedMission.customers?.customer_name || '—'}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography sx={{ fontSize: '0.55rem', color: 'text.tertiary', textTransform: 'uppercase' }}>Field</Typography>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{selectedMission.fields?.field_name || '—'}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography sx={{ fontSize: '0.55rem', color: 'text.tertiary', textTransform: 'uppercase' }}>Area</Typography>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{totals.area} ha</Typography>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Charges */}
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.03em', mb: 1.5 }}>Charges</Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6} sm={4}>
                    <TextField fullWidth size="small" label="Rate per Hectare (R)" type="number" value={charges.areaRate} onChange={e => setCharges(c => ({ ...c, areaRate: e.target.value }))} helperText={`${totals.area} ha × R${charges.areaRate}`} />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <TextField fullWidth size="small" label="Chemical Cost (R)" type="number" value={charges.chemicalCost} onChange={e => setCharges(c => ({ ...c, chemicalCost: e.target.value }))} />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <TextField fullWidth size="small" label="Travel Cost (R)" type="number" value={charges.travelCost} onChange={e => setCharges(c => ({ ...c, travelCost: e.target.value }))} />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <TextField fullWidth size="small" label="Other Charges (R)" type="number" value={charges.otherCharges} onChange={e => setCharges(c => ({ ...c, otherCharges: e.target.value }))} />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <TextField fullWidth size="small" label="Discount (R)" type="number" value={charges.discount} onChange={e => setCharges(c => ({ ...c, discount: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth size="small" label="Description" value={charges.description} onChange={e => setCharges(c => ({ ...c, description: e.target.value }))} />
                  </Grid>
                </Grid>

                {/* Totals */}
                <Paper sx={{ p: 2.5, borderRadius: '12px', bgcolor: 'rgba(15,23,42,0.02)', border: '1px solid rgba(15,23,42,0.06)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Subtotal</Typography>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{formatCurrency(totals.subtotal)}</Typography>
                  </Box>
                  {settings?.vat_registered && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>VAT ({totals.vatPct}%)</Typography>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{formatCurrency(totals.vatAmount)}</Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700 }}>Total</Typography>
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#16A34A' }}>{formatCurrency(totals.total)}</Typography>
                  </Box>
                </Paper>
              </>
            )}
          </Box>
        )}

        {/* STEP 2: Generated */}
        {step === 2 && generatedInvoice && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: 'rgba(22,163,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
              <CheckCircleIcon sx={{ fontSize: '2rem', color: '#16A34A' }} />
            </Box>
            <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, mb: 0.5 }}>Invoice Generated</Typography>
            <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', mb: 3 }}>
              {generatedInvoice.invoice_number}
            </Typography>
            <Paper sx={{ p: 3, borderRadius: '12px', bgcolor: 'rgba(15,23,42,0.02)', border: '1px solid rgba(15,23,42,0.06)', maxWidth: 360, mx: 'auto' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Invoice Number</Typography>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'monospace' }}>{generatedInvoice.invoice_number}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Total Amount</Typography>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#16A34A' }}>{formatCurrency(generatedInvoice.total_amount)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Status</Typography>
                <Chip label="Draft" size="small" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 700, bgcolor: 'rgba(15,23,42,0.06)', color: '#64748B' }} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Due Date</Typography>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{formatDate(generatedInvoice.due_date)}</Typography>
              </Box>
            </Paper>
          </Box>
        )}
      </Box>

      {/* Actions */}
      <Box sx={{ px: 4, py: 2.5, borderTop: '1px solid rgba(15,23,42,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
          {step === 2 ? 'Close' : 'Cancel'}
        </Button>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {step === 1 && !existingInvoice && (
            <>
              <Button onClick={() => { setStep(0); setSelectedMission(null); }} sx={{ color: 'text.secondary' }}>Back</Button>
              <Button
                variant="contained"
                onClick={handleGenerate}
                disabled={generating || totals.total <= 0}
                sx={{ minWidth: 140 }}
              >
                {generating ? 'Generating...' : 'Generate Invoice'}
              </Button>
            </>
          )}
          {step === 2 && (
            <Button variant="contained" onClick={handleFinish}>
              Done
            </Button>
          )}
        </Box>
      </Box>
    </Dialog>
  );
}
