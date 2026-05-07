'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { getUserEnrollments, getTrainerPrograms } from '@/lib/data';
import type { Program } from '@/lib/types';

function StatusBadge({ status }: { status: Program['status'] }) {
  const styles: Record<Program['status'], string> = {
    upcoming:
      'bg-[var(--color-orange-500)]/15 text-[var(--color-orange-400)] border-[var(--color-orange-500)]/30',
    'in-progress':
      'bg-[var(--color-success)]/15 text-[var(--color-success)] border-[var(--color-success)]/30',
    completed:
      'bg-[var(--color-muted)]/15 text-[var(--color-muted)] border-[var(--color-muted)]/30',
  };

  const labels: Record<Program['status'], string> = {
    upcoming: 'Upcoming',
    'in-progress': 'In Progress',
    completed: 'Completed',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function EmptyState({ isTrainer }: { isTrainer: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border-light)] bg-[var(--color-bg-card)] px-8 py-16 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-orange-500)]/15">
        <svg
          className="h-8 w-8 text-[var(--color-orange-400)]"
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
      </div>
      <h2 className="mb-2 text-xl font-semibold text-[var(--color-cream-100)]">
        {isTrainer ? 'No programs assigned' : 'No enrollments yet'}
      </h2>
      <p className="mb-6 max-w-sm text-sm text-[var(--color-muted)]">
        {isTrainer
          ? "You haven't been assigned to any training programs yet."
          : 'Browse the catalog and enroll in a program to get started.'}
      </p>
      <Link
        href="/programs"
        className="rounded-lg bg-[var(--color-orange-500)] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-orange-500)]/25 transition-all hover:bg-[var(--color-orange-600)]"
      >
        Browse Catalog
      </Link>
    </div>
  );
}

function NotLoggedIn() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <h1 className="mb-2 text-2xl font-bold text-[var(--color-cream-100)]">
          Sign in required
        </h1>
        <p className="mb-4 text-[var(--color-muted)]">
          You need to sign in to view your trainings.
        </p>
        <Link
          href="/"
          className="text-sm font-medium text-[var(--color-orange-400)] hover:underline"
        >
          Go to login →
        </Link>
      </div>
    </div>
  );
}

export default function MyTrainingsPage() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const isTrainer = user.role === 'trainer' || user.role === 'admin';
        const p = isTrainer
          ? await getTrainerPrograms(user.id)
          : (await getUserEnrollments(user.id)).map((e) => e.program as Program).filter(Boolean);
        setPrograms(p);
      } catch (err) {
        console.error('Error loading user programs:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-[var(--color-cream-300)]">Loading trainings...</div>;
  }

  if (!user) return <NotLoggedIn />;

  const isTrainer = user.role === 'trainer' || user.role === 'admin';

  const upcoming = programs.filter((p) => p.status === 'upcoming');
  const inProgress = programs.filter((p) => p.status === 'in-progress');
  const completed = programs.filter((p) => p.status === 'completed');

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-cream-50)]">My Trainings</h1>
        <p className="mt-2 text-[var(--color-muted)]">
          {isTrainer
            ? 'Programs you are assigned to as a trainer.'
            : 'Programs you are enrolled in.'}
        </p>
      </div>

      {programs.length === 0 ? (
        <EmptyState isTrainer={isTrainer} />
      ) : (
        <div className="space-y-10">
          {/* In Progress */}
          {inProgress.length > 0 && (
            <section aria-labelledby="in-progress-heading">
              <h2
                id="in-progress-heading"
                className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-cream-200)]"
              >
                <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" aria-hidden="true" />
                In Progress
                <span className="ml-1 text-sm font-normal text-[var(--color-muted)]">
                  ({inProgress.length})
                </span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {inProgress.map((p) => (
                  <ProgramCard key={p.id} program={p} role={user.role || 'trainee'} />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section aria-labelledby="upcoming-heading">
              <h2
                id="upcoming-heading"
                className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-cream-200)]"
              >
                <span className="h-2 w-2 rounded-full bg-[var(--color-orange-500)]" aria-hidden="true" />
                Upcoming
                <span className="ml-1 text-sm font-normal text-[var(--color-muted)]">
                  ({upcoming.length})
                </span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {upcoming.map((p) => (
                  <ProgramCard key={p.id} program={p} role={user.role || 'trainee'} />
                ))}
              </div>
            </section>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <section aria-labelledby="completed-heading">
              <h2
                id="completed-heading"
                className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-cream-200)]"
              >
                <span className="h-2 w-2 rounded-full bg-[var(--color-muted)]" aria-hidden="true" />
                Completed
                <span className="ml-1 text-sm font-normal text-[var(--color-muted)]">
                  ({completed.length})
                </span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {completed.map((p) => (
                  <ProgramCard key={p.id} program={p} role={user.role || 'trainee'} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function ProgramCard({ program, role }: { program: Program; role: string }) {
  return (
    <Link
      href={`/programs/${program.id}`}
      className="group flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 transition-all duration-200 hover:border-[var(--color-orange-500)]/50 hover:shadow-lg hover:shadow-[var(--color-orange-500)]/5 focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
      aria-label={`${program.title} — ${program.status}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-cream-400)]">
          {program.category}
        </span>
        <StatusBadge status={program.status} />
      </div>

      <h3 className="mb-2 text-base font-semibold text-[var(--color-cream-100)] transition-colors group-hover:text-[var(--color-orange-400)]">
        {program.title}
      </h3>

      <p className="mb-4 line-clamp-2 text-sm text-[var(--color-cream-400)]">
        {program.short_description}
      </p>

      <div className="mt-auto space-y-1 text-xs text-[var(--color-muted)]">
        <div className="flex items-center gap-2">
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>
            {new Date(program.start_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}{' '}
            –{' '}
            {new Date(program.end_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{program.venue}</span>
        </div>
        {role === 'trainee' && (
          <div className="flex items-center gap-2">
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>{program.trainer_name}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
