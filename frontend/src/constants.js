// =============================================
// GigMat Society Platform — Shared Constants
// All 10 Skilled Worker Categories
// =============================================

export const WORKER_CATEGORIES = [
  { id: 'electrician', label: 'Electrician', emoji: '⚡', color: '#F59E0B', bg: '#FEF3C7' },
  { id: 'plumber', label: 'Plumber', emoji: '🔧', color: '#0EA5E9', bg: '#E0F2FE' },
  { id: 'carpenter', label: 'Carpenter', emoji: '🪚', color: '#92400E', bg: '#FEF3C7' },
  { id: 'painter', label: 'Painter', emoji: '🎨', color: '#EC4899', bg: '#FCE7F3' },
  { id: 'domestic_helper', label: 'Domestic Helper', emoji: '🏠', color: '#8B5CF6', bg: '#EDE9FE' },
  { id: 'caregiver', label: 'Caregiver', emoji: '❤️', color: '#EF4444', bg: '#FEE2E2' },
  { id: 'driver', label: 'Driver', emoji: '🚗', color: '#6366F1', bg: '#E0E7FF' },
  { id: 'gardener', label: 'Gardener', emoji: '🌿', color: '#10B981', bg: '#D1FAE5' },
  { id: 'cleaner', label: 'Cleaner', emoji: '🧹', color: '#14B8A6', bg: '#CCFBF1' },
  { id: 'technician', label: 'Technician', emoji: '🔬', color: '#2563EB', bg: '#DBEAFE' },
];

export const KYC_STATUS = {
  PENDING: 'pending',
  VERIFYING: 'verifying',
  GOV_CERTIFIED: 'gov_certified',
  INSPECTION_REQUIRED: 'inspection_required',
  INSPECTION_PASSED: 'inspection_passed',
  REJECTED: 'rejected',
  ACTIVE: 'active',
};

export const JOB_STATUS = {
  PENDING: 'pending',
  DISPATCHED: 'dispatched',
  ON_THE_WAY: 'on_the_way',
  ARRIVED: 'arrived',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  ONLINE_PAID: 'online_paid',
  CASH_PAID: 'cash_paid',
  RECONCILED: 'reconciled',
  SPLIT_PENDING: 'split_pending',
  SPLIT_DONE: 'split_done',
};

export const WORKER_AVAILABILITY = {
  AVAILABLE: 'available',
  DISPATCHED: 'dispatched',
  ON_JOB: 'on_job',
  OFFLINE: 'offline',
};

export const COMPLAINT_STATUS = {
  OPEN: 'open',
  UNDER_REVIEW: 'under_review',
  RESOLVED: 'resolved',
  ESCALATED: 'escalated',
};

export const WELFARE_SCHEMES = [
  { id: 'pm_sym', name: 'PM-SYM Pension', description: 'Pradhan Mantri Shram Yogi Maandhan — ₹3,000/month pension on retirement', icon: '🏦', color: '#2563EB', bg: '#DBEAFE' },
  { id: 'accident_ins', name: 'Accident Insurance', description: 'Group accident coverage up to ₹5 Lakh', icon: '🛡️', color: '#10B981', bg: '#D1FAE5' },
  { id: 'health_card', name: 'Health Card (PMJAY)', description: 'Ayushman Bharat health card — ₹5 Lakh annual hospital cover', icon: '🏥', color: '#EF4444', bg: '#FEE2E2' },
  { id: 'tool_loan', name: 'Tool Loan Scheme', description: 'Low-interest loan up to ₹15,000 for tool purchase', icon: '🔧', color: '#F59E0B', bg: '#FEF3C7' },
];

export const AVATAR_COLORS = [
  '#2563EB', '#0EA5E9', '#10B981', '#8B5CF6', '#EF4444',
  '#F59E0B', '#EC4899', '#14B8A6', '#F97316', '#6366F1'
];

export const getAvatarColor = (name) => {
  const idx = name ? name.charCodeAt(0) % AVATAR_COLORS.length : 0;
  return AVATAR_COLORS[idx];
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const formatCurrency = (amount) =>
  `₹${(Number(amount) || 0).toLocaleString('en-IN')}`;

export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

export const getCategoryInfo = (id) =>
  WORKER_CATEGORIES.find(c => c.id === id) || WORKER_CATEGORIES[0];
