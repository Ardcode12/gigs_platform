/** Small formatting helpers used across screens. */
import { t } from '../i18n';

export const formatRupees = (amount, { decimals = 0 } = {}) => {
  const value = Number(amount ?? 0);
  return `₹${value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

export const initialsOf = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

export const formatDistance = (km) => {
  if (km == null) return null;
  return km < 1 ? t('unit.metres', { value: Math.round(km * 1000) }) : t('unit.km', { value: km.toFixed(1) });
};

export const formatEta = (minutes) => (minutes == null ? null : t('unit.min', { value: minutes }));

export const formatTime = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : '';

export const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

/** "just now", "12 min ago", "3 h ago", then a date. */
export const timeAgo = (iso) => {
  if (!iso) return '';
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return t('time.justNow');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t('time.minAgo', { value: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('time.hourAgo', { value: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t('time.dayAgo', { value: days });
  return formatDate(iso);
};

/** Groups a dated list into "Today" / "Yesterday" / a date label. */
export const dayLabel = (iso) => {
  if (!iso) return '';
  const then = new Date(iso);
  const today = new Date();
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(today) - startOfDay(then)) / 86400000);
  if (diffDays === 0) return t('time.today');
  if (diffDays === 1) return t('time.yesterday');
  return formatDate(iso);
};
