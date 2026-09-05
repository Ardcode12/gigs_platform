import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout.jsx';
import { Field } from '../components/Field.jsx';
import { Button } from '../components/Button.jsx';
import { Alert } from '../components/Alert.jsx';
import { LockIcon, ArrowLeftIcon } from '../components/icons.jsx';
import { authApi } from '../api/authApi.js';
import { readErrorMessage, readFieldErrors } from '../api/client.js';

/**
 * Supabase appends the recovery token to the URL fragment, e.g.
 *   /reset-password#access_token=...&type=recovery
 * The fragment never reaches the server, which is why the token is read here
 * and posted to the API explicitly.
 */
function readRecoveryToken() {
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  const fromHash = new URLSearchParams(hash);

  if (fromHash.get('error_description')) {
    return { token: null, error: fromHash.get('error_description') };
  }

  // Some Supabase configurations use a query string instead of a fragment.
  const fromQuery = new URLSearchParams(window.location.search);

  return {
    token: fromHash.get('access_token') ?? fromQuery.get('access_token'),
    error: null,
  };
}

const RULES = [
  { test: (v) => v.length >= 8, label: 'At least 8 characters' },
  { test: (v) => /[A-Z]/.test(v), label: 'One uppercase letter' },
  { test: (v) => /[a-z]/.test(v), label: 'One lowercase letter' },
  { test: (v) => /[0-9]/.test(v), label: 'One number' },
];

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const recovery = useMemo(readRecoveryToken, []);

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(recovery.error ?? '');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Strip the token from the address bar so it is not left in history.
  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const update = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    setError('');
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const errors = {};
    const failedRule = RULES.find((rule) => !rule.test(form.newPassword));
    if (!form.newPassword) errors.newPassword = 'A new password is required.';
    else if (failedRule) errors.newPassword = `Password must contain: ${failedRule.label.toLowerCase()}.`;
    if (form.newPassword !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await authApi.resetPassword({
        accessToken: recovery.token,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 2500);
    } catch (err) {
      setFieldErrors(readFieldErrors(err));
      setError(readErrorMessage(err, 'Could not update your password. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (!recovery.token) {
    return (
      <AuthLayout
        eyebrow="Password Recovery"
        title="This link is not valid"
        description="The reset link is missing, malformed or has already been used."
      >
        <div className="auth__form">
          <Alert variant="error">
            {recovery.error ?? 'Request a new password reset link and try again.'}
          </Alert>
          <Button variant="ghost" block onClick={() => navigate('/forgot-password')}>
            Request a new link
          </Button>
          <Link className="auth__back" to="/login">
            <ArrowLeftIcon width={15} height={15} />
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout eyebrow="Password Recovery" title="Password updated">
        <div className="auth__form">
          <Alert variant="success">
            Your password has been changed. Redirecting you to the sign-in screen…
          </Alert>
          <Link className="auth__back" to="/login">
            <ArrowLeftIcon width={15} height={15} />
            Go to sign in now
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Password Recovery"
      title="Set a new password"
      description="Choose a strong password you have not used on this portal before."
    >
      <form className="auth__form" onSubmit={handleSubmit} noValidate>
        <Alert variant="error">{error}</Alert>

        <Field
          label="New password"
          type="password"
          name="newPassword"
          icon={LockIcon}
          placeholder="Enter a new password"
          autoComplete="new-password"
          autoFocus
          value={form.newPassword}
          onChange={update('newPassword')}
          error={fieldErrors.newPassword}
          disabled={submitting}
        />

        <ul className="password-rules" aria-label="Password requirements">
          {RULES.map((rule) => {
            const met = rule.test(form.newPassword);
            return (
              <li key={rule.label} className={met ? 'is-met' : ''}>
                <span aria-hidden="true">{met ? '✓' : '•'}</span>
                {rule.label}
              </li>
            );
          })}
        </ul>

        <Field
          label="Confirm new password"
          type="password"
          name="confirmPassword"
          icon={LockIcon}
          placeholder="Re-enter the new password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={update('confirmPassword')}
          error={fieldErrors.confirmPassword}
          disabled={submitting}
        />

        <Button type="submit" block loading={submitting}>
          {submitting ? 'Updating…' : 'Update password'}
        </Button>

        <Link className="auth__back" to="/login">
          <ArrowLeftIcon width={15} height={15} />
          Back to sign in
        </Link>
      </form>
    </AuthLayout>
  );
}
