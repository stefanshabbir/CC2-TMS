'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getProgramById, getProgramResources } from '@/lib/data';
import { useAuth } from '@/lib/auth';
import type { Resource, Program } from '@/lib/types';

const TYPE_META: Record<Resource['file_type'], { icon: string; color: string }> = {
  pdf: { icon: '📄', color: 'text-red-400' },
  slides: { icon: '📊', color: 'text-blue-400' },
  video: { icon: '🎬', color: 'text-purple-400' },
  document: { icon: '📝', color: 'text-green-400' },
  other: { icon: '📎', color: 'text-[var(--color-muted)]' },
};

export default function ResourcesPage() {
  const params = useParams();
  const { user } = useAuth();
  const id = params.id as string;
  
  const [program, setProgram] = useState<Program | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const p = await getProgramById(id);
      const res = await getProgramResources(id);
      setProgram(p || null);
      setResources(res);
      setLoading(false);
    }
    load();
  }, [id]);

  const canUpload = user?.role === 'trainer' || user?.role === 'admin';

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [ftype, setFtype] = useState<Resource['file_type']>('pdf');
  const [success, setSuccess] = useState(false);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-[var(--color-cream-300)]">Loading resources...</div>;
  }

  if (!program) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-[var(--color-cream-100)]">Not Found</h1>
          <Link href="/programs" className="text-sm text-[var(--color-orange-400)] hover:underline">← Back</Link>
        </div>
      </div>
    );
  }

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setShowForm(false);
    setTitle(''); setDesc('');
    setTimeout(() => setSuccess(false), 3000);
  };

  const inputCls = "block w-full rounded-lg border border-[var(--color-border-light)] bg-[var(--color-bg-surface)] px-4 py-3 text-[var(--color-cream-100)] placeholder-[var(--color-muted)] transition-colors focus:border-[var(--color-orange-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-500)]/40";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
          <li><Link href="/programs" className="hover:text-[var(--color-cream-300)]">Catalog</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href={`/programs/${id}`} className="hover:text-[var(--color-cream-300)]">{program.title}</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-[var(--color-cream-300)]" aria-current="page">Resources</li>
        </ol>
      </nav>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-cream-50)]">Resource Center</h1>
          <p className="mt-1 text-[var(--color-muted)]">Materials for <span className="text-[var(--color-cream-300)]">{program.title}</span></p>
        </div>
        {canUpload && (
          <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-[var(--color-orange-500)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-orange-500)]/25 transition-all hover:bg-[var(--color-orange-600)]">
            {showForm ? 'Cancel' : '+ Upload Resource'}
          </button>
        )}
      </div>

      {success && <div role="status" className="mb-6 rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 p-4 text-sm text-[var(--color-success)]">Resource uploaded!</div>}

      {showForm && canUpload && (
        <div className="mb-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
          <h2 className="mb-4 text-lg font-semibold text-[var(--color-cream-100)]">Upload New Resource</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label htmlFor="res-title" className="mb-1.5 block text-sm font-medium text-[var(--color-cream-200)]">Title</label>
              <input id="res-title" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Week 1 Slides" className={inputCls} />
            </div>
            <div>
              <label htmlFor="res-desc" className="mb-1.5 block text-sm font-medium text-[var(--color-cream-200)]">Description</label>
              <textarea id="res-desc" rows={2} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief description…" className={`${inputCls} resize-none`} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="res-type" className="mb-1.5 block text-sm font-medium text-[var(--color-cream-200)]">Type</label>
                <select id="res-type" value={ftype} onChange={e => setFtype(e.target.value as Resource['file_type'])} className={inputCls}>
                  <option value="pdf">PDF</option>
                  <option value="slides">Slide Deck</option>
                  <option value="video">Video</option>
                  <option value="document">Document</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="res-file" className="mb-1.5 block text-sm font-medium text-[var(--color-cream-200)]">File</label>
                <input id="res-file" type="file" className="block w-full rounded-lg border border-[var(--color-border-light)] bg-[var(--color-bg-surface)] px-4 py-2.5 text-sm text-[var(--color-cream-100)] file:mr-4 file:rounded-md file:border-0 file:bg-[var(--color-orange-500)]/20 file:px-3 file:py-1 file:text-sm file:font-medium file:text-[var(--color-orange-400)]" />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="rounded-lg bg-[var(--color-orange-500)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-orange-600)]">Upload</button>
            </div>
          </form>
        </div>
      )}

      {resources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border-light)] bg-[var(--color-bg-card)] px-8 py-16 text-center">
          <p className="text-lg text-[var(--color-muted)]">No resources uploaded yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {resources.map(res => {
            const t = TYPE_META[res.file_type];
            return (
              <div key={res.id} className="group flex items-start gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 transition-all hover:border-[var(--color-orange-500)]/40">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--color-bg-elevated)] text-2xl" aria-hidden="true">{t.icon}</div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-[var(--color-cream-100)]">{res.title}</h3>
                  <p className="mt-0.5 text-sm text-[var(--color-cream-400)]">{res.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted)]">
                    <span className={`rounded-full bg-[var(--color-bg-elevated)] px-2 py-0.5 font-medium uppercase ${t.color}`}>{res.file_type}</span>
                    <span>{res.file_size}</span>
                    <span>by {res.uploaded_by_name}</span>
                    <span>{new Date(res.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
                <button className="shrink-0 rounded-lg border border-[var(--color-border-light)] px-4 py-2 text-sm font-medium text-[var(--color-cream-300)] hover:border-[var(--color-orange-500)] hover:text-[var(--color-orange-400)]" aria-label={`Download ${res.title}`}>Download</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
