import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Grid, Button, Avatar, Chip, TextField, InputAdornment, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import PeopleIcon from '@mui/icons-material/People';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { getCustomers, searchCustomers, createCustomer, updateCustomer, deleteCustomer } from '../../services/customerService';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import CustomerForm from './CustomerForm';

const MotionBox = motion.create(Box);

export default function Customers() {
  const { company } = useAuth();
  const { showToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    if (!company?.id) return;
    try {
      const data = search
        ? await searchCustomers(company.id, search)
        : await getCustomers(company.id);
      setCustomers(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [company?.id, search, showToast]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleCreate = () => { setEditingCustomer(null); setFormOpen(true); };
  const handleEdit = (customer) => { setEditingCustomer(customer); setFormOpen(true); };

  const handleSave = async (formData) => {
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, formData);
        showToast('Customer updated successfully');
      } else {
        await createCustomer({ ...formData, company_id: company.id });
        showToast('Customer created successfully');
      }
      setFormOpen(false);
      fetchCustomers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCustomer(deleteTarget.id);
      showToast('Customer deleted');
      setDeleteTarget(null);
      fetchCustomers();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>Customers</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Manage farm owners and spray clients</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} size="large" onClick={handleCreate}>
            Add Customer
          </Button>
        </Box>

        {/* Search */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#FFFFFF' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.tertiary', fontSize: '1.2rem' }} /></InputAdornment>,
            }}
          />
        </Paper>

        {/* Content */}
        {!loading && customers.length === 0 ? (
          <Paper sx={{ bgcolor: '#FFFFFF' }}>
            <EmptyState
              icon={<PeopleIcon />}
              title="No customers yet"
              description="Create your first customer to start managing spray operations."
              actionLabel="Add Customer"
              onAction={handleCreate}
            />
          </Paper>
        ) : (
          <Grid container spacing={2.5}>
            {customers.map((customer, i) => (
              <Grid item xs={12} sm={6} lg={4} key={customer.id}>
                <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.03 }}>
                  <Paper sx={{ p: 3, bgcolor: '#FFFFFF', height: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar sx={{ width: 44, height: 44, bgcolor: 'primary.main', fontSize: '0.85rem', fontWeight: 700 }}>
                        {customer.customer_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.95rem', fontWeight: 600 }} noWrap>{customer.customer_name}</Typography>
                        {customer.contact_person && (
                          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }} noWrap>{customer.contact_person}</Typography>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton size="small" onClick={() => handleEdit(customer)}><EditIcon sx={{ fontSize: '1rem' }} /></IconButton>
                        <IconButton size="small" onClick={() => setDeleteTarget(customer)}><DeleteIcon sx={{ fontSize: '1rem', color: 'error.main' }} /></IconButton>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {customer.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon sx={{ fontSize: '0.85rem', color: 'text.tertiary' }} />
                          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{customer.phone}</Typography>
                        </Box>
                      )}
                      {customer.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon sx={{ fontSize: '0.85rem', color: 'text.tertiary' }} />
                          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }} noWrap>{customer.email}</Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </MotionBox>
              </Grid>
            ))}
          </Grid>
        )}
      </MotionBox>

      <CustomerForm open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSave} customer={editingCustomer} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Customer"
        message={`Are you sure you want to delete "${deleteTarget?.customer_name}"? This will also remove all associated farms and fields.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </Box>
  );
}
