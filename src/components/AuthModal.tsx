import { Lock, UserPlus, X } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { loginWithPassword, registerAccount } from '../lib/api';
import type { SubscriptionOrder, UserProfile } from '../types';

interface AuthModalProps {
  open: boolean;
  initialMode: 'login' | 'register';
  onClose: () => void;
  onAuthenticated: (user: UserProfile, orders: SubscriptionOrder[]) => void;
}

function previewAge(dob: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const now = new Date();
  let age = now.getUTCFullYear() - y;
  if (now.getUTCMonth() + 1 < mo || (now.getUTCMonth() + 1 === mo && now.getUTCDate() < d)) {
    age -= 1;
  }
  return age >= 12 && age <= 115 ? age : null;
}

export function AuthModal({
  open,
  initialMode,
  onClose,
  onAuthenticated,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Registration state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDob, setRegDob] = useState('1984-06-15');
  const [regStudentId, setRegStudentId] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, open]);

  if (!open) return null;

  const computedPreviewAge = previewAge(regDob);
  const previewIsOver40 = computedPreviewAge !== null && computedPreviewAge >= 40;
  const previewIsStudent = /^PR-202[0-6]-\d{3}$/i.test(regStudentId.trim());
  const previewDiscountPct =
    previewIsOver40 && previewIsStudent ? 30 : previewIsOver40 ? 20 : previewIsStudent ? 15 : 0;

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await loginWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });
      onAuthenticated(res.user, res.orders);
      onClose();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegLoading(true);
    try {
      const res = await registerAccount({
        fullName: regFullName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        dob: regDob,
        studentId: regStudentId.trim() || undefined,
      });
      onAuthenticated(res.user, res.orders);
      onClose();
    } catch (err) {
      setRegError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-lg border border-[#E4E4E0] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E4E4E0] px-6 py-4">
          <div>
            <h2 id="auth-modal-title" className="font-display text-xl font-semibold text-[#141413]">
              {mode === 'login' ? 'Sign In to PR Academy' : 'Create Learner Account'}
            </h2>
            <p className="mt-0.5 text-xs text-[#78716C]">
              {mode === 'login'
                ? 'Access your subscriptions, seminar seats, and tuition concessions.'
                : 'Register with your email to enroll and apply eligible concessions.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close authentication modal"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[#57534E] hover:bg-[#F5F5F4] hover:text-[#141413] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="border-b border-[#E4E4E0] bg-[#FAFAF9] px-6 py-3">
          <div className="grid grid-cols-2 gap-1 rounded-md border border-[#E4E4E0] bg-[#EFEFED] p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`rounded px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-[#141413] shadow-xs'
                  : 'text-[#57534E] hover:text-[#141413]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`rounded px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-[#141413] shadow-xs'
                  : 'text-[#57534E] hover:text-[#141413]'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        <div className="p-6">
          {mode === 'login' ? (
            <div className="space-y-6">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-medium text-[#44403C] mb-1.5"
                  >
                    Email Address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="weiming.tan@example.sg"
                    className="w-full rounded-md border border-[#D6D3D1] bg-white px-3.5 py-2.5 text-sm text-[#141413] focus:border-[#141413] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-medium text-[#44403C] mb-1.5"
                  >
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-md border border-[#D6D3D1] bg-white px-3.5 py-2.5 text-sm text-[#141413] focus:border-[#141413] focus:outline-none"
                  />
                </div>

                {loginError && (
                  <div
                    role="alert"
                    className="rounded-md border border-[#FCA5A5] bg-[#FEF2F2] px-3.5 py-2.5 text-xs text-[#991B1B]"
                  >
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#141413] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#292524] disabled:opacity-60 transition-colors cursor-pointer"
                >
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  <span>{loginLoading ? 'Signing In...' : 'Sign In'}</span>
                </button>
              </form>

              <div className="border-t border-[#E4E4E0] pt-5">
                <p className="text-xs font-medium text-[#57534E] mb-2.5">
                  Returning Learner Quick-Fill (Demo Accounts · Password: <span className="font-mono">Pass1234!</span>)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('weiming.tan@example.sg');
                      setLoginPassword('Pass1234!');
                    }}
                    className="rounded-md border border-[#E4E4E0] bg-[#FAFAF9] px-3 py-2 text-left text-xs hover:border-[#141413] transition-colors cursor-pointer"
                  >
                    <div className="font-medium text-[#141413]">Tan Wei Ming</div>
                    <div className="text-[#78716C] tabular-nums">Age 45 · 20% Off</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('huiling.lim@example.sg');
                      setLoginPassword('Pass1234!');
                    }}
                    className="rounded-md border border-[#E4E4E0] bg-[#FAFAF9] px-3 py-2 text-left text-xs hover:border-[#141413] transition-colors cursor-pointer"
                  >
                    <div className="font-medium text-[#141413]">Lim Hui Ling</div>
                    <div className="text-[#78716C] tabular-nums">Alumni · 15% Off</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('rajesh.nair@example.sg');
                      setLoginPassword('Pass1234!');
                    }}
                    className="rounded-md border border-[#E4E4E0] bg-[#FAFAF9] px-3 py-2 text-left text-xs hover:border-[#141413] transition-colors cursor-pointer"
                  >
                    <div className="font-medium text-[#141413]">Dr. Rajesh Nair</div>
                    <div className="text-[#78716C] tabular-nums">Age 48 + Alumni · 30%</div>
                  </button>
                </div>
              </div>

              <div className="border-t border-[#E4E4E0] pt-4 text-center">
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-xs font-medium text-[#9F1239] hover:underline cursor-pointer"
                >
                  New to PR Academy? Create an account
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label htmlFor="reg-name" className="block text-xs font-medium text-[#44403C] mb-1">
                  Full Name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. Alex Tan"
                  className="w-full rounded-md border border-[#D6D3D1] bg-white px-3.5 py-2 text-sm text-[#141413] focus:border-[#141413] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-email" className="block text-xs font-medium text-[#44403C] mb-1">
                    Email Address
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@example.sg"
                    className="w-full rounded-md border border-[#D6D3D1] bg-white px-3.5 py-2 text-sm text-[#141413] focus:border-[#141413] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="reg-password" className="block text-xs font-medium text-[#44403C] mb-1">
                    Password (min. 8 chars)
                  </label>
                  <input
                    id="reg-password"
                    type="password"
                    required
                    minLength={8}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full rounded-md border border-[#D6D3D1] bg-white px-3.5 py-2 text-sm text-[#141413] focus:border-[#141413] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-dob" className="block text-xs font-medium text-[#44403C] mb-1">
                    Date of Birth
                  </label>
                  <input
                    id="reg-dob"
                    type="date"
                    required
                    value={regDob}
                    onChange={(e) => setRegDob(e.target.value)}
                    className="w-full rounded-md border border-[#D6D3D1] bg-white px-3.5 py-2 font-mono text-sm text-[#141413] focus:border-[#141413] focus:outline-none tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="reg-student-id" className="block text-xs font-medium text-[#44403C] mb-1">
                    Existing Student ID (Optional)
                  </label>
                  <input
                    id="reg-student-id"
                    type="text"
                    value={regStudentId}
                    onChange={(e) => setRegStudentId(e.target.value.toUpperCase())}
                    placeholder="e.g. PR-2024-089"
                    className="w-full rounded-md border border-[#D6D3D1] bg-white px-3.5 py-2 font-mono text-sm text-[#141413] focus:border-[#141413] focus:outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Concession Eligibility Readout */}
              <div className="rounded-md border border-[#E4E4E0] bg-[#FAFAF9] px-4 py-3 text-xs tabular-nums">
                <div className="flex items-center justify-between">
                  <span className="text-[#57534E]">
                    {computedPreviewAge !== null
                      ? `Age ${computedPreviewAge}${previewIsOver40 ? ' (>40 eligible)' : ''}`
                      : 'Enter Date of Birth'}
                  </span>
                  <span className="font-mono font-semibold text-[#9F1239]">
                    {previewDiscountPct}% tuition concession
                  </span>
                </div>
              </div>

              {regError && (
                <div
                  role="alert"
                  className="rounded-md border border-[#FCA5A5] bg-[#FEF2F2] px-3.5 py-2.5 text-xs text-[#991B1B]"
                >
                  {regError}
                </div>
              )}

              <button
                type="submit"
                disabled={regLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#9F1239] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#881337] disabled:opacity-60 transition-colors cursor-pointer"
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                <span>{regLoading ? 'Creating Account...' : 'Create Account & Sign In'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
