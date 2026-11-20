import { ArrowRight, GraduationCap, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AccountModal } from './components/AccountModal';
import { AuthModal } from './components/AuthModal';
import { CheckoutDrawer } from './components/CheckoutDrawer';
import { Navbar } from './components/Navbar';
import { SubscriptionCard } from './components/SubscriptionCard';
import { fetchCatalog, fetchCurrentUser } from './lib/api';
import type {
  MasterclassSession,
  PlanId,
  SubscriptionOrder,
  SubscriptionPlan,
  UserProfile,
} from './types';

export default function App() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [classes, setClasses] = useState<MasterclassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<SubscriptionOrder[]>([]);

  // Per-plan selected term units
  const [selectedUnitsByPlan, setSelectedUnitsByPlan] = useState<Record<PlanId, number>>({
    adhoc: 1,
    monthly: 3,
    annual: 12,
  });

  // Concession checkboxes for Existing Student (15%) & Over-40 (20%)
  const [isStudentChecked, setIsStudentChecked] = useState(false);
  const [isOver40Checked, setIsOver40Checked] = useState(false);

  // Highlighted / selected plan box (Annual highlighted by default)
  const [highlightedPlanId, setHighlightedPlanId] = useState<PlanId>('annual');

  // Active bag item & modals
  const [bagPlanId, setBagPlanId] = useState<PlanId | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [accountOpen, setAccountOpen] = useState(false);
  const [heroImgError, setHeroImgError] = useState(false);

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const [catalog, me] = await Promise.all([fetchCatalog(), fetchCurrentUser()]);
        if (!active) return;
        setPlans(catalog.plans);
        setClasses(catalog.classes);
        setUser(me.user);
        setOrders(me.orders);
        if (me.user) {
          setIsStudentChecked(me.user.concession.isExistingStudent);
          setIsOver40Checked(me.user.concession.isOver40);
        }
      } catch (err) {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : 'Unable to load PR Academy catalog.');
      } finally {
        if (active) setLoading(false);
      }
    }
    init();
    return () => {
      active = false;
    };
  }, []);

  // Compute dynamic concession rate from checkboxes
  const activeDiscountRate =
    isStudentChecked && isOver40Checked
      ? 0.3
      : isOver40Checked
        ? 0.2
        : isStudentChecked
          ? 0.15
          : 0;
  const activeDiscountPercent = Math.round(activeDiscountRate * 100);

  const isSyncedWithVerifiedUser =
    user !== null &&
    user.concession.isExistingStudent === isStudentChecked &&
    user.concession.isOver40 === isOver40Checked;

  const durationOrder: Record<PlanId, number> = { monthly: 0, annual: 1, adhoc: 2 };
  const orderedPlans = [...plans].sort(
    (a, b) => (durationOrder[a.id] ?? 99) - (durationOrder[b.id] ?? 99)
  );

  const handleSelectPlan = (plan: SubscriptionPlan, units: number) => {
    setHighlightedPlanId(plan.id);
    setSelectedUnitsByPlan((prev) => ({ ...prev, [plan.id]: units }));
    setBagPlanId(plan.id);
    setDrawerOpen(true);
  };

  const activeBagPlan = plans.find((p) => p.id === bagPlanId) || null;
  const activeBagUnits = activeBagPlan ? selectedUnitsByPlan[activeBagPlan.id] : 1;

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <div id="top" className="min-h-screen bg-[#F8F8F6] text-[#141413]">
      <Navbar
        user={user}
        hasBagItem={Boolean(activeBagPlan)}
        onOpenAuth={openAuthModal}
        onOpenAccount={() => setAccountOpen(true)}
        onOpenBag={() => setDrawerOpen(true)}
      />

      <main>
        {/* 1. Storefront Hero Section */}
        <section className="mx-auto max-w-[1200px] px-6 pt-10 pb-12 lg:pt-14 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:items-stretch">
            {/* Left Copy Column */}
            <div className="lg:col-span-6 flex flex-col justify-between py-2">
              <div>
                <p className="text-xs font-medium tracking-wide text-[#78716C]">
                  Singapore Masterclass Series · Taught by Professor PR
                </p>

                <h1 className="mt-4 font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[#141413] leading-[1.12] [text-wrap:balance]">
                  Rigorous thinking for long-horizon decisions.
                </h1>

                <p className="mt-5 max-w-xl text-base leading-relaxed text-[#44403C]">
                  Enroll in Professor PR’s live seminars on institutional strategy, capital allocation, and quantitative judgment. Choose between flexible ad-hoc passes, a three-month minimum monthly fellowship, or the full twelve-month scholar curriculum.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#subscriptions"
                  className="inline-flex items-center gap-2 rounded-md bg-[#9F1239] px-6 py-3 text-sm font-medium text-white hover:bg-[#881337] transition-colors whitespace-nowrap"
                >
                  <span>Explore Subscription Plans</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>

                {user ? (
                  <button
                    type="button"
                    onClick={() => setAccountOpen(true)}
                    className="inline-flex items-center gap-2 rounded-md border border-[#D6D3D1] bg-white px-5 py-3 text-sm font-medium text-[#141413] hover:border-[#141413] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <ShieldCheck className="h-4 w-4 text-[#9F1239]" aria-hidden="true" />
                    <span>
                      {user.fullName} · {Math.round(user.concession.appliedRate * 100)}% Concession
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openAuthModal('register')}
                    className="inline-flex items-center gap-2 rounded-md border border-[#D6D3D1] bg-white px-5 py-3 text-sm font-medium text-[#141413] hover:border-[#141413] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <span>Create Account</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Architectural Portrait Column */}
            <div className="lg:col-span-6">
              <div className="relative aspect-[16/10] lg:aspect-auto lg:h-full min-h-[300px] w-full overflow-hidden rounded-lg border border-[#E4E4E0] bg-[#EAEAE6]">
                {!heroImgError ? (
                  <img
                    src="/src/assets/images/hero_professor_righthand_1795159324302.jpg"
                    alt="Professor PR delivering a strategy seminar in Singapore"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgError(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#EFEFED] to-[#E2E0DA] p-8 text-center">
                    <GraduationCap className="h-10 w-10 text-[#57534E] mb-3" />
                    <p className="font-display text-xl text-[#141413]">Professor PR Seminar Hall</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4-Column Full-Width Summary Strip Below Hero Split */}
          <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-lg border border-[#E4E4E0] bg-[#E4E4E0]">
            <div className="bg-white p-5">
              <div className="font-mono text-xl font-semibold text-[#141413] tabular-nums">
                3 Plans
              </div>
              <div className="mt-1 text-xs text-[#57534E]">
                Ad-Hoc, Monthly (3-mo min) & Annual
              </div>
            </div>
            <div className="bg-white p-5">
              <div className="font-mono text-xl font-semibold text-[#141413] tabular-nums">
                20% Off
              </div>
              <div className="mt-1 text-xs text-[#57534E]">
                Lifelong learners aged 40 and above
              </div>
            </div>
            <div className="bg-white p-5">
              <div className="font-mono text-xl font-semibold text-[#141413] tabular-nums">
                15% Off
              </div>
              <div className="mt-1 text-xs text-[#57534E]">
                Verified existing PR Academy students
              </div>
            </div>
            <div className="bg-white p-5">
              <div className="font-mono text-xl font-semibold text-[#141413] tabular-nums">
                30% Max
              </div>
              <div className="mt-1 text-xs text-[#57534E]">
                Combined Over-40 & Alumni concession
              </div>
            </div>
          </div>
        </section>

        {/* 2. Featured Subscription Plans Section */}
        <section
          id="subscriptions"
          className="border-t border-[#E4E4E0] bg-white py-16 lg:py-20"
        >
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="mb-8">
              <div className="max-w-2xl">
                <p className="text-xs font-medium tracking-wide text-[#78716C]">
                  Subscription Plans by Duration · Monthly, Annually & Single
                </p>
                <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#141413] [text-wrap:balance]">
                  Transparent tuition tailored to your study horizon.
                </h2>
              </div>

              {/* Additional Checkboxes for Existing Students & >40 Years Old + Dynamic Savings Reflection */}
              <div className="mt-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-lg border border-[#E4E4E0] bg-[#FAFAF9] p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  <span className="text-xs font-semibold tracking-wide text-[#44403C]">
                    Eligibility & Savings Calculator:
                  </span>

                  <label className="inline-flex items-center gap-2.5 text-sm font-medium text-[#141413] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isStudentChecked}
                      onChange={(e) => setIsStudentChecked(e.target.checked)}
                      className="h-4 w-4 rounded border-[#A8A29E] accent-[#9F1239] cursor-pointer"
                    />
                    <span>Existing Student (15% off)</span>
                  </label>

                  <label className="inline-flex items-center gap-2.5 text-sm font-medium text-[#141413] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isOver40Checked}
                      onChange={(e) => setIsOver40Checked(e.target.checked)}
                      className="h-4 w-4 rounded border-[#A8A29E] accent-[#9F1239] cursor-pointer"
                    />
                    <span>&gt;40 years old (20% off)</span>
                  </label>
                </div>

                <div className="flex flex-col items-start lg:items-end text-xs tabular-nums">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[#57534E]">Dynamic Concession Savings:</span>
                    <span className="font-mono text-base font-semibold text-[#9F1239]">
                      {activeDiscountPercent}% off
                    </span>
                    <span className="text-[#78716C]">
                      {isStudentChecked && isOver40Checked
                        ? '(Combined cap: 30%)'
                        : isOver40Checked
                          ? '(Over-40 Concession)'
                          : isStudentChecked
                            ? '(Student Concession)'
                            : '(Standard Rate)'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[#78716C]">
                    {isSyncedWithVerifiedUser && user
                      ? `Applied for ${user.fullName} (Age ${user.concession.age})`
                      : 'Applied automatically to your account at registration & checkout'}
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="overflow-x-auto pb-2">
                <div className="grid grid-cols-3 gap-4 lg:gap-7 min-w-[680px] sm:min-w-0">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="h-[440px] rounded-lg border border-[#E4E4E0] bg-[#FAFAF9] animate-pulse"
                    />
                  ))}
                </div>
              </div>
            ) : loadError ? (
              <div className="rounded-md border border-[#FCA5A5] bg-[#FEF2F2] p-6 text-sm text-[#991B1B]">
                {loadError}
              </div>
            ) : (
              <div className="overflow-x-auto pb-2">
                <div className="grid grid-cols-3 gap-4 lg:gap-7 min-w-[680px] sm:min-w-0 items-stretch">
                  {orderedPlans.map((plan) => (
                    <SubscriptionCard
                      key={plan.id}
                      plan={plan}
                      selectedUnits={selectedUnitsByPlan[plan.id]}
                      onChangeUnits={(units) =>
                        setSelectedUnitsByPlan((prev) => ({ ...prev, [plan.id]: units }))
                      }
                      onSelectPlan={handleSelectPlan}
                      onHighlightPlan={() => setHighlightedPlanId(plan.id)}
                      discountRate={activeDiscountRate}
                      isSelected={highlightedPlanId === plan.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 3. Curriculum & Tuition Concessions Section */}
        <section id="curriculum" className="border-t border-[#E4E4E0] bg-[#F8F8F6] py-16 lg:py-20">
          <div className="mx-auto max-w-[1200px] px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Upcoming Masterclasses */}
            <div className="lg:col-span-7">
              <p className="text-xs font-medium tracking-wide text-[#78716C]">
                2026–2027 Seminar Schedule
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[#141413] [text-wrap:balance]">
                Upcoming seminars led directly by Professor PR.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#57534E]">
                Every session combines foundational economic theory with live quantitative casework. All classes run in Singapore and stream simultaneously for remote fellows.
              </p>

              <div className="mt-8 divide-y divide-[#E4E4E0] border-y border-[#E4E4E0] bg-white rounded-lg px-6">
                {classes.map((cls) => (
                  <div key={cls.id} className="py-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-display text-lg font-semibold text-[#141413]">
                        {cls.code} {cls.title}
                      </h3>
                      <span className="font-mono text-xs text-[#57534E] tabular-nums">
                        {cls.seatsRemaining} seats open
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-[#57534E]">{cls.summary}</p>
                    <p className="mt-2 text-xs text-[#78716C]">
                      {cls.schedule} · {cls.duration} · {cls.format}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tuition Concessions Panel */}
            <div id="concessions" className="lg:col-span-5">
              <div className="rounded-lg border border-[#E4E4E0] bg-white p-7">
                <div className="flex items-center gap-2.5 text-xs font-semibold tracking-wide text-[#9F1239]">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  <span>Tuition Concessions</span>
                </div>

                <h2 className="mt-3 font-display text-2xl font-semibold text-[#141413] [text-wrap:balance]">
                  Dedicated tuition support for mid-career & alumni learners.
                </h2>

                <p className="mt-3 text-sm leading-relaxed text-[#57534E]">
                  PR Academy automatically calculates eligible tuition concessions from your registered date of birth and alumni student record at checkout.
                </p>

                <dl className="mt-6 space-y-4 border-t border-[#ECECE8] pt-5 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <dt className="font-semibold text-[#141413]">Over-40 Lifelong Learner</dt>
                      <dd className="mt-0.5 text-xs text-[#57534E]">
                        Automatically applied for learners aged 40 or above.
                      </dd>
                    </div>
                    <dd className="font-mono font-semibold text-[#9F1239] whitespace-nowrap tabular-nums">
                      20% Off
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-4 border-t border-[#ECECE8] pt-4">
                    <div>
                      <dt className="font-semibold text-[#141413]">Existing Student Concession</dt>
                      <dd className="mt-0.5 text-xs text-[#57534E]">
                        Applied to PR Academy alumni (e.g. ID <span className="font-mono">PR-2024-089</span>).
                      </dd>
                    </div>
                    <dd className="font-mono font-semibold text-[#9F1239] whitespace-nowrap tabular-nums">
                      15% Off
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-4 border-t border-[#ECECE8] pt-4">
                    <div>
                      <dt className="font-semibold text-[#141413]">Combined Loyalty & 40+</dt>
                      <dd className="mt-0.5 text-xs text-[#57534E]">
                        Maximum combined tuition concession for returning learners aged 40+.
                      </dd>
                    </div>
                    <dd className="font-mono font-semibold text-[#9F1239] whitespace-nowrap tabular-nums">
                      30% Off
                    </dd>
                  </div>
                </dl>

                <div className="mt-7 space-y-2.5">
                  {user ? (
                    <button
                      type="button"
                      onClick={() => setAccountOpen(true)}
                      className="w-full rounded-md bg-[#141413] px-5 py-3 text-sm font-medium text-white hover:bg-[#292524] transition-colors cursor-pointer"
                    >
                      View My Tuition Concession
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => openAuthModal('register')}
                        className="w-full rounded-md bg-[#9F1239] px-5 py-3 text-sm font-medium text-white hover:bg-[#881337] transition-colors cursor-pointer"
                      >
                        Create Learner Account
                      </button>
                      <button
                        type="button"
                        onClick={() => openAuthModal('login')}
                        className="w-full rounded-md border border-[#D6D3D1] bg-white px-5 py-2.5 text-sm font-medium text-[#141413] hover:border-[#141413] transition-colors cursor-pointer"
                      >
                        Existing Learner Sign In
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-[#E4E4E0] bg-white py-10">
        <div className="mx-auto flex max-w-[1200px] flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 text-xs text-[#78716C]">
          <div>
            <span className="font-display text-sm font-semibold text-[#141413]">PR Academy</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>9 Penang Road, Singapore 238801</span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <a href="#subscriptions" className="hover:text-[#141413]">
              Subscriptions
            </a>
            <a href="#curriculum" className="hover:text-[#141413]">
              Curriculum
            </a>
            <a href="#concessions" className="hover:text-[#141413]">
              Tuition Concessions
            </a>
            <button
              type="button"
              onClick={() => (user ? setAccountOpen(true) : openAuthModal('login'))}
              className="hover:text-[#141413] cursor-pointer"
            >
              {user ? 'My Account' : 'Learner Sign In'}
            </button>
          </div>
        </div>
      </footer>

      {/* Interactive Modals & Checkout Drawer */}
      <AuthModal
        open={authOpen}
        initialMode={authMode}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={(authenticatedUser, userOrders) => {
          setUser(authenticatedUser);
          setOrders(userOrders);
          setIsStudentChecked(authenticatedUser.concession.isExistingStudent);
          setIsOver40Checked(authenticatedUser.concession.isOver40);
        }}
      />

      <AccountModal
        open={accountOpen}
        user={user}
        orders={orders}
        onClose={() => setAccountOpen(false)}
        onUserUpdated={(updatedUser) => {
          setUser(updatedUser);
          setIsStudentChecked(updatedUser.concession.isExistingStudent);
          setIsOver40Checked(updatedUser.concession.isOver40);
        }}
        onLoggedOut={() => {
          setUser(null);
          setOrders([]);
          setIsStudentChecked(false);
          setIsOver40Checked(false);
        }}
      />

      <CheckoutDrawer
        open={drawerOpen}
        plan={activeBagPlan}
        termUnits={activeBagUnits}
        user={user}
        onChangeUnits={(units) => {
          if (activeBagPlan) {
            setSelectedUnitsByPlan((prev) => ({ ...prev, [activeBagPlan.id]: units }));
          }
        }}
        onRemoveItem={() => setBagPlanId(null)}
        onClose={() => setDrawerOpen(false)}
        onRequestAuth={(mode) => {
          openAuthModal(mode);
        }}
        onOrderConfirmed={(newOrder) => {
          setOrders((prev) => [newOrder, ...prev]);
        }}
        onViewAccount={() => setAccountOpen(true)}
      />
    </div>
  );
}
