import { ShieldIcon, ShieldCheckIcon, ChartIcon, UsersIcon, BuildingIcon } from './icons.jsx';

const HIGHLIGHTS = [
  { icon: BuildingIcon, text: 'Register, review and monitor cooperative societies' },
  { icon: ShieldCheckIcon, text: 'Verify worker profiles and certifications submitted by societies' },
  { icon: UsersIcon, text: 'Track compliance, welfare and grievance resolution' },
  { icon: ChartIcon, text: 'Geo-spatial analytics and AI-driven demand forecasting' },
];

/**
 * Shared shell for every authentication screen: a fixed brand panel on the
 * left describing the authority's remit, and the form on the right.
 */
export function AuthLayout({ eyebrow, title, description, children }) {
  return (
    <div className="auth">
      <aside className="auth__brand">
        <div className="auth__logo">
          <span className="auth__logo-mark">
            <ShieldIcon width={24} height={24} />
          </span>
          <span className="auth__logo-text">
            <strong>Authority Portal</strong>
            <span>Cooperative Service Marketplace</span>
          </span>
        </div>

        <div>
          <h1 className="auth__headline">The governance layer of the cooperative marketplace.</h1>
          <p className="auth__subhead">
            Societies onboard and manage their own workforce. The authority approves societies,
            verifies workers and certifications, and oversees compliance, quality and welfare
            across the region.
          </p>

          <ul className="auth__points">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li className="auth__point" key={text}>
                <span className="auth__point-icon">
                  <Icon width={15} height={15} />
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="auth__footnote">
          Restricted system. Access is limited to authorised government officers and all activity
          is logged.
        </p>
      </aside>

      <main className="auth__panel">
        <div className="auth__form-wrap">
          {/* The brand panel is hidden on small screens, so the portal still
              needs to identify itself there. */}
          <div className="auth__mobile-brand">
            <span className="auth__mobile-mark">
              <ShieldIcon width={18} height={18} />
            </span>
            <span>
              <strong>Authority Portal</strong>
              <small>Cooperative Service Marketplace</small>
            </span>
          </div>

          {eyebrow && (
            <span className="auth__eyebrow">
              <ShieldIcon width={13} height={13} />
              {eyebrow}
            </span>
          )}
          <h2 className="auth__title">{title}</h2>
          {description && <p className="auth__description">{description}</p>}
          {children}
        </div>
      </main>
    </div>
  );
}
