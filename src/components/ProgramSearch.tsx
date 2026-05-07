'use client';

import { useState, useId } from 'react';

interface ProgramSearchProps {
  onSearch: (query: string) => void;
  resultCount: number;
}

export default function ProgramSearch({ onSearch, resultCount }: ProgramSearchProps) {
  const [query, setQuery] = useState('');
  const inputId = useId();

  const handleChange = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="relative">
      <label htmlFor={inputId} className="sr-only">
        Search training programs
      </label>
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-muted)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search programs by title, category, or description…"
          className="block w-full rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-surface)] py-3.5 pl-12 pr-4 text-[var(--color-cream-100)] placeholder-[var(--color-muted)] transition-colors focus:border-[var(--color-orange-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-500)]/40"
          aria-describedby="search-results-count"
        />
      </div>
      <p
        id="search-results-count"
        className="mt-2 text-sm text-[var(--color-muted)]"
        aria-live="polite"
      >
        {query
          ? `${resultCount} program${resultCount !== 1 ? 's' : ''} found`
          : `${resultCount} programs available`}
      </p>
    </div>
  );
}
