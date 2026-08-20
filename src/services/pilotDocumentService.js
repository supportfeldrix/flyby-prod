import { supabase } from '../lib/supabase';

const STORAGE_BUCKET = 'pilot-documents';

// ─── Document Type Definitions ──────────────────────────────────────────────

export const DOCUMENT_TYPES = [
  { value: 'pilot_licence', label: 'Pilot Licence', mandatory: true, hasExpiry: true },
  { value: 'medical_certificate', label: 'Medical Certificate', mandatory: true, hasExpiry: true },
  { value: 'remote_pilot_licence', label: 'Remote Pilot Licence (RPL)', mandatory: true, hasExpiry: true },
  { value: 'operator_certificate', label: 'Operator Certificate', mandatory: false, hasExpiry: true },
  { value: 'training_records', label: 'Training Records', mandatory: false, hasExpiry: false },
  { value: 'insurance_certificate', label: 'Insurance Certificate', mandatory: false, hasExpiry: true },
  { value: 'identity_document', label: 'Identity Document', mandatory: false, hasExpiry: true },
  { value: 'other', label: 'Other Documents', mandatory: false, hasExpiry: false },
];

export const MANDATORY_TYPES = DOCUMENT_TYPES.filter(d => d.mandatory).map(d => d.value);

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getDocumentTypeLabel(type) {
  return DOCUMENT_TYPES.find(d => d.value === type)?.label || type;
}

export function getDocumentTypeConfig(type) {
  return DOCUMENT_TYPES.find(d => d.value === type) || DOCUMENT_TYPES[DOCUMENT_TYPES.length - 1];
}

/**
 * Calculate document status from expiry date (client-side mirror of DB trigger).
 */
export function calculateDocumentStatus(expiryDate) {
  if (!expiryDate) return 'valid';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const daysRemaining = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) return 'expired';
  if (daysRemaining <= 30) return 'expiring_soon';
  return 'valid';
}

/**
 * Calculate days remaining until expiry.
 */
export function getDaysRemaining(expiryDate) {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
}

/**
 * Build the storage path for a document.
 */
function buildStoragePath(companyId, pilotId, documentType, fileName) {
  return `${companyId}/${pilotId}/${documentType}/${Date.now()}_${fileName}`;
}

// ─── CRUD Operations ────────────────────────────────────────────────────────

/**
 * Get all documents for a pilot.
 */
export async function getPilotDocuments(pilotId) {
  const { data, error } = await supabase
    .from('pilot_documents')
    .select('*')
    .eq('pilot_id', pilotId)
    .order('document_type')
    .order('uploaded_at', { ascending: false });
  if (error) throw new Error(`Failed to fetch pilot documents: ${error.message}`);
  return data || [];
}

/**
 * Upload a new document for a pilot.
 */
export async function uploadDocument({ file, pilotId, companyId, documentType, documentName, issueDate, expiryDate, notes, userId, userName }) {
  // Validate file
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}. Allowed: PDF, PNG, JPG`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum: 25 MB`);
  }

  // Build storage path
  const storagePath = buildStoragePath(companyId, pilotId, documentType, file.name);

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });
  if (uploadError) throw new Error(`File upload failed: ${uploadError.message}`);

  // Insert document record via RPC (bypasses RLS issues)
  const { data, error: insertError } = await supabase.rpc('insert_pilot_document', {
    p_company_id: companyId,
    p_pilot_id: pilotId,
    p_document_type: documentType,
    p_document_name: documentName || getDocumentTypeLabel(documentType),
    p_file_name: file.name,
    p_storage_path: storagePath,
    p_file_size: file.size,
    p_mime_type: file.type,
    p_issue_date: issueDate || null,
    p_expiry_date: expiryDate || null,
    p_notes: notes || null,
    p_uploaded_by: userId || null,
    p_uploaded_by_name: userName || null,
  });

  if (insertError) {
    // Cleanup uploaded file on DB failure
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    throw new Error(`Failed to save document record: ${insertError.message}`);
  }

  if (data?.error) {
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    throw new Error(data.error);
  }

  return data;
}

/**
 * Replace an existing document (uploads new file, deletes old).
 */
