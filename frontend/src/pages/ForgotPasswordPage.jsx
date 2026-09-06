import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout.jsx';
import { Field } from '../components/Field.jsx';
import { Button } from '../components/Button.jsx';
import { Alert } from '../components/Alert.jsx';
import { MailIcon, ArrowLeftIcon } from '../components/icons.jsx';
import { authApi } from '../api/authApi.js';
import { readErrorMessage } from '../api/client.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!email.trim()) {
      setFieldError('Email is required.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setFieldError('Enter a valid email address.');
      return;
    }
    setFieldError('');

    setSubmitting(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(readErrorMessage(err, 'Could not send the reset link. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <AuthLayout
        eyebrow="Password Recovery"
        title="Check your inbox"
        description="If that email belongs to an authority account, a password reset link is on its way."
      >
        <div className="auth__form">
          <Alert variant="success">
            The link is valid for a limited time. If it does not arrive within a few minutes, check
            your spam folder or try again.
          </Alert>

          <Button variant="ghost" block onClick={() => setSent(false)}>
            Use a different email
          </Button>

          <Link className="auth__back" to="/login">
            <ArrowLeftIcon width={15} height={15} />
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Password Recovery"
      title="Reset your password"
      description="Enter your official email and we will send you a link to set a new password."
    >
      <form className="auth__form" onSubmit={handleSubmit} noValidate>
        <Alert variant="error">{error}</Alert>

        <Field
          label="Official email"
          type="email"
          name="email"
          icon={MailIcon}
          placeholder="officer@cooperative.gov.in"
          autoComplete="username"
          autoFocus
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setFieldError('');
          }}
          error={fieldError}
          disabled={submitting}
        />

        <Button type="submit" block loading={submitting}>
          {submitting ? 'Sending…' : 'Send reset link'}
        </Button>

        <Link className="auth__back" to="/login">
          <ArrowLeftIcon width={15} height={15} />
          Back to sign in
        </Link>
      </form>
    </AuthLayout>
  );
}
