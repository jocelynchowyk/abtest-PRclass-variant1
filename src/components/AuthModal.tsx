import { CheckCircle2, Lock, ShieldCheck, UserCheck, X } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import {
  loginWithPassword,
  loginWithSingpassToken,
  registerWithSingpass,
  verifySingpassMyinfo,
} from '../lib/api';
import type {
  SingpassPersona,
  SingpassVerificationResult,
  SubscriptionOrder,
  UserProfile,
} from '../types';

interface AuthModalProps {
  open: boolean;
  initialMode: 'login' | 'register';
  personas: SingpassPersona[];
  onClose: () => void;
  onAuthenticated: (user: UserProfile, orders: SubscriptionOrder[]) => void;
}

export function AuthModal({
  open,
  initialMode,
  personas,
  onClose,
  onAuthenticated,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Login state
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Singpass Myinfo verification state
  const [spFullName, setSpFullName] = useState('Tan Wei Ming');
  const [spNric, setSpNric] = useState('S8145920D');
  const [spDob, setSpDob] = useState('1981-04-12');
  const [spStudentId, setSpStudentId] = useState('');
  const [spError, setSpError] = useState<string | null>(null);
  const [spLoading, setSpLoading] = useState(false);
  const [verifiedData, setVerifiedData] = useState<SingpassVerificationResult | null>(null);

  // Registration Step 2 state
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, open]);

  if (!open) return null;

  const applyPersona = (persona: SingpassPersona) => {
    setSpFullName(persona.fullName);
    setSpNric(persona.nric);
    setSpDob(persona.dob);
    setSpStudentId(persona.studentId || '');
    setRegEmail(persona.email);
    setVerifiedData(null);
    setSpError(null);
    setRegError(null);
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await loginWithPassword({
        identifier: identifier.trim(),
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

  const handleSingpassVerify = async (e: FormEvent) => {
    e.preventDefault();
    setSpError(null);
    setRegError(null);
    setSpLoading(true);
    try {
      const result = await verifySingpassMyinfo({
        fullName: spFullName,
        nric: spNric,
        dob: spDob,
        studentId: spStudentId || undefined,
      });
      setVerifiedData(result);
      if (result.existingAccountEmail && !regEmail) {
        setRegEmail(result.existingAccountEmail);
      }
    } catch (err) {
      setSpError(err instanceof Error ? err.message : 'Singpass verification failed.');
    } finally {
      setSpLoading(false);
    }
  };

  const handleQuickSingpassSignIn = async () => {
    if (!verifiedData) return;
    setRegError(null);
    setRegLoading(true);
    try {
      const res = await loginWithSingpassToken(verifiedData.verificationToken);
      onAuthenticated(res.user, res.orders);
      onClose();
    } catch (err) {
      setRegError(
        err instanceof Error ? err.message : 'Could not sign in with Singpass.'
      );
    } finally {
      setRegLoading(false);
    }
  };

  const handleCompleteRegistration = async (e: FormEvent) => {
    e.preventDefault();
    if (!verifiedData) return;
    setRegError(null);
    setRegLoading(true);
    try {
      const res = await registerWithSingpass({
        verificationToken: verifiedData.verificationToken,
        email: regEmail.trim(),
        password: regPassword,
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
      <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-lg border border-[#E4E4E0] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E4E4E0] px-6 py-4">
          <div>
            <h2 id="auth-modal-title" className="font-display text-xl font-semibold text-[#141413]">
              {mode === 'login' ? 'Sign In to PR Academy' : 'Register via Singpass Myinfo'}
            </h2>
            <p className="mt-0.5 text-xs text-[#78716C]">
              {mode === 'login'
                ? 'Access your subscriptions, seminar seats, and verified concessions.'
                : 'Automated age verification for Over-40 and Existing Student concessions.'}
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
              Register with Singpass
            </button>
          </div>
        </div>

        <div className="p-6">
          {mode === 'login' ? (
            <div className="space-y-6">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="login-identifier"
                    className="block text-xs font-medium text-[#44403C] mb-1.5"
                  >
                    Email Address or NRIC
                  </label>
                  <input
                    id="login-identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="weiming.tan@example.sg or S8145920D"
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
                  className="w-full rounded-md bg-[#141413] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#292524] disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {loginLoading ? 'Signing In...' : 'Sign In'}
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
                      setIdentifier('weiming.tan@example.sg');
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
                      setIdentifier('huiling.lim@example.sg');
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
                      setIdentifier('rajesh.nair@example.sg');
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
                  className="text-xs font-medium text-[#C8102E] hover:underline cursor-pointer"
                >
                  New to PR Academy? Register with Singpass for automated age verification
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Step 1: Singpass Myinfo Verification */}
              <div className="rounded-md border border-[#E4E4E0] bg-[#FAFAF9] p-4">
                <div className="flex items-center justify-between gap-4 border-b border-[#E4E4E0] pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-[#C8102E]" aria-hidden="true" />
                    <span className="text-sm font-semibold text-[#141413]">
                      Singpass Myinfo Identity & Age Verification
                    </span>
                  </div>
                  <span className="font-mono text-xs font-medium text-[#C8102E]">
                    singpass
                  </span>
                </div>

                {/* Preset Myinfo Test Profiles */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-[#57534E] mb-2">
                    Select a Singpass Myinfo Applicant Profile (or enter custom details below):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {personas.map((persona) => (
                      <button
                        key={persona.id}
                        type="button"
                        onClick={() => applyPersona(persona)}
                        className={`rounded-md border p-2.5 text-left text-xs transition-colors cursor-pointer ${
                          spNric === persona.nric && spDob === persona.dob
                            ? 'border-[#C8102E] bg-white'
                            : 'border-[#E4E4E0] bg-white hover:border-[#A8A29E]'
                        }`}
                      >
                        <div className="font-medium text-[#141413]">{persona.fullName}</div>
                        <div className="mt-0.5 text-[#78716C]">{persona.note}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSingpassVerify} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="sp-name" className="block text-xs font-medium text-[#44403C] mb-1">
                        Legal Full Name (Myinfo)
                      </label>
                      <input
                        id="sp-name"
                        type="text"
                        required
                        value={spFullName}
                        onChange={(e) => {
                          setSpFullName(e.target.value);
                          setVerifiedData(null);
                        }}
                        className="w-full rounded-md border border-[#D6D3D1] bg-white px-3 py-2 text-sm text-[#141413] focus:border-[#141413] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="sp-nric" className="block text-xs font-medium text-[#44403C] mb-1">
                        NRIC / FIN
                      </label>
                      <input
                        id="sp-nric"
                        type="text"
                        required
                        value={spNric}
                        onChange={(e) => {
                          setSpNric(e.target.value.toUpperCase());
                          setVerifiedData(null);
                        }}
                        placeholder="S8145920D"
                        className="w-full rounded-md border border-[#D6D3D1] bg-white px-3 py-2 font-mono text-sm text-[#141413] focus:border-[#141413] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="sp-dob" className="block text-xs font-medium text-[#44403C] mb-1">
                        Date of Birth (Verified for Over-40)
                      </label>
                      <input
                        id="sp-dob"
                        type="date"
                        required
                        value={spDob}
                        onChange={(e) => {
                          setSpDob(e.target.value);
                          setVerifiedData(null);
                        }}
                        className="w-full rounded-md border border-[#D6D3D1] bg-white px-3 py-2 font-mono text-sm text-[#141413] focus:border-[#141413] focus:outline-none tabular-nums"
                      />
                    </div>
                    <div>
                      <label htmlFor="sp-student-id" className="block text-xs font-medium text-[#44403C] mb-1">
                        Existing Student ID (Optional)
                      </label>
                      <input
                        id="sp-student-id"
                        type="text"
                        value={spStudentId}
                        onChange={(e) => {
                          setSpStudentId(e.target.value.toUpperCase());
                          setVerifiedData(null);
                        }}
                        placeholder="e.g. PR-2024-089"
                        className="w-full rounded-md border border-[#D6D3D1] bg-white px-3 py-2 font-mono text-sm text-[#141413] focus:border-[#141413] focus:outline-none"
                      />
                    </div>
                  </div>

                  {spError && (
                    <div
                      role="alert"
                      className="rounded-md border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-xs text-[#991B1B]"
                    >
                      {spError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={spLoading}
                    className="w-full rounded-md bg-[#C8102E] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#A50D26] disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {spLoading
                      ? 'Verifying Myinfo & Computing Age...'
                      : 'Authorize Singpass Myinfo & Verify Age'}
                  </button>
                </form>
              </div>

              {/* Automated Age Verification Result & Step 2 */}
              {verifiedData && (
                <div className="space-y-4 rounded-md border border-[#141413] bg-white p-5">
                  <div className="flex items-start justify-between gap-3 border-b border-[#ECECE8] pb-3">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#15803D]" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-semibold text-[#141413]">
                          Singpass Myinfo Verified · {verifiedData.fullName}
                        </p>
                        <p className="mt-0.5 text-xs text-[#57534E] font-mono tabular-nums">
                          NRIC {verifiedData.maskedNric} · DOB {verifiedData.dob} · Verified Age{' '}
                          {verifiedData.concession.age}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Automated Concession Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="rounded border border-[#ECECE8] bg-[#FAFAF9] p-3">
                      <div className="text-[#78716C]">Over-40 Check</div>
                      <div className="mt-1 font-semibold text-[#141413] tabular-nums">
                        {verifiedData.concession.isOver40
                          ? `Eligible (Age ${verifiedData.concession.age} ≥ 40)`
                          : `Standard (Age ${verifiedData.concession.age} < 40)`}
                      </div>
                    </div>
                    <div className="rounded border border-[#ECECE8] bg-[#FAFAF9] p-3">
                      <div className="text-[#78716C]">Existing Student</div>
                      <div className="mt-1 font-semibold text-[#141413]">
                        {verifiedData.concession.isExistingStudent
                          ? `Verified (${verifiedData.concession.studentId || 'Alumni'})`
                          : 'New Applicant'}
                      </div>
                    </div>
                    <div className="rounded border border-[#ECECE8] bg-[#FAFAF9] p-3">
                      <div className="text-[#78716C]">Tuition Concession</div>
                      <div className="mt-1 font-mono font-semibold text-[#9F1239] tabular-nums">
                        {Math.round(verifiedData.concession.appliedRate * 100)}% Off All Plans
                      </div>
                    </div>
                  </div>

                  {verifiedData.existingAccountEmail ? (
                    <div className="space-y-3 pt-1">
                      <p className="text-xs text-[#44403C]">
                        This Singpass NRIC is already linked to{' '}
                        <span className="font-medium text-[#141413]">
                          {verifiedData.existingAccountEmail}
                        </span>
                        . You can sign in directly with your verified Singpass session.
                      </p>
                      {regError && (
                        <div
                          role="alert"
                          className="rounded-md border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-xs text-[#991B1B]"
                        >
                          {regError}
                        </div>
                      )}
                      <button
                        type="button"
                        disabled={regLoading}
                        onClick={handleQuickSingpassSignIn}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#141413] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#292524] cursor-pointer"
                      >
                        <UserCheck className="h-4 w-4" aria-hidden="true" />
                        {regLoading ? 'Signing In...' : 'Sign In with Verified Singpass'}
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleCompleteRegistration} className="space-y-3.5 pt-1">
                      <p className="text-xs font-medium text-[#44403C]">
                        Step 2: Set your login email and password to complete registration
                      </p>

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
                            className="w-full rounded-md border border-[#D6D3D1] bg-white px-3 py-2 text-sm text-[#141413] focus:border-[#141413] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label htmlFor="reg-password" className="block text-xs font-medium text-[#44403C] mb-1">
                            Create Password (min. 8 chars)
                          </label>
                          <input
                            id="reg-password"
                            type="password"
                            required
                            minLength={8}
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="Minimum 8 characters"
                            className="w-full rounded-md border border-[#D6D3D1] bg-white px-3 py-2 text-sm text-[#141413] focus:border-[#141413] focus:outline-none"
                          />
                        </div>
                      </div>

                      {regError && (
                        <div
                          role="alert"
                          className="rounded-md border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-xs text-[#991B1B]"
                        >
                          {regError}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={regLoading}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#141413] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#292524] disabled:opacity-60 cursor-pointer"
                      >
                        <Lock className="h-4 w-4" aria-hidden="true" />
                        {regLoading ? 'Creating Verified Account...' : 'Complete Registration & Sign In'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
