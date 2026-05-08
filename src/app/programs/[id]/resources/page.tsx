'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getProgramById, getProgramResources, addResource, uploadFile, deleteResource } from '@/lib/data';
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
      try {
        const p = await getProgramById(id);
        const res = await getProgramResources(id);
        setProgram(p || null);
        setResources(res);
      } catch (err) {
        console.error('Error loading resources:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    if (user) {
      console.log('Current User Role:', user.role, 'Role ID:', user.role_id);
    }
  }, [user]);

  const canUpload = user?.role === 'trainer' || user?.role === 'admin' || user?.role_id === 2 || user?.role_id === 1;

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFile) return;

    // 1. Validation: Size limit (25MB)
    const MAX_SIZE = 25 * 1024 * 1024; // 25MB
    if (selectedFile.size > MAX_SIZE) {
      alert('File is too large! Maximum size is 25MB.');
      return;
    }

    // 2. Validation: Extension check
    const ALLOWED_EXTS = ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'txt', 'mp4', 'mp3', 'mov', 'avi', 'zip', 'png', 'jpg', 'jpeg'];
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTS.includes(ext)) {
      alert('This file type is not allowed. Please upload Documents, Media, or Presentations.');
      return;
    }

    setLoading(true);

    try {
      // 1. Upload file to storage bucket (named 'program-resources')
      const fileName = `${Date.now()}-${selectedFile.name}`;
      const filePath = `${id}/${fileName}`;
      const publicUrl = await uploadFile('program-resources', filePath, selectedFile);

      if (!publicUrl) {
        throw new Error('Failed to upload file to storage');
      }

      // 2. Derive file type
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      let detectedType: Resource['file_type'] = 'other';
      if (ext === 'pdf') detectedType = 'pdf';
      else if (['ppt', 'pptx'].includes(ext || '')) detectedType = 'slides';
      else if (['mp4', 'mov', 'avi'].includes(ext || '')) detectedType = 'video';
      else if (['doc', 'docx', 'txt'].includes(ext || '')) detectedType = 'document';

      // 3. Save metadata to DB
      const success = await addResource({
        program_id: id,
        file_name: title || selectedFile.name,
        description: desc,
        file_url: publicUrl,
        uid: user.id,
      });

      if (success) {
        const res = await getProgramResources(id);
        setResources(res);
        setSuccess(true);
        setShowForm(false);
        setTitle('');
        setDesc('');
        setSelectedFile(null);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      console.error('Upload process failed:', err.message);
      alert('Failed to upload resource. Please check if the bucket "program-resources" exists and is public.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (resourceId: string, fileUrl: string) => {
    if (!confirm('Are you sure you want to delete this resource? This cannot be undone.')) return;

    const success = await deleteResource(resourceId, fileUrl);
    if (success) {
      setResources(prev => prev.filter(r => r.id !== resourceId));
    } else {
      alert('Failed to delete resource.');
    }
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
            <div>
              <label htmlFor="res-file" className="mb-1.5 block text-sm font-medium text-[var(--color-cream-200)]">File</label>
              <input
                id="res-file"
                type="file"
                required
                accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.mp4,.mp3,.mov,.avi,.zip,.png,.jpg,.jpeg"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                className="block w-full rounded-lg border border-[var(--color-border-light)] bg-[var(--color-bg-surface)] px-4 py-2.5 text-sm text-[var(--color-cream-100)] file:mr-4 file:rounded-md file:border-0 file:bg-[var(--color-orange-500)]/20 file:px-3 file:py-1 file:text-sm file:font-medium file:text-[var(--color-orange-400)]"
              />
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
                  {res.description && <p className="mt-0.5 text-sm text-[var(--color-cream-400)]">{res.description}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted)]">
                    <span className={`rounded-full bg-[var(--color-bg-elevated)] px-2 py-0.5 font-medium uppercase ${t.color}`}>{res.file_type}</span>
                    <span>by {res.uploaded_by_name}</span>
                    <span>{new Date(res.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={res.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-[var(--color-border-light)] px-4 py-2 text-sm font-medium text-[var(--color-cream-300)] transition-colors hover:border-[var(--color-orange-500)] hover:text-[var(--color-orange-400)]"
                    aria-label={`Download ${res.title}`}
                  >
                    Download
                  </a>
                  {canUpload && (
                    <button
                      onClick={() => handleDelete(res.id, res.file_url)}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-error)]/20 text-[var(--color-error)] transition-colors hover:bg-[var(--color-error)]/10"
                      aria-label="Delete resource"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