export async function replaceDocument(documentId, { file, issueDate, expiryDate, notes, userId, userName }) {
  // Get existing document
  const { data: existing, error: fetchErr } = await supabase
    .from('pilot_documents')
    .select('*')
    .eq('id', documentId)
    .single();
  if (fetchErr) throw new Error(`Document not found: ${fetchErr.message}`);

  // Validate file
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}. Allowed: PDF, PNG, JPG`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum: 25 MB`);
  }

  // Upload new file
  const newPath = buildStoragePath(existing.company_id, existing.pilot_id, existing.document_type, file.name);
  const { error: uploadErr } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(newPath, file, { contentType: file.type });
  if (uploadErr) throw new Error(`File upload failed: ${uploadErr.message}`);

  // Update record
  const { data, error: updateErr } = await supabase
    .from('pilot_documents')
    .update({
      file_name: file.name,
      storage_path: newPath,
      file_size: file.size,
      mime_type: file.type,
      issue_date: issueDate !== undefined ? issueDate : existing.issue_date,
      expiry_date: expiryDate !== undefined ? expiryDate : existing.expiry_date,
      notes: notes !== undefined ? notes : existing.notes,
      uploaded_by: userId,
      uploaded_by_name: userName,
      uploaded_at: new Date().toISOString(),
    })
    .eq('id', documentId)
    .select()
    .single();

  if (updateErr) {
    // Cleanup new file on failure
    await supabase.storage.from(STORAGE_BUCKET).remove([newPath]);
    throw new Error(`Failed to update document: ${updateErr.message}`);
  }

  // Delete old file from storage
  await supabase.storage.from(STORAGE_BUCKET).remove([existing.storage_path]);

  return data;
}

/**
 * Delete a document (removes file from storage and record from DB).
 */
export async function deleteDocument(documentId) {
  // Get document to find storage path
  const { data: doc, error: fetchErr } = await supabase
    .from('pilot_documents')
    .select('storage_path')
    .eq('id', documentId)
    .single();
  if (fetchErr) throw new Error(`Document not found: ${fetchErr.message}`);

  // Delete from storage
  await supabase.storage.from(STORAGE_BUCKET).remove([doc.storage_path]);

  // Delete record
  const { error: deleteErr } = await supabase
    .from('pilot_documents')
    .delete()
    .eq('id', documentId);
  if (deleteErr) throw new Error(`Failed to delete document: ${deleteErr.message}`);
}

/**
 * Download a document — returns a signed URL.
 */
export async function downloadDocument(storagePath) {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, 300); // 5 minutes
  if (error) throw new Error(`Failed to generate download URL: ${error.message}`);
  return data.signedUrl;
}

/**
 * Get a preview URL for a document.
 */
export async function getDocumentPreviewUrl(storagePath) {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, 600); // 10 minutes
  if (error) throw new Error(`Failed to generate preview URL: ${error.message}`);
  return data.signedUrl;
}

// ─── Compliance ─────────────────────────────────────────────────────────────

/**
 * Calculate pilot compliance from their documents (client-side).
 */
export function calculateCompliance(documents) {
  const mandatoryDocs = MANDATORY_TYPES.map(type => {
    const doc = documents.find(d => d.document_type === type);
    return {
      type,
      label: getDocumentTypeLabel(type),
      uploaded: !!doc,
      status: doc ? doc.status : 'not_uploaded',
      expiry_date: doc?.expiry_date || null,
      days_remaining: doc?.expiry_date ? getDaysRemaining(doc.expiry_date) : null,
    };
  });

  const validCount = mandatoryDocs.filter(d => d.status === 'valid' || d.status === 'expiring_soon').length;
  const totalDocuments = documents.length;
  const validDocuments = documents.filter(d => d.status === 'valid' || d.status === 'expiring_soon').length;
  const expiredDocuments = documents.filter(d => d.status === 'expired').length;
  const expiringDocuments = documents.filter(d => d.status === 'expiring_soon').length;

  return {
    compliant: validCount >= MANDATORY_TYPES.length,
    mandatoryDocs,
    validCount,
    totalMandatory: MANDATORY_TYPES.length,
    totalDocuments,
    validDocuments,
    expiredDocuments,
    expiringDocuments,
  };
}

/**
 * Check pilot compliance via the database RPC (server-side, used for dispatch).
 */
export async function checkPilotCompliance(pilotId) {
  const { data, error } = await supabase.rpc('check_pilot_compliance', {
    p_pilot_id: pilotId,
  });
  if (error) throw new Error(`Compliance check failed: ${error.message}`);
  return data;
}

/**
 * Get all pilots with expiring/expired documents for dashboard alerts.
 */
export async function getComplianceAlerts(companyId) {
  const { data, error } = await supabase
    .from('pilot_documents')
    .select('*, pilots(first_name, last_name, display_name)')
    .eq('company_id', companyId)
    .in('status', ['expired', 'expiring_soon'])
    .order('expiry_date');
  if (error) throw new Error(`Failed to fetch compliance alerts: ${error.message}`);

  return (data || []).map(doc => ({
    ...doc,
    pilot_name: doc.pilots?.display_name || `${doc.pilots?.first_name} ${doc.pilots?.last_name}`,
    days_remaining: getDaysRemaining(doc.expiry_date),
    message: doc.status === 'expired'
      ? `${getDocumentTypeLabel(doc.document_type)} has expired`
      : `${getDocumentTypeLabel(doc.document_type)} expires in ${getDaysRemaining(doc.expiry_date)} days`,
  }));
}
