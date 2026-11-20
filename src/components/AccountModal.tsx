import { CheckCircle2, LogOut, ShieldCheck, X } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { formatSGD, logoutUser, verifyExistingStudentId } from '../lib/api';
import type { SubscriptionOrder, UserProfile } from '../types';

interface AccountModalProps {
  open: boolean;
  user: UserProfile | null;
  orders: SubscriptionOrder[];
  onClose: () => void;
  onUserUpdated: (user: UserProfile) => void;
  onLoggedOut: () => void;
}

export function AccountModal({
  open,
  user,
  orders,
  onClose,
  onUserUpdated,
  onLoggedOut,
}: AccountModalProps) {
  const [studentIdInput, setStudentIdInput] = useState('');
  const [studentError, setStudentError] = useState<string | null>(null);
  const [studentSuccess, setStudentSuccess] = useState<string | null>(null);
  const [verifyingStudent, setVerifyingStudent] = useState(false);

  if (!open || !user) return null;

  const handleLinkStudentId = async (e: FormEvent) => {
    e.preventDefault();
    setStudentError(null);
    setStudentSuccess(null);
    setVerifyingStudent(true);
    try {
      const res = await verifyExistingStudentId(studentIdInput);
      onUserUpdated(res.user);
      setStudentSuccess('Alumni Student ID verified. Tuition concession updated.');
      setStudentIdInput('');
    } catch (err) {
      setStudentError(err instanceof Error ? err.message : 'Unable to verify Student ID.');
    } finally {
      setVerifyingStudent(false);
    }
  };

  const handleSignOut = async () => {
    await logoutUser();
    onLoggedOut();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-modal-title"
    >
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-[#E4E4E0] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E4E4E0] px-6 py-4">
          <div>
            <h2 id="account-modal-title" className="font-display text-xl font-semibold text-[#141413]">
              Learner Account & Enrollments
            </h2>
            <p className="mt-0.5 text-xs text-[#78716C]">
              Registered learner profile, tuition concessions, and active PR Academy subscriptions
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close account modal"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[#57534E] hover:bg-[#F5F5F4] hover:text-[#141413] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Learner Profile Record */}
          <section className="rounded-md border border-[#E4E4E0] bg-[#FAFAF9] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E4E4E0] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#9F1239]" aria-hidden="true" />
                  <span className="text-xs font-semibold tracking-wide text-[#57534E]">
                    Registered Learner Profile
                  </span>
                </div>
                <h3 className="mt-1 font-display text-lg font-semibold text-[#141413]">
                  {user.fullName}
                </h3>
                <p className="text-xs text-[#57534E]">
                  {user.email}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#D6D3D1] bg-white px-3 py-1.5 text-xs font-medium text-[#44403C] hover:border-[#141413] hover:text-[#141413] cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Sign Out
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded border border-[#E4E4E0] bg-white p-3">
                <div className="text-[#78716C]">Registered Age</div>
                <div className="mt-1 font-mono font-semibold text-[#141413] tabular-nums">
                  {user.concession.age} years ({user.concession.isOver40 ? 'Over-40 Eligible' : 'Under 40'})
                </div>
              </div>
              <div className="rounded border border-[#E4E4E0] bg-white p-3">
                <div className="text-[#78716C]">Existing Student Status</div>
                <div className="mt-1 font-semibold text-[#141413]">
                  {user.concession.isExistingStudent
                    ? `Verified (${user.concession.studentId || 'Alumni'})`
                    : 'Not Linked'}
                </div>
              </div>
              <div className="rounded border border-[#E4E4E0] bg-white p-3">
                <div className="text-[#78716C]">Active Concession</div>
                <div className="mt-1 font-mono font-semibold text-[#9F1239] tabular-nums">
                  {Math.round(user.concession.appliedRate * 100)}% Tuition Waiver
                </div>
              </div>
            </div>

            {!user.concession.isExistingStudent && (
              <form onSubmit={handleLinkStudentId} className="mt-4 border-t border-[#E4E4E0] pt-4">
                <label
                  htmlFor="link-student-id"
                  className="block text-xs font-medium text-[#44403C] mb-1.5"
                >
                  Have a PR Academy Alumni ID? Verify to add 15% Existing Student Concession
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="link-student-id"
                    type="text"
                    required
                    value={studentIdInput}
                    onChange={(e) => setStudentIdInput(e.target.value.toUpperCase())}
                    placeholder="Enter e.g. PR-2024-089"
                    className="flex-1 rounded-md border border-[#D6D3D1] bg-white px-3 py-2 font-mono text-xs text-[#141413] focus:border-[#141413] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={verifyingStudent}
                    className="rounded-md bg-[#141413] px-4 py-2 text-xs font-medium text-white hover:bg-[#292524] disabled:opacity-60 cursor-pointer whitespace-nowrap"
                  >
                    {verifyingStudent ? 'Verifying...' : 'Verify Student ID'}
                  </button>
                </div>
                {studentError && <p className="mt-1.5 text-xs text-[#991B1B]">{studentError}</p>}
                {studentSuccess && <p className="mt-1.5 text-xs text-[#15803D]">{studentSuccess}</p>}
              </form>
            )}
          </section>

          {/* Active Subscriptions & Order Receipts */}
          <section>
            <h3 className="font-display text-lg font-semibold text-[#141413] mb-3">
              Active Subscriptions & Receipts ({orders.length})
            </h3>

            {orders.length === 0 ? (
              <div className="rounded-md border border-dashed border-[#D6D3D1] bg-[#FAFAF9] p-6 text-center text-sm text-[#57534E]">
                You have no active class subscriptions yet. Select a Monthly, Annual, or Ad-Hoc plan to begin.
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.orderNumber}
                    className="rounded-md border border-[#E4E4E0] bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#ECECE8] pb-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-[#57534E] font-mono tabular-nums">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#15803D]" aria-hidden="true" />
                          <span>Order #{order.orderNumber}</span>
                          <span aria-hidden="true">·</span>
                          <span>{order.status}</span>
                        </div>
                        <h4 className="mt-1 font-display text-base font-semibold text-[#141413]">
                          {order.planName} ({order.termUnits} {order.unitLabel}
                          {order.termUnits > 1 ? 's' : ''})
                        </h4>
                      </div>
                      <div className="text-right tabular-nums">
                        <div className="font-mono text-base font-semibold text-[#141413]">
                          {formatSGD(order.totalAmount)}
                        </div>
                        {order.discountAmount > 0 && (
                          <div className="text-xs text-[#9F1239]">
                            Saved {formatSGD(order.discountAmount)} ({Math.round(order.discountRate * 100)}%)
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-[#57534E]">
                      <div>
                        <span className="text-[#78716C]">Mode:</span> {order.learningMode}
                      </div>
                      <div>
                        <span className="text-[#78716C]">Starts:</span>{' '}
                        <span className="font-mono tabular-nums">{order.startDate}</span>
                      </div>
                      <div>
                        <span className="text-[#78716C]">Payment:</span> {order.paymentMethod}
                        {order.paymentLast4 ? ` ···· ${order.paymentLast4}` : ''}
                      </div>
                      <div>
                        <span className="text-[#78716C]">Learner Age:</span>{' '}
                        <span className="tabular-nums">{order.ageAtPurchase} yrs</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
