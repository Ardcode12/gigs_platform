import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout.jsx';
import { Field } from '../components/Field.jsx';
import { Button } from '../components/Button.jsx';
import { Alert } from '../components/Alert.jsx';
import { MailIcon, LockIcon } from '../components/icons.jsx';
import { useFederationAuth } from '../context/FederationAuthContext.jsx';
import { readFederationError } from '../api/federationApi.js';

const REMEMBERED_EMAIL_KEY = 'federation.rememberedEmail';

/** Explains why the admin was returned to this screen. */
const REDIRECT_NOTICES = {
  expired: 'Your session has expired. Please sign in again.',
};

/**
 * Federation admin sign-in.
 *
 * Separate from the society login at /login: federation accounts live in their
 * own table and authenticate by email against /api/auth/federation/login, while
 * societies sign in with a society code.
 */
export default function FederationLoginPage() {
  const { signIn } = useFederationAuth();
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
    if (!form.email.trim()) errors.email = 'Email is required.';
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

      navigate(location.state?.from?.pathname ?? '/federation/dashboard', { replace: true });
    } catch (err) {
      setError(readFederationError(err, 'Unable to sign in. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Federation Access"
      title="Sign in to the Federation Console"
      description="For federation administrators who register and oversee cooperative societies."
    >
      <form className="auth__form" onSubmit={handleSubmit} noValidate>
        <Alert variant="warning">{notice}</Alert>
        <Alert variant="error">{error}</Alert>

        <Field
          label="Federation email"
          type="email"
          name="email"
          icon={MailIcon}
          placeholder="federation@workmat.local"
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
            Remember my email
          </label>
        </div>

        <Button type="submit" block loading={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>

        <p className="auth__meta">
          Managing a single society instead? <Link to="/login">Sign in to the Society Portal</Link>.
        </p>
      </form>
    </AuthLayout>
  );
}
