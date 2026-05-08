'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getProgramById, isUserEnrolled, getProgramResources, submitRating, getProgramRatings } from '@/lib/data';
import { useAuth } from '@/lib/auth';
import EnrollButton from '@/components/EnrollButton';
import type { Program, Resource, Rating } from '@/lib/types';

export default function ProgramDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const id = params.id as string;

  const [program, setProgram] = useState<Program | null | undefined>(undefined);
  const [enrolled, setEnrolled] = useState(false);
  const [hasResources, setHasResources] = useState(false);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const p = await getProgramById(id);
        setProgram(p || null);
        if (p) {
          const [isEnrolled, res, rates] = await Promise.all([
            user ? isUserEnrolled(user.id, id) : Promise.resolve(false),
            getProgramResources(id),
            getProgramRatings(id)
          ]);
          setEnrolled(isEnrolled);
          setHasResources(res.length > 0);
          setRatings(rates);
        }
      } catch (err) {
        console.error('Error loading program details:', err);
      } finally {
        setLoading(false);
      }
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

  const exportToCSV = () => {
    if (ratings.length === 0) return;
    
    const headers = ["User", "Role", "Rating", "Comments", "Date"];
    const rows = ratings.map(r => [
      r.user_name || 'Anonymous',
      r.feedback_type === 'trainer_to_session' ? 'Trainer' : 'Trainee',
      r.rating,
      `"${(r.comments || '').replace(/"/g, '""')}"`,
      new Date(r.submitted_at).toLocaleDateString()
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reviews_${program?.title?.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
                {' '}({new Date(program.start_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })})
                {' – '}
                {new Date(program.end_date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
                {' '}({new Date(program.end_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })})
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
              isCompleted={program.status === 'completed'}
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
                  {(() => {
                    const diffMs = new Date(program.end_date).getTime() - new Date(program.start_date).getTime();
                    const diffHours = diffMs / (1000 * 60 * 60);
                    if (diffHours < 24) {
                      return `${Math.round(diffHours * 10) / 10} hours`;
                    }
                    return `${Math.ceil(diffHours / 24)} days`;
                  })()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-muted)]">Trainer</span>
                <span className="text-[var(--color-cream-200)]">{program.trainer_name}</span>
              </div>
            </div>

            {/* Resources Link */}
            {(hasResources || user?.role === 'trainer' || user?.role === 'admin' || user?.role_id === 2 || user?.role_id === 1) && (
              <div className="mt-4 border-t border-[var(--color-border)] pt-4">
                <Link
                  href={`/programs/${program.id}/resources`}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border-light)] px-4 py-2.5 text-sm font-medium text-[var(--color-cream-300)] transition-colors hover:border-[var(--color-orange-500)] hover:text-[var(--color-orange-400)]"
                >
                  📂 View Resources
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Ratings Section */}
      <div className="mt-12 space-y-12">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <h2 className="text-3xl font-bold text-[var(--color-cream-50)]">Session Reviews</h2>
          {(user?.role === 'admin' || user?.role_id === 1) && ratings.length > 0 && (
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 rounded-lg border border-[var(--color-orange-500)]/30 bg-[var(--color-orange-500)]/10 px-4 py-2 text-sm font-semibold text-[var(--color-orange-400)] transition-all hover:bg-[var(--color-orange-500)] hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          )}
        </div>

        {program.status === 'completed' && (enrolled || user?.id === program.trainer_id) && (
          <RatingForm 
            programId={program.id} 
            userId={user?.id || ''} 
            role={user?.id === program.trainer_id ? 'trainer' : 'trainee'}
            onSubmitted={async () => {
              const rates = await getProgramRatings(program.id);
              setRatings(rates);
            }} 
          />
        )}

        {/* Trainer Feedback Section */}
        {ratings.some(r => r.feedback_type === 'trainer_to_session') && (
          <div className="space-y-6">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-[var(--color-cream-50)]">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-orange-500)]/20 text-[var(--color-orange-400)]">
                🏫
              </span>
              Trainer Insights
            </h2>
            <div className="grid grid-cols-1 gap-6">
              {ratings.filter(r => r.feedback_type === 'trainer_to_session').map(r => (
                <div key={r.id} className="rounded-2xl border border-[var(--color-orange-500)]/30 bg-[var(--color-orange-500)]/5 p-8 shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[var(--color-orange-500)] flex items-center justify-center font-bold text-white">
                        {r.user_name?.[0]}
                      </div>
                      <span className="font-bold text-lg text-[var(--color-cream-100)]">{r.user_name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[var(--color-orange-400)]">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`h-5 w-5 ${i < r.rating ? 'fill-current' : 'text-[var(--color-muted)]'}`} viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-lg italic leading-relaxed text-[var(--color-cream-100)]">&quot;{r.comments || 'No specific reflections provided.'}&quot;</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trainee Feedback Section */}
        <div className="space-y-6">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-[var(--color-cream-50)]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-success)]/20 text-[var(--color-success)]">
              🎓
            </span>
            Participant Feedback
          </h2>
          {ratings.some(r => r.feedback_type === 'trainee_to_program') ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {ratings.filter(r => r.feedback_type === 'trainee_to_program').map(r => (
                <div key={r.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 transition-all hover:border-[var(--color-orange-500)]/30 hover:shadow-xl">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-semibold text-[var(--color-cream-100)]">{r.user_name}</span>
                    <div className="flex items-center gap-1 text-[var(--color-orange-400)]">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`h-4 w-4 ${i < r.rating ? 'fill-current' : 'text-[var(--color-muted)]'}`} viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm italic text-[var(--color-cream-300)]">&quot;{r.comments || 'No written feedback provided.'}&quot;</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-12 text-center text-[var(--color-muted)]">
              No participant ratings yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RatingForm({ programId, userId, role, onSubmitted }: { programId: string, userId: string, role: 'trainer' | 'trainee', onSubmitted: () => void }) {
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await submitRating({ 
      program_id: programId, 
      user_id: userId, 
      rating, 
      comments,
      feedback_type: role === 'trainer' ? 'trainer_to_session' : 'trainee_to_program'
    });
    if (success) {
      setDone(true);
      onSubmitted();
    }
    setLoading(false);
  };

  if (done) return null;

  return (
    <div className="rounded-3xl border border-[var(--color-orange-500)]/30 bg-[var(--color-orange-500)]/5 p-8 shadow-2xl shadow-[var(--color-orange-500)]/5">
      <h3 className="mb-6 text-xl font-bold text-[var(--color-cream-50)]">Rate your experience</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-[var(--color-cream-200)]">Your Rating:</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`transition-transform hover:scale-110 ${star <= rating ? 'text-[var(--color-orange-500)]' : 'text-[var(--color-muted)]'}`}
              >
                <svg className="h-8 w-8 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-cream-200)]">Feedback (Optional)</label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="block w-full rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-surface)] p-4 text-[var(--color-cream-100)] placeholder-[var(--color-muted)] focus:border-[var(--color-orange-500)] focus:ring-1 focus:ring-[var(--color-orange-500)]"
            placeholder="What did you learn? How was the trainer?..."
            rows={3}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[var(--color-orange-500)] py-3 font-bold text-white transition-all hover:bg-[var(--color-orange-600)] hover:shadow-lg disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
}

