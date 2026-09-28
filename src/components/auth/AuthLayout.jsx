'use client';

import { useRouter } from 'next/navigation';

// ========================================
// AUTH LAYOUT
//
// Shared two-panel shell (colored brand panel +
// white form panel) used by both /login and
// /register. Reads theme colors into CSS vars
// consumed by .auth-shell rules in globals.css.
// ========================================

export default function AuthLayout({
  theme,
  eyebrow,
  copy,
  shellClassName = '',
  formWrapClassName = '',
  maxWidthClassName = 'max-w-md',
  badgeOpacity = 0.18,
  children
}) {
  const router = useRouter();
  const BrandIcon = theme?.icon;

  return (
    <main
      className={`auth-shell ${shellClassName}`.trim()}
      style={{
        '--theme-accent': theme.hex,
        '--theme-accent-dark': theme.darkHex,
        '--theme-accent-soft': theme.softHex,
        '--theme-accent-border': theme.borderHex
      }}
    >
      {/* Left brand panel — colored per selected department */}
      <section className="auth-brand" style={{ backgroundColor: theme.hex }}>
        <img src="/logo.png" alt="E-Sagip" className="auth-logo" />
        <div className="mt-10 max-w-sm">
          <div className="eyebrow" style={{ color: '#fff' }}>
            {eyebrow}
          </div>

          <div
            className="brand-role-badge"
            style={{ backgroundColor: `rgba(255,255,255,${badgeOpacity})`, color: '#fff' }}
          >
            <BrandIcon className="h-3.5 w-3.5" />
            {theme.label}
          </div>

          <h1 className="mt-3 text-4xl font-bold tracking-tight" style={{ color: '#fff' }}>
            {copy.title}
          </h1>

          <p className="mt-4 text-sm leading-7" style={{ color: '#fff' }}>
            {copy.desc}
          </p>
        </div>
      </section>

      {/* Right form panel */}
      <section className={`auth-form-wrap ${formWrapClassName}`.trim()}>
        <div className={`w-full ${maxWidthClassName}`}>
          <button
            onClick={() => router.push('/')}
            className="mb-8 text-sm font-semibold text-gray-500 hover:text-gray-900"
          >
            ← Back to E-Sagip
          </button>

          {children}
        </div>
      </section>
    </main>
  );
}
