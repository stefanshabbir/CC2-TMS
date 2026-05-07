'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, error, isLoading, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const registered = searchParams.get('registered') === 'true';

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') router.replace('/admin');
      else if (user.role === 'trainer') router.replace('/my-trainings');
      else router.replace('/programs');
    }
  }, [user, router]);

  if (user) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      // Auth context will have user by next render
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Hero Panel */}
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--color-orange-600)] via-[var(--color-orange-500)] to-[var(--color-orange-400)] lg:flex">
        {/* Decorative circles */}
        <div
          className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-white/10"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-white/10"
          aria-hidden="true"
        />
        <div
          className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-md px-12 text-center">
          {/* Book icon */}
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <h1 className="mb-4 text-4xl font-extrabold leading-tight text-white">
            Training Management System
          </h1>
          <p className="text-lg leading-relaxed text-white/80">
            Empower your team with a modern platform to manage courses, track progress, and elevate
            learning outcomes.
          </p>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[var(--color-bg-deep)] px-6 py-12 lg:px-16">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--color-orange-500)]">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-cream-100)]">TMS</h1>
          </div>

          <h2 className="mb-2 text-2xl font-bold text-[var(--color-cream-50)]">Welcome back</h2>
          <p className="mb-8 text-[var(--color-muted)]">
            Sign in to access your training dashboard.
          </p>

          {/* Success message */}
          {registered && (
            <div
              role="status"
              className="mb-6 rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 p-4 text-sm text-[var(--color-success)]"
            >
              Account created successfully! Please log in below.
            </div>
          )}

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="mb-6 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 p-4 text-sm text-[var(--color-error)]"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label
                htmlFor="login-email"
                className="mb-1.5 block text-sm font-medium text-[var(--color-cream-200)]"
              >
                Email address
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="block w-full rounded-lg border border-[var(--color-border-light)] bg-[var(--color-bg-surface)] px-4 py-3 text-[var(--color-cream-100)] placeholder-[var(--color-muted)] transition-colors focus:border-[var(--color-orange-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-500)]/40"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-sm font-medium text-[var(--color-cream-200)]"
              >
                Password
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full rounded-lg border border-[var(--color-border-light)] bg-[var(--color-bg-surface)] px-4 py-3 text-[var(--color-cream-100)] placeholder-[var(--color-muted)] transition-colors focus:border-[var(--color-orange-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-500)]/40"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-[var(--color-orange-500)] px-4 py-3 text-base font-semibold text-white shadow-lg shadow-[var(--color-orange-500)]/25 transition-all hover:bg-[var(--color-orange-600)] hover:shadow-[var(--color-orange-600)]/30 focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-deep)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[var(--color-muted)]">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="font-medium text-[var(--color-orange-400)] transition-colors hover:text-[var(--color-orange-500)] hover:underline"
            >
              Create one
            </Link>
          </p>


        </div>
      </div>
    </div>
  );
}
