import { useId, useState } from 'react';
import { EyeIcon, EyeOffIcon } from './icons.jsx';

/**
 * Labelled text input with optional leading icon, inline error and hint.
 * Errors are wired via aria-describedby / aria-invalid so screen readers
 * announce them alongside the field.
 */
export function Field({
  label,
  type = 'text',
  error,
  hint,
  icon: Icon,
  className = '',
  ...inputProps
}) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword && revealed ? 'text' : type;

  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ');

  return (
    <div className={`field ${error ? 'field--invalid' : ''} ${className}`}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>

      <div className="field__control">
        {Icon && (
          <span className="field__icon">
            <Icon />
          </span>
        )}

        <input
          {...inputProps}
          id={id}
          type={inputType}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy || undefined}
          className={[
            'field__input',
            Icon ? 'field__input--with-icon' : '',
            isPassword ? 'field__input--with-action' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        />

        {isPassword && (
          <button
            type="button"
            className="field__toggle"
            onClick={() => setRevealed((value) => !value)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {revealed ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>

      {error && (
        <span className="field__error" id={errorId} role="alert">
          {error}
        </span>
      )}
      {hint && !error && (
        <span className="field__hint" id={hintId}>
          {hint}
        </span>
      )}
    </div>
  );
}
