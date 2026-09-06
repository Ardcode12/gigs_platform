export function Button({
  children,
  variant = 'primary',
  loading = false,
  block = false,
  disabled,
  className = '',
  ...props
}) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        'btn',
        `btn--${variant}`,
        block ? 'btn--block' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {loading && <span className={`spinner ${variant === 'primary' ? '' : 'spinner--dark'}`} />}
      {children}
    </button>
  );
}
