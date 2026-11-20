import { ArrowRight, CheckCircle2, CreditCard, Minus, Plus, QrCode, ShieldCheck, Trash2, X } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { formatSGD, submitCheckout } from '../lib/api';
import type { SubscriptionOrder, SubscriptionPlan, UserProfile } from '../types';

interface CheckoutDrawerProps {
  open: boolean;
  plan: SubscriptionPlan | null;
  termUnits: number;
  user: UserProfile | null;
  onChangeUnits: (units: number) => void;
  onRemoveItem: () => void;
  onClose: () => void;
  onRequestAuth: (mode: 'login' | 'register') => void;
  onOrderConfirmed: (order: SubscriptionOrder) => void;
  onViewAccount: () => void;
}

export function CheckoutDrawer({
  open,
  plan,
  termUnits,
  user,
  onChangeUnits,
  onRemoveItem,
  onClose,
  onRequestAuth,
  onOrderConfirmed,
  onViewAccount,
}: CheckoutDrawerProps) {
  const [step, setStep] = useState<'review' | 'payment' | 'confirmed'>('review');
  const [learningMode, setLearningMode] = useState<
    'In-Person (Singapore)' | 'Live Interactive Stream'
  >('In-Person (Singapore)');
  const [startDate, setStartDate] = useState('2026-12-01');
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'PayNow'>('Card');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvc, setCardCvc] = useState('418');
  const [billingPostalCode, setBillingPostalCode] = useState('238801');
  const [billingAddress, setBillingAddress] = useState('9 Penang Road, #08-12');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<SubscriptionOrder | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      if (step === 'confirmed' && !confirmedOrder) {
        setStep('review');
      }
    }
  }, [open, step, confirmedOrder]);

  // Reset to review when switching plans
  useEffect(() => {
    if (plan) {
      setStep('review');
      setConfirmedOrder(null);
      setError(null);
    }
  }, [plan?.id]);

  if (!open) return null;

  const subtotal = plan ? plan.unitPrice * termUnits : 0;
  const discountRate = user ? user.concession.appliedRate : 0;
  const discountAmount = Math.round(subtotal * discountRate * 100) / 100;
  const totalAmount = Math.round((subtotal - discountAmount) * 100) / 100;

  const handleCheckoutSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!plan) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await submitCheckout({
        planId: plan.id,
        termUnits,
        learningMode,
        startDate,
        paymentMethod,
        cardNumber: paymentMethod === 'Card' ? cardNumber : undefined,
        cardExpiry: paymentMethod === 'Card' ? cardExpiry : undefined,
        cardCvc: paymentMethod === 'Card' ? cardCvc : undefined,
        billingPostalCode,
        billingAddress,
      });
      setConfirmedOrder(res.order);
      setStep('confirmed');
      onOrderConfirmed(res.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="checkout-drawer-title">
      <div className="flex h-full w-full max-w-lg flex-col border-l border-[#E4E4E0] bg-white shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#E4E4E0] px-6 py-4">
          <div>
            <h2 id="checkout-drawer-title" className="font-display text-xl font-semibold text-[#141413]">
              {step === 'confirmed'
                ? 'Enrollment Confirmed'
                : step === 'payment'
                  ? 'Checkout & Payment'
                  : 'Enrollment Bag'}
            </h2>
            <p className="mt-0.5 text-xs text-[#78716C]">
              {step === 'confirmed'
                ? 'Official PR Academy subscription receipt'
                : 'Review term, tuition concessions, and billing'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close enrollment drawer"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[#57534E] hover:bg-[#F5F5F4] hover:text-[#141413] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {!plan && step !== 'confirmed' ? (
            <div className="flex h-full flex-col items-center justify-center text-center py-12">
              <p className="font-display text-lg font-medium text-[#141413]">
                Your enrollment bag is empty
              </p>
              <p className="mt-2 max-w-xs text-sm text-[#57534E]">
                Choose an Ad-Hoc Seminar Pass, Monthly Fellowship (3-month minimum), or Annual Scholar plan to enroll.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 rounded-md bg-[#141413] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#292524] cursor-pointer"
              >
                Browse Subscription Plans
              </button>
            </div>
          ) : step === 'confirmed' && confirmedOrder ? (
            <div className="space-y-6">
              <div className="rounded-md border border-[#BBF7D0] bg-[#F0FDF4] p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#15803D]" aria-hidden="true" />
                  <div>
                    <p className="font-mono text-xs font-medium text-[#166534] tabular-nums">
                      Order #{confirmedOrder.orderNumber} Confirmed
                    </p>
                    <h3 className="mt-1 font-display text-xl font-semibold text-[#141413]">
                      Welcome to {confirmedOrder.planName}
                    </h3>
                    <p className="mt-1 text-sm text-[#44403C]">
                      Your seat and syllabus credentials are active starting{' '}
                      <span className="font-mono font-medium tabular-nums">
                        {confirmedOrder.startDate}
                      </span>
                      .
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-[#E4E4E0] bg-[#FAFAF9] p-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#57534E]">Subscription Plan</span>
                  <span className="font-medium text-[#141413]">{confirmedOrder.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57534E]">Term Duration</span>
                  <span className="font-medium text-[#141413] tabular-nums">
                    {confirmedOrder.termUnits} {confirmedOrder.unitLabel}
                    {confirmedOrder.termUnits > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57534E]">Attendance Format</span>
                  <span className="font-medium text-[#141413]">{confirmedOrder.learningMode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57534E]">Age at Enrollment</span>
                  <span className="font-mono text-[#141413] tabular-nums">
                    {confirmedOrder.ageAtPurchase} yrs
                  </span>
                </div>
                <div className="flex justify-between border-t border-[#E4E4E0] pt-3">
                  <span className="text-[#57534E]">Standard Subtotal</span>
                  <span className="font-mono text-[#141413] tabular-nums">
                    {formatSGD(confirmedOrder.subtotal)}
                  </span>
                </div>
                {confirmedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-[#9F1239]">
                    <span>{confirmedOrder.discountLabel}</span>
                    <span className="font-mono tabular-nums">
                      -{formatSGD(confirmedOrder.discountAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-[#E4E4E0] pt-3 text-base font-semibold text-[#141413]">
                  <span>Total Paid ({confirmedOrder.paymentMethod})</span>
                  <span className="font-mono tabular-nums">
                    {formatSGD(confirmedOrder.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewAccount();
                  }}
                  className="flex-1 rounded-md bg-[#141413] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#292524] cursor-pointer"
                >
                  View in My Account
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-md border border-[#D6D3D1] bg-white px-4 py-2.5 text-sm font-medium text-[#141413] hover:border-[#141413] cursor-pointer"
                >
                  Return to Storefront
                </button>
              </div>
            </div>
          ) : plan && step === 'review' ? (
            <div className="space-y-6">
              {/* Selected Plan Summary */}
              <div className="rounded-md border border-[#E4E4E0] bg-[#FAFAF9] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-[#78716C]">{plan.kicker}</p>
                    <h3 className="mt-1 font-display text-lg font-semibold text-[#141413]">
                      {plan.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-semibold text-[#141413] tabular-nums">
                      {formatSGD(plan.unitPrice)} / {plan.unitLabel}
                    </div>
                    <button
                      type="button"
                      onClick={onRemoveItem}
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-[#991B1B] hover:underline cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>

                {/* Term Units Selector */}
                <div className="mt-4 pt-3 border-t border-[#E4E4E0]">
                  <label className="block text-xs font-medium text-[#44403C] mb-2">
                    {plan.billingBasis === 'ad-hoc'
                      ? 'Number of Seminar Sessions'
                      : plan.billingBasis === 'monthly'
                        ? 'Subscription Length (Minimum 3 Months)'
                        : 'Annual Term (12 Months)'}
                  </label>

                  {plan.selectableUnits.length === 1 ? (
                    <div className="rounded border border-[#141413] bg-[#141413] px-3 py-2 text-center text-xs font-medium text-white tabular-nums">
                      {plan.selectableUnits[0]} {plan.unitLabel}s
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {plan.selectableUnits.map((unit) => (
                        <button
                          key={unit}
                          type="button"
                          onClick={() => onChangeUnits(unit)}
                          className={`rounded border px-3 py-2 text-xs font-medium cursor-pointer tabular-nums ${
                            termUnits === unit
                              ? 'border-[#141413] bg-[#141413] text-white'
                              : 'border-[#D6D3D1] bg-white text-[#44403C] hover:border-[#141413]'
                          }`}
                        >
                          {unit} {plan.unitLabel}
                          {unit > 1 ? 's' : ''}
                        </button>
                      ))}
                    </div>
                  )}

                  {plan.billingBasis === 'ad-hoc' && (
                    <div className="mt-2.5 flex items-center justify-between rounded border border-[#D6D3D1] bg-white px-3 py-2">
                      <span className="text-xs font-medium text-[#44403C]">
                        Adjust Session Quantity
                      </span>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          aria-label="Decrease session quantity"
                          disabled={termUnits <= plan.minUnits}
                          onClick={() => onChangeUnits(Math.max(plan.minUnits, termUnits - 1))}
                          className="inline-flex h-7 w-7 items-center justify-center rounded border border-[#D6D3D1] bg-[#FAFAF9] text-[#141413] hover:border-[#141413] disabled:opacity-40 cursor-pointer"
                        >
                          <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <span className="min-w-[2.5ch] text-center font-mono text-xs font-semibold text-[#141413] tabular-nums">
                          {termUnits}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase session quantity"
                          disabled={termUnits >= plan.maxUnits}
                          onClick={() => onChangeUnits(Math.min(plan.maxUnits, termUnits + 1))}
                          className="inline-flex h-7 w-7 items-center justify-center rounded border border-[#D6D3D1] bg-[#FAFAF9] text-[#141413] hover:border-[#141413] disabled:opacity-40 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Learning Mode & Start Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="checkout-mode" className="block text-xs font-medium text-[#44403C] mb-1.5">
                    Attendance Mode
                  </label>
                  <select
                    id="checkout-mode"
                    value={learningMode}
                    onChange={(e) =>
                      setLearningMode(
                        e.target.value as 'In-Person (Singapore)' | 'Live Interactive Stream'
                      )
                    }
                    className="w-full rounded-md border border-[#D6D3D1] bg-white px-3 py-2 text-sm text-[#141413] focus:border-[#141413] focus:outline-none"
                  >
                    <option value="In-Person (Singapore)">In-Person (Singapore)</option>
                    <option value="Live Interactive Stream">Live Interactive Stream</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="checkout-start" className="block text-xs font-medium text-[#44403C] mb-1.5">
                    Cohort Start Date
                  </label>
                  <input
                    id="checkout-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-md border border-[#D6D3D1] bg-white px-3 py-2 font-mono text-sm text-[#141413] focus:border-[#141413] focus:outline-none tabular-nums"
                  />
                </div>
              </div>

              {/* Account & Concession Status */}
              {user ? (
                <div className="rounded-md border border-[#E4E4E0] bg-white p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#141413]">
                    <ShieldCheck className="h-4 w-4 text-[#9F1239]" aria-hidden="true" />
                    <span>Signed in as {user.fullName}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#57534E] tabular-nums">
                    Age {user.concession.age} · {user.concession.label}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border border-[#E4E4E0] bg-[#FAFAF9] p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#9F1239]" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-[#141413]">
                        Account Required for Checkout
                      </p>
                      <p className="mt-1 text-xs text-[#57534E]">
                        Sign in or create an account to apply your Over-40 (20% off) or Existing Student (15% off) concession before payment.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => onRequestAuth('register')}
                      className="rounded-md bg-[#9F1239] px-3 py-2 text-xs font-medium text-white hover:bg-[#881337] cursor-pointer"
                    >
                      Create Account
                    </button>
                    <button
                      type="button"
                      onClick={() => onRequestAuth('login')}
                      className="rounded-md border border-[#D6D3D1] bg-white px-3 py-2 text-xs font-medium text-[#141413] hover:border-[#141413] cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="space-y-2 border-t border-[#E4E4E0] pt-4 text-sm">
                <div className="flex justify-between text-[#57534E]">
                  <span>
                    Subtotal ({termUnits} {plan.unitLabel}
                    {termUnits > 1 ? 's' : ''} × {formatSGD(plan.unitPrice)})
                  </span>
                  <span className="font-mono text-[#141413] tabular-nums">
                    {formatSGD(subtotal)}
                  </span>
                </div>
                {user && discountAmount > 0 && (
                  <div className="flex justify-between text-[#9F1239]">
                    <span>{user.concession.label}</span>
                    <span className="font-mono tabular-nums">-{formatSGD(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-[#ECECE8] pt-3 text-base font-semibold text-[#141413]">
                  <span>Total Due Today</span>
                  <span className="font-mono tabular-nums">{formatSGD(totalAmount)}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Step 2: Payment & Billing */
            plan && (
              <form id="checkout-payment-form" onSubmit={handleCheckoutSubmit} className="space-y-5">
                <div className="flex items-center justify-between rounded-md border border-[#E4E4E0] bg-[#FAFAF9] px-4 py-3 text-xs">
                  <div>
                    <span className="font-medium text-[#141413]">{plan.name}</span> · {termUnits}{' '}
                    {plan.unitLabel}
                    {termUnits > 1 ? 's' : ''}
                  </div>
                  <div className="font-mono font-semibold text-[#141413] tabular-nums">
                    {formatSGD(totalAmount)}
                  </div>
                </div>

                {/* Billing Address */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold tracking-wide text-[#44403C]">
                    Billing Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label htmlFor="bill-addr" className="block text-xs font-medium text-[#44403C] mb-1">
                        Street Address
                      </label>
                      <input
                        id="bill-addr"
                        type="text"
                        required
                        value={billingAddress}
                        onChange={(e) => setBillingAddress(e.target.value)}
                        className="w-full rounded-md border border-[#D6D3D1] px-3 py-2 text-sm text-[#141413] focus:border-[#141413] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="bill-postal" className="block text-xs font-medium text-[#44403C] mb-1">
                        Postal Code
                      </label>
                      <input
                        id="bill-postal"
                        type="text"
                        required
                        value={billingPostalCode}
                        onChange={(e) => setBillingPostalCode(e.target.value)}
                        className="w-full rounded-md border border-[#D6D3D1] px-3 py-2 font-mono text-sm text-[#141413] focus:border-[#141413] focus:outline-none tabular-nums"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method Switcher */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold tracking-wide text-[#44403C]">
                    Payment Method
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Card')}
                      className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-xs font-medium cursor-pointer ${
                        paymentMethod === 'Card'
                          ? 'border-[#141413] bg-[#141413] text-white'
                          : 'border-[#D6D3D1] bg-white text-[#44403C]'
                      }`}
                    >
                      <CreditCard className="h-4 w-4" aria-hidden="true" />
                      Credit / Debit Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('PayNow')}
                      className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-xs font-medium cursor-pointer ${
                        paymentMethod === 'PayNow'
                          ? 'border-[#141413] bg-[#141413] text-white'
                          : 'border-[#D6D3D1] bg-white text-[#44403C]'
                      }`}
                    >
                      <QrCode className="h-4 w-4" aria-hidden="true" />
                      PayNow SGQR
                    </button>
                  </div>

                  {paymentMethod === 'Card' ? (
                    <div className="space-y-3 rounded-md border border-[#E4E4E0] bg-[#FAFAF9] p-4">
                      <div>
                        <label htmlFor="card-num" className="block text-xs font-medium text-[#44403C] mb-1">
                          Card Number
                        </label>
                        <input
                          id="card-num"
                          type="text"
                          required
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full rounded-md border border-[#D6D3D1] bg-white px-3 py-2 font-mono text-sm text-[#141413] focus:border-[#141413] focus:outline-none tabular-nums"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="card-exp" className="block text-xs font-medium text-[#44403C] mb-1">
                            Expiry (MM/YY)
                          </label>
                          <input
                            id="card-exp"
                            type="text"
                            required
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full rounded-md border border-[#D6D3D1] bg-white px-3 py-2 font-mono text-sm text-[#141413] focus:border-[#141413] focus:outline-none tabular-nums"
                          />
                        </div>
                        <div>
                          <label htmlFor="card-cvc" className="block text-xs font-medium text-[#44403C] mb-1">
                            CVC
                          </label>
                          <input
                            id="card-cvc"
                            type="text"
                            required
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            className="w-full rounded-md border border-[#D6D3D1] bg-white px-3 py-2 font-mono text-sm text-[#141413] focus:border-[#141413] focus:outline-none tabular-nums"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-md border border-[#E4E4E0] bg-[#FAFAF9] p-4 text-xs text-[#44403C] space-y-2">
                      <div className="font-semibold text-[#141413]">
                        PayNow UEN: 201938472K · PR Academy Pte Ltd
                      </div>
                      <p>
                        Authorize instant PayNow transfer of{' '}
                        <span className="font-mono font-semibold text-[#141413] tabular-nums">
                          {formatSGD(totalAmount)}
                        </span>{' '}
                        upon clicking Complete Enrollment below.
                      </p>
                    </div>
                  )}
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-md border border-[#FCA5A5] bg-[#FEF2F2] px-3.5 py-2.5 text-xs text-[#991B1B]"
                  >
                    {error}
                  </div>
                )}
              </form>
            )
          )}
        </div>

        {/* Drawer Footer */}
        {plan && step !== 'confirmed' && (
          <div className="border-t border-[#E4E4E0] bg-[#FAFAF9] px-6 py-4">
            {step === 'review' ? (
              <button
                type="button"
                disabled={!user}
                onClick={() => setStep('payment')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#9F1239] px-5 py-3 text-sm font-medium text-white hover:bg-[#881337] disabled:bg-[#D6D3D1] disabled:text-[#78716C] transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <span>
                  {user
                    ? `Proceed to Payment (${formatSGD(totalAmount)})`
                    : 'Sign In or Create Account Above to Continue'}
                </span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('review')}
                  className="rounded-md border border-[#D6D3D1] bg-white px-4 py-3 text-sm font-medium text-[#141413] hover:border-[#141413] cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  form="checkout-payment-form"
                  disabled={submitting}
                  className="flex-1 rounded-md bg-[#9F1239] px-5 py-3 text-sm font-medium text-white hover:bg-[#881337] disabled:opacity-60 transition-colors cursor-pointer tabular-nums"
                >
                  {submitting
                    ? 'Processing Enrollment...'
                    : `Complete Enrollment · ${formatSGD(totalAmount)}`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
