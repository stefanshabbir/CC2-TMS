'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getProgramById, isUserEnrolled } from '@/lib/data';
import { useAuth } from '@/lib/auth';
import EnrollButton from '@/components/EnrollButton';
import type { Program } from '@/lib/types';

export default function ProgramDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const id = params.id as string;

  const [program, setProgram] = useState<Program | null | undefined>(undefined);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const p = await getProgramById(id);
      setProgram(p || null);
      if (p && user) {
        const isEnrolled = await isUserEnrolled(user.id, id);
        setEnrolled(isEnrolled);
      }
      setLoading(false);
    }
    load();
  }, [id, user]);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-[var(--color-cream-300)]">Loading program details...</div>;
  }

  if (!program) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-[var(--color-cream-100)]">
            Program Not Found
          </h1>
          <p className="mb-4 text-[var(--color-muted)]">
            The program you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/programs"
            className="text-sm font-medium text-[var(--color-orange-400)] hover:underline"
          >
            ← Back to catalog
          </Link>
        </div>
      </div>
    );
  }

  const isFull = (program.enrolled_count || 0) >= program.capacity;

  const statusStyles: Record<string, string> = {
    upcoming:
      'bg-[var(--color-orange-500)]/15 text-[var(--color-orange-400)] border-[var(--color-orange-500)]/30',
    'in-progress':
      'bg-[var(--color-success)]/15 text-[var(--color-success)] border-[var(--color-success)]/30',
    completed:
      'bg-[var(--color-muted)]/15 text-[var(--color-muted)] border-[var(--color-muted)]/30',
  };

  const statusLabels: Record<string, string> = {
    upcoming: 'Upcoming',
    'in-progress': 'In Progress',
    completed: 'Completed',
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
          <li>
            <Link
              href="/programs"
              className="transition-colors hover:text-[var(--color-cream-300)]"
            >
              Catalog
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-[var(--color-cream-300)]" aria-current="page">
            {program.title}
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Header */}
          <div className="mb-6">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-cream-400)]">
                {program.category}
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyles[program.status]}`}
              >
                {statusLabels[program.status]}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-[var(--color-cream-50)] lg:text-4xl">
              {program.title}
            </h1>
          </div>

          {/* Description */}
          <section aria-labelledby="desc-heading" className="mb-8">
            <h2
              id="desc-heading"
              className="mb-3 text-lg font-semibold text-[var(--color-cream-200)]"
            >
              About This Program
            </h2>
            <p className="leading-relaxed text-[var(--color-cream-300)]">{program.description}</p>
          </section>

          {/* Schedule & Venue */}
          <section
            aria-labelledby="details-heading"
            className="mb-8 grid gap-4 sm:grid-cols-2"
          >
            <h2 id="details-heading" className="sr-only">
              Program details
            </h2>

            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--color-cream-400)]">
                <svg
                  className="h-4 w-4"
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
                Schedule
              </div>
              <p className="text-[var(--color-cream-100)]">
                {new Date(program.start_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
                –{' '}
                {new Date(program.end_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--color-cream-400)]">
                <svg
                  className="h-4 w-4"
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
                Venue
              </div>
              <p className="text-[var(--color-cream-100)]">{program.venue}</p>
            </div>
          </section>

          {/* Trainer Bio */}
          <section aria-labelledby="trainer-heading" className="mb-8">
            <h2
              id="trainer-heading"
              className="mb-4 text-lg font-semibold text-[var(--color-cream-200)]"
            >
              Your Trainer
            </h2>
            <div className="flex items-start gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
              {/* Avatar placeholder */}
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-orange-500)] to-[var(--color-orange-600)] text-xl font-bold text-white"
                aria-hidden="true"
              >
                {(program.trainer_name || 'T')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
              <div>
                <h3 className="text-base font-semibold text-[var(--color-cream-100)]">
                  {program.trainer_name}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--color-cream-400)]">
                  {program.trainer_bio}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1" aria-label="Enrollment">
          <div className="sticky top-24 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 shadow-xl shadow-black/10">
            {/* Capacity */}
            <div className="mb-6">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-[var(--color-cream-300)]">Capacity</span>
                <span className="font-semibold text-[var(--color-cream-100)]">
                  {program.enrolled_count || 0}/{program.capacity}
                </span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-border)]"
                role="progressbar"
                aria-valuenow={program.enrolled_count || 0}
                aria-valuemin={0}
                aria-valuemax={program.capacity}
                aria-label={`${program.enrolled_count || 0} of ${program.capacity} spots filled`}
              >
                <div
                  className={`h-full rounded-full transition-all ${
                    isFull ? 'bg-[var(--color-error)]' : 'bg-[var(--color-orange-500)]'
                  }`}
                  style={{
                    width: `${Math.round(((program.enrolled_count || 0) / program.capacity) * 100)}%`,
                  }}
                />
              </div>
              {isFull && (
                <p className="mt-2 text-xs text-[var(--color-error)]">
                  This program has reached maximum capacity.
                </p>
              )}
            </div>

            {/* Enroll Button */}
            <EnrollButton
              programId={program.id}
              programTitle={program.title}
              isFull={isFull}
              isAlreadyEnrolled={enrolled}
            />

            {/* Quick info */}
            <div className="mt-6 space-y-3 border-t border-[var(--color-border)] pt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-muted)]">Category</span>
                <span className="text-[var(--color-cream-200)]">{program.category}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-muted)]">Duration</span>
                <span className="text-[var(--color-cream-200)]">
                  {Math.ceil(
                    (new Date(program.end_date).getTime() -
                      new Date(program.start_date).getTime()) /
                      (1000 * 60 * 60 * 24)
                  ) + 1}{' '}
                  days
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-muted)]">Trainer</span>
                <span className="text-[var(--color-cream-200)]">{program.trainer_name}</span>
              </div>
            </div>

            {/* Resources Link */}
            <div className="mt-4 border-t border-[var(--color-border)] pt-4">
              <Link
                href={`/programs/${program.id}/resources`}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border-light)] px-4 py-2.5 text-sm font-medium text-[var(--color-cream-300)] transition-colors hover:border-[var(--color-orange-500)] hover:text-[var(--color-orange-400)]"
              >
                📂 View Resources
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
