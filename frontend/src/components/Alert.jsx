import { AlertIcon, CheckCircleIcon } from './icons.jsx';

const ICONS = {
  error: AlertIcon,
  warning: AlertIcon,
  info: AlertIcon,
  success: CheckCircleIcon,
};

/**
 * Inline status message. Errors use role="alert" so they interrupt and are
 * announced immediately; softer variants use a polite live region.
 */
export function Alert({ variant = 'info', children }) {
  if (!children) return null;

  const Icon = ICONS[variant] ?? AlertIcon;
  const assertive = variant === 'error';

  return (
    <div
      className={`alert alert--${variant}`}
      role={assertive ? 'alert' : 'status'}
      aria-live={assertive ? 'assertive' : 'polite'}
    >
      <span className="alert__icon">
        <Icon width={16} height={16} />
      </span>
      <span>{children}</span>
    </div>
  );
}
