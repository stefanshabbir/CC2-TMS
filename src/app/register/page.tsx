'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { register, error, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'trainee' | 'trainer'>('trainee');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (name.trim().length < 2) {
      setValidationError('Name must be at least 2 characters.');
      return;
    }
    if (!email.includes('@')) {
      setValidationError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const success = await register(name, email, password, role);
    if (success) {
      console.log('Registration success! Redirecting to login...');
      router.replace('/?registered=true');
    } else {
      setIsSubmitting(false);
    }
  };

  const displayError = validationError || error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-deep)] px-4 py-12">
      <div className="w-full max-w-lg animate-[fade-in_0.5s_ease-out]">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-orange-500)] to-[var(--color-orange-600)]">
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-cream-50)]">Create your account</h1>
          <p className="mt-2 text-[var(--color-muted)]">
            Join the Training Management System today.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 shadow-xl shadow-black/20">
          {displayError && (
            <div
              role="alert"
              className="mb-6 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 p-4 text-sm text-[var(--color-error)]"
            >
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label
                htmlFor="reg-name"
                className="mb-1.5 block text-sm font-medium text-[var(--color-cream-200)]"
              >
                Full Name
              </label>
              <input
                id="reg-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="block w-full rounded-lg border border-[var(--color-border-light)] bg-[var(--color-bg-surface)] px-4 py-3 text-[var(--color-cream-100)] placeholder-[var(--color-muted)] transition-colors focus:border-[var(--color-orange-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-500)]/40"
              />
            </div>

            <div>
              <label
                htmlFor="reg-email"
                className="mb-1.5 block text-sm font-medium text-[var(--color-cream-200)]"
              >
                Email address
              </label>
              <input
                id="reg-email"
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

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="reg-password"
                  className="mb-1.5 block text-sm font-medium text-[var(--color-cream-200)]"
                >
                  Password
                </label>
                <input
                  id="reg-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="block w-full rounded-lg border border-[var(--color-border-light)] bg-[var(--color-bg-surface)] px-4 py-3 text-[var(--color-cream-100)] placeholder-[var(--color-muted)] transition-colors focus:border-[var(--color-orange-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-500)]/40"
                />
              </div>
              <div>
                <label
                  htmlFor="reg-confirm"
                  className="mb-1.5 block text-sm font-medium text-[var(--color-cream-200)]"
                >
                  Confirm Password
                </label>
                <input
                  id="reg-confirm"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="block w-full rounded-lg border border-[var(--color-border-light)] bg-[var(--color-bg-surface)] px-4 py-3 text-[var(--color-cream-100)] placeholder-[var(--color-muted)] transition-colors focus:border-[var(--color-orange-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-500)]/40"
                />
              </div>
            </div>

            {/* Role Selector */}
            <fieldset>
              <legend className="mb-2 block text-sm font-medium text-[var(--color-cream-200)]">
                I am a…
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('trainee')}
                  className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                    role === 'trainee'
                      ? 'border-[var(--color-orange-500)] bg-[var(--color-orange-500)]/15 text-[var(--color-orange-400)]'
                      : 'border-[var(--color-border-light)] bg-[var(--color-bg-surface)] text-[var(--color-cream-300)] hover:border-[var(--color-cream-400)]'
                  }`}
                  aria-pressed={role === 'trainee'}
                >
                  🎓 Trainee
                </button>
                <button
                  type="button"
                  onClick={() => setRole('trainer')}
                  className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                    role === 'trainer'
                      ? 'border-[var(--color-orange-500)] bg-[var(--color-orange-500)]/15 text-[var(--color-orange-400)]'
                      : 'border-[var(--color-border-light)] bg-[var(--color-bg-surface)] text-[var(--color-cream-300)] hover:border-[var(--color-cream-400)]'
                  }`}
                  aria-pressed={role === 'trainer'}
                >
                  🏫 Trainer
                </button>
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-[var(--color-orange-500)] px-4 py-3 text-base font-semibold text-white shadow-lg shadow-[var(--color-orange-500)]/25 transition-all hover:bg-[var(--color-orange-600)] hover:shadow-[var(--color-orange-600)]/30 focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-deep)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
          Already have an account?{' '}
          <Link
            href="/"
            className="font-medium text-[var(--color-orange-400)] transition-colors hover:text-[var(--color-orange-500)] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
