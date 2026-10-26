'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { THEMES, EMAIL_PLACEHOLDER } from '../../lib/themes';
import { loginUser } from '../../lib/auth';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import DepartmentPicker from '../../components/auth/dpt';

// Marketing copy shown on the left brand panel, keyed by selected department.
const BRAND_COPY = {
  fire: {
    title: 'Fire emergency access.',
    desc: 'Manage fire calls, coordinate engine dispatch, and track incidents in real time.'
  },
  medical: {
    title: 'Medical response access.',
    desc: 'Triage calls, dispatch responders, and monitor ongoing medical incidents.'
  },
  rescue: {
    title: 'Rescue response access.',
    desc: 'Coordinate rescue units, monitor emergencies, and track response status.'
  }
};

const DEFAULT_COPY = {
  title: 'Welcome back.',
  desc: 'Sign in to manage emergency calls, dispatch units, view the tactical map, and maintain incident records.'
};

export default function LoginPage() {
  const router = useRouter();

  const [role, setRole] = useState('fire'); // which department tile is selected on the login form
  const [registered, setRegistered] = useState(false); // shows a "account created" banner if redirected from registration
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const selectedTheme = THEMES[role] || THEMES.fire;
  const copy = BRAND_COPY[role] || DEFAULT_COPY;

  // Reads query params on mount to pre-select a department (?department=fire) and
  // show the "registered" success banner (?registered=1) — both set by the register page's redirect.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const department = params.get('department');
    if (THEMES[department]) setRole(department);
    setRegistered(params.get('registered') === '1');
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError('');

    if (!role) return setError('Please select your dispatch department.');

    const result = await loginUser({ email, password, role });
    if (result.error) return setError(result.error);

    router.push('/dashboard');
  }

  return (
    <AuthLayout theme={selectedTheme} eyebrow="Operator access" copy={copy}>
      <div className="eyebrow" style={{ color: 'var(--theme-accent)' }}>
        Operator access
      </div>

      <h2 className="mt-2 text-3xl font-bold">Sign in</h2>
      <p className="mt-2 text-sm text-gray-500">
        Choose the dispatch department assigned to your operator account.
      </p>

      {registered && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          Registration submitted. Your operator account must be approved by an administrator before you can sign in.
        </div>
      )}

      <form onSubmit={submit} className="mt-7 space-y-5">
        <div>
          <label className="field-label">Dispatch department</label>
          <DepartmentPicker value={role} onChange={setRole} variant="grid" />
        </div>

        <div>
          <label className="field-label">Email address</label>
          <input
            className="field"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={EMAIL_PLACEHOLDER}
          />
        </div>

        <div>
          <label className="field-label">Password</label>
          <div className="relative">
            <input
              className="field pr-11"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          className={`primary-btn w-full ${role ? 'text-white' : 'text-gray-500 cursor-not-allowed'}`}
          style={{
            backgroundColor: role ? selectedTheme.hex : '#D1D5DB',
            boxShadow: role ? `0 6px 18px ${selectedTheme.hex}33` : 'none'
          }}
          disabled={!role}
        >
          Login to E-Sagip <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        No account yet?{' '}
        <button onClick={() => router.push('/register')} className="font-semibold text-gray-900 hover:underline">
          Register
        </button>
      </p>
    </AuthLayout>
  );
}
