'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Don't show navbar on login/register pages
  if (pathname === '/' || pathname === '/register') return null;

  const isAdmin = user?.role === 'admin';

  const links = [
    { href: '/programs', label: 'Catalog' },
    { href: '/my-trainings', label: 'My Trainings' },
    ...(isAdmin
      ? [
          { href: '/admin', label: 'Dashboard' },
          { href: '/admin/programs', label: 'Manage Programs' },
          { href: '/admin/users', label: 'Users' },
        ]
      : []),
  ];

  const isActive = (href: string) => {
    if (href === '/admin' || href === '/programs') {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg-base)]/95 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/programs"
          className="flex items-center gap-2 text-xl font-bold text-[var(--color-orange-500)] transition-colors hover:text-[var(--color-orange-400)]"
          aria-label="Training Management System — Home"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          <span className="hidden sm:inline">TMS</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden items-center gap-1 md:flex" role="menubar">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              role="menuitem"
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'bg-[var(--color-orange-500)]/15 text-[var(--color-orange-400)]'
                  : 'text-[var(--color-cream-300)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-cream-100)]'
              }`}
              aria-current={isActive(link.href) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* User Area */}
        <div className="flex items-center gap-3">
          {user && (
            <span className="hidden text-sm text-[var(--color-cream-400)] lg:block">
              {user.full_name}{' '}
              <span className="ml-1 rounded-full bg-[var(--color-orange-500)]/20 px-2 py-0.5 text-xs font-semibold text-[var(--color-orange-400)] uppercase">
                {user.role}
              </span>
            </span>
          )}
          <button
            onClick={logout}
            className="rounded-lg border border-[var(--color-border-light)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--color-cream-300)] transition-colors hover:border-[var(--color-orange-500)] hover:text-[var(--color-orange-400)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
          >
            Sign Out
          </button>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-[var(--color-cream-300)] hover:bg-[var(--color-bg-elevated)] md:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {mobileOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-[var(--color-border)] px-4 pb-4 pt-2 md:hidden" role="menu">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              role="menuitem"
              onClick={() => setMobileOpen(false)}
              className={`block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'bg-[var(--color-orange-500)]/15 text-[var(--color-orange-400)]'
                  : 'text-[var(--color-cream-300)] hover:bg-[var(--color-bg-elevated)]'
              }`}
              aria-current={isActive(link.href) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <p className="mt-2 border-t border-[var(--color-border)] px-4 pt-3 text-xs text-[var(--color-muted)]">
              Signed in as <strong className="text-[var(--color-cream-300)]">{user.full_name}</strong> ({user.role})
            </p>
          )}
        </div>
      )}
    </nav>
  );
}
