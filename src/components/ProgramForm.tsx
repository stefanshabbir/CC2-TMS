'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getAllUsers } from '@/lib/data';
import { createClient } from '@/lib/supabase/client';
import type { Program, Profile } from '@/lib/types';

interface ProgramFormProps {
  initialData?: Program;
  isEdit?: boolean;
}

export default function ProgramForm({ initialData, isEdit }: ProgramFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  const [trainers, setTrainers] = useState<Profile[]>([]);

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [shortDesc, setShortDesc] = useState(initialData?.short_description ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [category, setCategory] = useState(initialData?.category ?? '');
  const [trainerId, setTrainerId] = useState(initialData?.trainer_id ?? '');
  // Format dates for input type="date"
  const [startDate, setStartDate] = useState(initialData?.start_date ? new Date(initialData.start_date).toISOString().split('T')[0] : '');
  const [endDate, setEndDate] = useState(initialData?.end_date ? new Date(initialData.end_date).toISOString().split('T')[0] : '');
  const [venue, setVenue] = useState(initialData?.venue ?? '');
  const [capacity, setCapacity] = useState(initialData?.capacity?.toString() ?? '');
  const [status, setStatus] = useState<Program['status']>(initialData?.status ?? 'upcoming');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTrainers() {
      const users = await getAllUsers();
      setTrainers(users.filter(u => u.role === 'trainer' || u.role === 'admin'));
    }
    loadTrainers();
  }, []);

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-[var(--color-cream-100)]">Access Denied</h1>
          <Link href="/programs" className="text-sm text-[var(--color-orange-400)] hover:underline">← Back</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !category.trim() || !trainerId || !startDate || !endDate || !venue.trim() || !capacity) {
      setError('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    
    const supabase = createClient();
    const payload = {
      title,
      short_description: shortDesc,
      description,
      training_area: category,
      venue,
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate).toISOString(),
      capacity: parseInt(capacity, 10),
      status,
      trainer_id: trainerId,
      created_by: user.id
    };

    let resError;
    if (isEdit && initialData) {
      const { error } = await supabase.from('training_programs').update(payload).eq('id', initialData.id);
      resError = error;
    } else {
      const { error } = await supabase.from('training_programs').insert(payload);
      resError = error;
    }

    if (resError) {
      setError(`Error saving program: ${resError.message}`);
      setSaving(false);
    } else {
      router.push('/admin/programs');
    }
  };

  const inputCls = "block w-full rounded-lg border border-[var(--color-border-light)] bg-[var(--color-bg-surface)] px-4 py-3 text-[var(--color-cream-100)] placeholder-[var(--color-muted)] transition-colors focus:border-[var(--color-orange-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-500)]/40";
  const labelCls = "mb-1.5 block text-sm font-medium text-[var(--color-cream-200)]";

  const categories = ['Cloud Computing', 'Web Development', 'Data Science', 'Security', 'Soft Skills', 'Project Management', 'DevOps', 'AI/ML'];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
          <li><Link href="/admin" className="hover:text-[var(--color-cream-300)]">Dashboard</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/admin/programs" className="hover:text-[var(--color-cream-300)]">Programs</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-[var(--color-cream-300)]" aria-current="page">{isEdit ? 'Edit' : 'Create'}</li>
        </ol>
      </nav>

      <h1 className="mb-8 text-3xl font-bold text-[var(--color-cream-50)]">
        {isEdit ? 'Edit Program' : 'Create New Program'}
      </h1>

      {error && (
        <div role="alert" className="mb-6 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 p-4 text-sm text-[var(--color-error)]">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8">
        {/* Title */}
        <div>
          <label htmlFor="pf-title" className={labelCls}>Program Title *</label>
          <input id="pf-title" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Cloud Infrastructure Fundamentals" className={inputCls} />
        </div>

        {/* Short Description */}
        <div>
          <label htmlFor="pf-short" className={labelCls}>Short Description *</label>
          <input id="pf-short" required value={shortDesc} onChange={e => setShortDesc(e.target.value)} placeholder="One-line summary for catalog cards" className={inputCls} />
        </div>

        {/* Full Description */}
        <div>
          <label htmlFor="pf-desc" className={labelCls}>Full Description</label>
          <textarea id="pf-desc" rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Detailed program description…" className={`${inputCls} resize-none`} />
        </div>

        {/* Category + Status */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-cat" className={labelCls}>Training Area / Category *</label>
            <select id="pf-cat" required value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
              <option value="">Select category…</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="pf-status" className={labelCls}>Status</label>
            <select id="pf-status" value={status} onChange={e => setStatus(e.target.value as Program['status'])} className={inputCls}>
              <option value="upcoming">Upcoming</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Trainer + Capacity */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-trainer" className={labelCls}>Assign Trainer *</label>
            <select id="pf-trainer" required value={trainerId} onChange={e => setTrainerId(e.target.value)} className={inputCls}>
              <option value="">Select trainer…</option>
              {trainers.map(t => <option key={t.id} value={t.id}>{t.full_name} ({t.email})</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="pf-cap" className={labelCls}>Capacity (max trainees) *</label>
            <input id="pf-cap" type="number" min={1} required value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="e.g. 30" className={inputCls} />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-start" className={labelCls}>Start Date *</label>
            <input id="pf-start" type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="pf-end" className={labelCls}>End Date *</label>
            <input id="pf-end" type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* Venue */}
        <div>
          <label htmlFor="pf-venue" className={labelCls}>Venue *</label>
          <input id="pf-venue" required value={venue} onChange={e => setVenue(e.target.value)} placeholder="e.g. Tech Hub — Conference Room A, Floor 3" className={inputCls} />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] pt-6">
          <Link href="/admin/programs" className="rounded-lg border border-[var(--color-border-light)] px-5 py-2.5 text-sm font-medium text-[var(--color-cream-300)] hover:border-[var(--color-cream-400)]">
            Cancel
          </Link>
          <button type="submit" disabled={saving} className="rounded-lg bg-[var(--color-orange-500)] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-orange-500)]/25 transition-all hover:bg-[var(--color-orange-600)] disabled:opacity-50">
            {saving ? 'Saving…' : isEdit ? 'Update Program' : 'Create Program'}
          </button>
        </div>
      </form>
    </div>
  );
}
