import { Check, Minus, Plus } from 'lucide-react';
import { formatSGD } from '../lib/api';
import type { SubscriptionPlan } from '../types';

interface SubscriptionCardProps {
  plan: SubscriptionPlan;
  selectedUnits: number;
  onChangeUnits: (units: number) => void;
  onSelectPlan: (plan: SubscriptionPlan, units: number) => void;
  onHighlightPlan: () => void;
  discountRate: number;
  isSelected?: boolean;
}

export function SubscriptionCard({
  plan,
  selectedUnits,
  onChangeUnits,
  onSelectPlan,
  onHighlightPlan,
  discountRate,
  isSelected = false,
}: SubscriptionCardProps) {
  const standardTotal = plan.unitPrice * selectedUnits;
  const discountedUnitPrice = Math.round(plan.unitPrice * (1 - discountRate) * 100) / 100;
  const discountedTotal = Math.round(standardTotal * (1 - discountRate) * 100) / 100;
  const savingsAmount = Math.round((standardTotal - discountedTotal) * 100) / 100;
  const discountPercent = Math.round(discountRate * 100);

  // Annual plan has a built-in 25% duration saving vs the S$260/mo Monthly rate
  const annualVsMonthlyEffectivePercent =
    plan.id === 'annual'
      ? Math.round((1 - discountedUnitPrice / 260) * 100)
      : discountPercent;

  return (
    <article
      onClick={onHighlightPlan}
      className={`flex flex-col rounded-lg bg-white transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${
        isSelected
          ? 'border-2 border-[#9F1239] ring-2 ring-[#9F1239]/15 shadow-[0_12px_28px_rgba(159,18,57,0.10)]'
          : 'border border-[#E4E4E0] hover:border-[#A8A29E]'
      }`}
    >
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {/* Zero-pill quiet text kicker */}
        <p className="text-[11px] sm:text-xs font-medium tracking-wide text-[#78716C]">
          {plan.kicker}
        </p>

        <h3 className="mt-1.5 font-display text-xl lg:text-2xl font-semibold text-[#141413]">
          {plan.name}
        </h3>

        {/* Pricing Block with Dynamic Percentage Savings */}
        <div className="mt-3.5 border-y border-[#ECECE8] py-3.5">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-mono text-xl lg:text-2xl font-semibold text-[#141413] tabular-nums">
              {formatSGD(discountedUnitPrice)}
            </span>
            <span className="text-xs sm:text-sm text-[#57534E]">
              / {plan.unitLabel}
            </span>
            {discountPercent > 0 && (
              <span className="font-mono text-xs sm:text-sm text-[#A8A29E] line-through tabular-nums">
                {formatSGD(plan.unitPrice)}
              </span>
            )}
          </div>

          <div className="mt-2 space-y-1 text-xs tabular-nums">
            <div className="flex items-center justify-between gap-2 text-[#57534E]">
              <span>
                Term total ({selectedUnits} {plan.unitLabel}{selectedUnits > 1 ? 's' : ''})
              </span>
              <span className="font-mono font-semibold text-[#141413]">
                {formatSGD(discountedTotal)}
              </span>
            </div>

            {discountPercent > 0 ? (
              <div className="flex items-center justify-between gap-2 font-medium text-[#9F1239]">
                <span>Savings ({discountPercent}% off)</span>
                <span className="font-mono">-{formatSGD(savingsAmount)}</span>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 text-[#78716C]">
                <span>Concession</span>
                <span className="font-mono">0% (Standard)</span>
              </div>
            )}

            {plan.id === 'annual' && (
              <div className="flex items-center justify-between gap-2 text-[#44403C]">
                <span>Vs. Monthly rate</span>
                <span className="font-mono font-medium text-[#9F1239]">
                  {annualVsMonthlyEffectivePercent}% lower
                </span>
              </div>
            )}
          </div>
          <p className="mt-2 text-[11px] sm:text-xs text-[#78716C]">{plan.billingNote}</p>
        </div>

        {/* Interactive Term / Session Selector */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-medium text-[#44403C] mb-2">
            <span>
              {plan.billingBasis === 'ad-hoc'
                ? 'Select Sessions'
                : plan.billingBasis === 'monthly'
                  ? 'Term (Min. 3 Months)'
                  : 'Fixed Annual Term'}
            </span>
          </div>

          {plan.selectableUnits.length === 1 ? (
            <div className="rounded-md border border-[#141413] bg-[#141413] px-3 py-2 text-center text-[11px] lg:text-xs font-medium text-white tabular-nums">
              {plan.selectableUnits[0]} months
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 lg:gap-2">
              {plan.selectableUnits.map((unit) => {
                const active = selectedUnits === unit;
                const shortUnit =
                  plan.unitLabel === 'month'
                    ? `${unit} mo`
                    : `${unit} ${unit === 1 ? 'session' : 'sessions'}`;
                return (
                  <button
                    key={unit}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onHighlightPlan();
                      onChangeUnits(unit);
                    }}
                    className={`rounded-md border px-2 py-2 text-[11px] lg:text-xs font-medium transition-colors cursor-pointer whitespace-nowrap truncate tabular-nums ${
                      active
                        ? 'border-[#141413] bg-[#141413] text-white'
                        : 'border-[#E4E4E0] bg-[#FAFAF9] text-[#44403C] hover:border-[#A8A29E]'
                    }`}
                  >
                    {shortUnit}
                  </button>
                );
              })}
            </div>
          )}

          {/* Quantity Stepper for Single Seminar Pass */}
          {plan.billingBasis === 'ad-hoc' && (
            <div className="mt-2 flex items-center justify-between rounded-md border border-[#E4E4E0] bg-[#FAFAF9] px-2.5 py-1.5">
              <span className="text-[11px] lg:text-xs font-medium text-[#57534E]">
                Quantity
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Decrease session quantity"
                  disabled={selectedUnits <= plan.minUnits}
                  onClick={(e) => {
                    e.stopPropagation();
                    onHighlightPlan();
                    onChangeUnits(Math.max(plan.minUnits, selectedUnits - 1));
                  }}
                  className="inline-flex h-7 w-7 items-center justify-center rounded border border-[#D6D3D1] bg-white text-[#141413] hover:border-[#141413] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <span className="min-w-[2.5ch] text-center font-mono text-xs font-semibold text-[#141413] tabular-nums">
                  {selectedUnits}
                </span>
                <button
                  type="button"
                  aria-label="Increase session quantity"
                  disabled={selectedUnits >= plan.maxUnits}
                  onClick={(e) => {
                    e.stopPropagation();
                    onHighlightPlan();
                    onChangeUnits(Math.min(plan.maxUnits, selectedUnits + 1));
                  }}
                  className="inline-flex h-7 w-7 items-center justify-center rounded border border-[#D6D3D1] bg-white text-[#141413] hover:border-[#141413] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Description & Detailed Benefits */}
        <p className="mt-4 text-xs sm:text-sm leading-relaxed text-[#57534E]">
          {plan.description}
        </p>

        <ul className="mt-4 flex-1 space-y-2 text-xs sm:text-sm text-[#292524]">
          {plan.benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#9F1239]" aria-hidden="true" />
              <span className="leading-snug">{benefit}</span>
            </li>
          ))}
        </ul>

        {/* Uniform Bottom Action */}
        <div className="mt-6 pt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onHighlightPlan();
              onSelectPlan(plan, selectedUnits);
            }}
            className={`w-full rounded-md px-3 lg:px-5 py-3 text-xs lg:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap truncate focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9F1239] ${
              isSelected
                ? 'bg-[#9F1239] text-white hover:bg-[#881337]'
                : 'bg-[#141413] text-white hover:bg-[#292524]'
            }`}
          >
            Select {plan.name}
          </button>
        </div>
      </div>
    </article>
  );
}
