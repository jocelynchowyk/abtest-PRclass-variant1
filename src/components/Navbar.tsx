import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import type { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  hasBagItem: boolean;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenAccount: () => void;
  onOpenBag: () => void;
}

export function Navbar({
  user,
  hasBagItem,
  onOpenAuth,
  onOpenAccount,
  onOpenBag,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#E4E4E0] bg-[#F8F8F6]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-8 px-6 py-4">
        {/* Zone 1: Brand wordmark only */}
        <a
          href="#top"
          className="font-display text-xl font-semibold tracking-tight text-[#141413] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9F1239]"
        >
          PR Academy
        </a>

        {/* Zone 2: 4 concise single-line text links */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#57534E]"
        >
          <a
            href="#subscriptions"
            className="hover:text-[#141413] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Subscriptions
          </a>
          <a
            href="#curriculum"
            className="hover:text-[#141413] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Curriculum
          </a>
          <a
            href="#concessions"
            className="hover:text-[#141413] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Concessions
          </a>
          <button
            type="button"
            onClick={() => (user ? onOpenAccount() : onOpenAuth('login'))}
            className="hover:text-[#141413] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {user ? 'My Account' : 'Sign In'}
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenBag}
            className="hidden md:inline-flex items-center justify-center rounded-md bg-[#141413] px-4 py-2 text-xs font-medium text-white hover:bg-[#292524] transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9F1239]"
          >
            {hasBagItem ? 'Enrollment Bag (1)' : 'Enrollment Bag'}
          </button>

          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-md border border-[#E4E4E0] bg-white text-[#141413] cursor-pointer"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[#E4E4E0] bg-white px-6 py-4 space-y-3">
          <div className="flex flex-col space-y-3 text-sm font-medium text-[#44403C]">
            <a
              href="#subscriptions"
              onClick={() => setMobileOpen(false)}
              className="py-1.5 hover:text-[#141413]"
            >
              Subscriptions
            </a>
            <a
              href="#curriculum"
              onClick={() => setMobileOpen(false)}
              className="py-1.5 hover:text-[#141413]"
            >
              Curriculum
            </a>
            <a
              href="#concessions"
              onClick={() => setMobileOpen(false)}
              className="py-1.5 hover:text-[#141413]"
            >
              Concessions
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                if (user) {
                  onOpenAccount();
                } else {
                  onOpenAuth('login');
                }
              }}
              className="py-1.5 text-left hover:text-[#141413]"
            >
              {user ? 'My Account' : 'Sign In'}
            </button>
          </div>
          <div className="pt-2 border-t border-[#E4E4E0]">
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenBag();
              }}
              className="w-full rounded-md bg-[#141413] px-4 py-2.5 text-sm font-medium text-white tabular-nums"
            >
              {hasBagItem ? 'Enrollment Bag (1)' : 'Enrollment Bag'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
