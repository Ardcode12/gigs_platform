import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout.jsx';
import { Field } from '../components/Field.jsx';
import { Button } from '../components/Button.jsx';
import { Alert } from '../components/Alert.jsx';
import { LockIcon, ShieldIcon } from '../components/icons.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { readErrorMessage, readFieldErrors } from '../api/client.js';

const REMEMBERED_EMAIL_KEY = 'authority.rememberedEmail';

/** Explains why the officer was returned to this screen. */
const REDIRECT_NOTICES = {
  timeout: 'You were signed out after a period of inactivity. Please sign in again.',
  expired: 'Your session has expired. Please sign in again.',
};

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? '';

  const [form, setForm] = useState({ email: rememberedEmail, password: '' });
  const [remember, setRemember] = useState(Boolean(rememberedEmail));
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setNotice(REDIRECT_NOTICES[searchParams.get('reason')] ?? '');
  }, [searchParams]);

  const update = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    setError('');
  };

  function validate() {
    const errors = {};
    if (!form.email.trim()) errors.email = 'Society code is required.';
    if (!form.password) errors.password = 'Password is required.';
    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await signIn(form.email.trim(), form.password);

      if (remember) localStorage.setItem(REMEMBERED_EMAIL_KEY, form.email.trim());
      else localStorage.removeItem(REMEMBERED_EMAIL_KEY);

      // Return them to whatever they were trying to reach before the redirect.
      navigate(location.state?.from?.pathname ?? '/dashboard', { replace: true });
    } catch (err) {
      setFieldErrors(readFieldErrors(err));
      setError(readErrorMessage(err, 'Unable to sign in. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Society Access"
      title="Sign in to the Society Portal"
      description="Use the society code and password issued to you by the federation."
    >
      <form className="auth__form" onSubmit={handleSubmit} noValidate>
        <Alert variant="warning">{notice}</Alert>
        <Alert variant="error">{error}</Alert>

        <Field
          label="Society code"
          type="text"
          name="societyCode"
          icon={ShieldIcon}
          placeholder="SUNRISE01"
          autoComplete="username"
          autoFocus
          value={form.email}
          onChange={update('email')}
          error={fieldErrors.email}
          disabled={submitting}
        />

        <Field
          label="Password"
          type="password"
          name="password"
          icon={LockIcon}
          placeholder="Enter your password"
          autoComplete="current-password"
          value={form.password}
          onChange={update('password')}
          error={fieldErrors.password}
          disabled={submitting}
        />

        <div className="auth__row">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              disabled={submitting}
            />
            Remember my society code
          </label>

          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        <Button type="submit" block loading={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>

        <p className="auth__meta">
          Society accounts are registered by the federation. Contact your federation administrator
          if you need access, or <Link to="/federation/login">sign in as a federation admin</Link>.
        </p>
      </form>
    </AuthLayout>
  );
}
