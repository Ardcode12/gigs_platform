import { useCallback, useEffect, useState } from 'react';
import { Button } from '../components/Button.jsx';
import { Field } from '../components/Field.jsx';
import { Alert } from '../components/Alert.jsx';
import { ShieldIcon, LogOutIcon } from '../components/icons.jsx';
import { useFederationAuth } from '../context/FederationAuthContext.jsx';
import { federationApi, readFederationError } from '../api/federationApi.js';
import '../styles/dashboard.css';

const EMPTY_FORM = { name: '', city: '', societyCode: '', password: '' };

/**
 * Federation admin console.
 *
 * Scoped to what a federation token is actually allowed to do -- list and
 * register societies. Every /api/society/* route belongs to the society portal
 * and rejects this token, so none of it appears here.
 */
export default function FederationDashboardPage() {
  const { user, signOut } = useFederationAuth();

  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadSocieties = useCallback(async () => {
    setLoading(true);
    try {
      setSocieties(await federationApi.listSocieties());
      setLoadError('');
    } catch (err) {
      setLoadError(readFederationError(err, 'Could not load societies.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSocieties();
  }, [loadSocieties]);

  const update = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    setFormError('');
  };

  function validate() {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Society name is required.';
    if (!form.societyCode.trim()) errors.societyCode = 'Society code is required.';
    if (!form.password) errors.password = 'A first password is required.';
    return errors;
  }

  async function handleCreate(event) {
    event.preventDefault();
    setFormError('');
    setSuccess('');

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const created = await federationApi.createSociety({
        name: form.name.trim(),
        city: form.city.trim() || null,
        societyCode: form.societyCode.trim(),
        password: form.password,
      });
      setSuccess(
        `${created.name} registered. It can now sign in at /login with code "${created.societyCode}".`
      );
      setForm(EMPTY_FORM);
      await loadSocieties();
    } catch (err) {
      setFormError(readFederationError(err, 'Could not register the society.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="shell">
      <header className="shell__header">
        <div className="shell__brand">
          <span className="shell__mark">
            <ShieldIcon width={20} height={20} />
          </span>
          <span>
            <strong>Federation Console</strong>
            <small>Cooperative Service Marketplace</small>
          </span>
        </div>

        <div className="shell__user">
          <span className="shell__avatar" aria-hidden="true">
            {user?.name?.charAt(0).toUpperCase() ?? 'F'}
          </span>
          <span className="shell__identity">
            <strong>{user?.name}</strong>
            <small>{user?.email}</small>
          </span>
          <Button variant="ghost" onClick={signOut}>
            <LogOutIcon width={16} height={16} />
            Sign out
          </Button>
        </div>
      </header>

      <main className="shell__main">
        <section className="panel">
          <h1 className="panel__title">Registered societies</h1>
          <p className="panel__subtitle">
            Societies you register here sign in to the Society Portal with their own code.
          </p>

          <Alert variant="error">{loadError}</Alert>

          {loading ? (
            <p className="panel__empty">Loading societies…</p>
          ) : societies.length === 0 ? (
            <p className="panel__empty">
              No societies registered yet. Use the form below to add the first one.
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Society</th>
                  <th scope="col">Code</th>
                  <th scope="col">City</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {societies.map((society) => (
                  <tr key={society.id}>
                    <td>{society.name}</td>
                    <td className="table__mono">{society.societyCode}</td>
                    <td>{society.city ?? '--'}</td>
                    <td>
                      <span
                        className={`badge ${society.isActive ? 'badge--success' : 'badge--muted'}`}
                      >
                        {society.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="panel">
          <h2 className="panel__heading">Register a society</h2>
          <p className="panel__note">
            The code and password you set here are the society&apos;s first sign-in credentials.
          </p>

          <form className="auth__form" onSubmit={handleCreate} noValidate>
            <Alert variant="success">{success}</Alert>
            <Alert variant="error">{formError}</Alert>

            <Field
              label="Society name"
              name="name"
              placeholder="Sunrise Workers Cooperative"
              value={form.name}
              onChange={update('name')}
              error={fieldErrors.name}
              disabled={submitting}
            />

            <Field
              label="City"
              name="city"
              placeholder="Noida"
              hint="Optional."
              value={form.city}
              onChange={update('city')}
              error={fieldErrors.city}
              disabled={submitting}
            />

            <Field
              label="Society code"
              name="societyCode"
              placeholder="SUNRISE01"
              hint="What the society types to sign in. Must be unique."
              value={form.societyCode}
              onChange={update('societyCode')}
              error={fieldErrors.societyCode}
              disabled={submitting}
            />

            <Field
              label="First password"
              type="password"
              name="password"
              placeholder="Set an initial password"
              autoComplete="new-password"
              value={form.password}
              onChange={update('password')}
              error={fieldErrors.password}
              disabled={submitting}
            />

            <Button type="submit" loading={submitting}>
              {submitting ? 'Registering…' : 'Register society'}
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}
