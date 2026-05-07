'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { getPrograms } from '@/lib/data';
import ProgramSearch from '@/components/ProgramSearch';
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

function CapacityBar({ enrolled, capacity }: { enrolled: number; capacity: number }) {
  const pct = Math.round((enrolled / capacity) * 100);
  const isFull = enrolled >= capacity;

  return (
    <div className="mt-3">
      <div className="mb-1 flex justify-between text-xs text-[var(--color-muted)]">
        <span>
          {enrolled}/{capacity} enrolled
        </span>
        <span>{isFull ? 'Full' : `${pct}%`}</span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]"
        role="progressbar"
        aria-valuenow={enrolled}
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-label={`Enrollment: ${enrolled} of ${capacity}`}
      >
        <div
          className={`h-full rounded-full transition-all ${
            isFull ? 'bg-[var(--color-error)]' : 'bg-[var(--color-orange-500)]'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ProgramsPage() {
  const [allPrograms, setAllPrograms] = useState<Program[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPrograms().then(data => {
      setAllPrograms(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return allPrograms;
    const q = searchQuery.toLowerCase();
    return allPrograms.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.short_description || '').toLowerCase().includes(q)
    );
  }, [allPrograms, searchQuery]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-cream-50)]">Program Catalog</h1>
        <p className="mt-2 text-[var(--color-muted)]">
          Explore and enroll in training programs to level up your skills.
        </p>
      </div>

      {/* Search */}
      <div className="mb-8">
        <ProgramSearch onSearch={setSearchQuery} resultCount={filtered.length} />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-16 text-center text-[var(--color-cream-300)]">Loading programs...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-lg text-[var(--color-muted)]">No programs match your search.</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 text-sm font-medium text-[var(--color-orange-400)] hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((program, i) => (
            <Link
              key={program.id}
              href={`/programs/${program.id}`}
              className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 transition-all duration-300 hover:border-[var(--color-orange-500)]/50 hover:shadow-lg hover:shadow-[var(--color-orange-500)]/5 focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
              style={{ animationDelay: `${i * 60}ms` }}
              aria-label={`${program.title} — ${program.category} — ${program.status}`}
            >
              {/* Category + Status */}
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-cream-400)]">
                  {program.category}
                </span>
                <StatusBadge status={program.status} />
              </div>

              {/* Title */}
              <h2 className="mb-2 text-lg font-semibold text-[var(--color-cream-100)] transition-colors group-hover:text-[var(--color-orange-400)]">
                {program.title}
              </h2>

              {/* Description */}
              <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-[var(--color-cream-400)]">
                {program.short_description}
              </p>

              {/* Meta */}
              <div className="space-y-1.5 text-xs text-[var(--color-muted)]">
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
                      year: 'numeric',
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
              </div>

              {/* Capacity Bar */}
              <CapacityBar enrolled={program.enrolled_count || 0} capacity={program.capacity} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
