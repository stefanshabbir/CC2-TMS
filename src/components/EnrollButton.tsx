'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { enrollUser } from '@/lib/data';

interface EnrollButtonProps {
  programId: string;
  programTitle: string;
  isFull: boolean;
  isAlreadyEnrolled: boolean;
  isCompleted?: boolean;
}

export default function EnrollButton({
  programId,
  programTitle,
  isFull,
  isAlreadyEnrolled,
  isCompleted = false,
}: EnrollButtonProps) {
  const { user } = useAuth();
  const [enrolled, setEnrolled] = useState(isAlreadyEnrolled);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!user) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        Please{' '}
        <a href="/" className="text-[var(--color-orange-400)] underline">
          sign in
        </a>{' '}
        to enroll.
      </p>
    );
  }

  if (user.role === 'trainer') {
    return null; // Trainers don't enroll
  }

  const handleEnroll = async () => {
    if (!user) return;
    setIsSubmitting(true);
    setFeedback(null);

    const success = await enrollUser(user.id, programId);

    if (success) {
      setEnrolled(true);
      setFeedback(`Successfully enrolled in "${programTitle}"!`);
    } else {
      setFeedback('Failed to enroll. Please try again later.');
    }
    setIsSubmitting(false);
  };

  if (enrolled) {
    return (
      <div>
        <div className="flex items-center gap-2 rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-4 py-3 text-sm font-medium text-[var(--color-success)]">
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>You are enrolled</span>
        </div>
        {feedback && (
          <p role="status" className="mt-2 text-sm text-[var(--color-success)]">
            {feedback}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleEnroll}
        disabled={isFull || isSubmitting || isCompleted}
        className="w-full rounded-xl bg-[var(--color-orange-500)] px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-[var(--color-orange-500)]/25 transition-all hover:bg-[var(--color-orange-600)] hover:shadow-[var(--color-orange-600)]/30 focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-deep)] disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={isCompleted ? 'This program has ended' : isFull ? 'This program is full' : `Enroll in ${programTitle}`}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-5 w-5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Enrolling…
          </span>
        ) : isCompleted ? (
          'Session Ended'
        ) : isFull ? (
          'Program Full'
        ) : (
          'Enroll Now'
        )}
      </button>
      {isCompleted && (
        <p className="mt-2 text-center text-sm text-[var(--color-muted)]">
          Enrollment is closed for this session.
        </p>
      )}
      {!isCompleted && isFull && (
        <p className="mt-2 text-center text-sm text-[var(--color-muted)]">
          This program has reached maximum capacity.
        </p>
      )}
    </div>
  );
}
