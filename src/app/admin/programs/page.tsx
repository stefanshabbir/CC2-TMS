'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { getPrograms } from '@/lib/data';
import { createClient } from '@/lib/supabase/client';
import type { Program } from '@/lib/types';

export default function ManageProgramsPage() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  useEffect(() => {
    async function load() {
      if (user?.role !== 'admin') {
        setLoading(false);
        return;
      }
      try {
        const p = await getPrograms();
        setPrograms(p);
      } catch (err) {
        console.error('Error loading programs:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-[var(--color-cream-300)]">Loading programs...</div>;
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-[var(--color-cream-100)]">Access Denied</h1>
          <p className="mb-4 text-[var(--color-muted)]">Admin privileges required.</p>
          <Link href="/programs" className="text-sm text-[var(--color-orange-400)] hover:underline">← Back</Link>
        </div>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('training_programs').delete().eq('id', id);
    if (!error) {
      setPrograms(prev => prev.filter(p => p.id !== id));
    } else {
      console.error('Delete failed:', error);
    }
    setDeleteConfirm(null);
  };

  const statusBadge = (status: Program['status']) => {
    const s = status || 'upcoming';
    const cls = s === 'upcoming'
      ? 'border-[var(--color-orange-500)]/30 bg-[var(--color-orange-500)]/15 text-[var(--color-orange-400)]'
      : s === 'in-progress'
      ? 'border-[var(--color-success)]/30 bg-[var(--color-success)]/15 text-[var(--color-success)]'
      : 'border-[var(--color-muted)]/30 bg-[var(--color-muted)]/15 text-[var(--color-muted)]';
    const label = s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1);
    return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-cream-50)]">Program Management</h1>
          <p className="mt-1 text-[var(--color-muted)]">Create, edit, and manage training programs.</p>
        </div>
        <Link href="/admin/programs/new" className="rounded-lg bg-[var(--color-orange-500)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-orange-500)]/25 transition-all hover:bg-[var(--color-orange-600)]">
          + Create Program
        </Link>
      </div>

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div className="mb-6 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 p-4">
          <p className="mb-3 text-sm text-[var(--color-error)]">Are you sure you want to delete this program? This action cannot be undone.</p>
          <div className="flex gap-2">
            <button onClick={() => handleDelete(deleteConfirm)} className="rounded-lg bg-[var(--color-error)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">Delete</button>
            <button onClick={() => setDeleteConfirm(null)} className="rounded-lg border border-[var(--color-border-light)] px-4 py-2 text-sm font-medium text-[var(--color-cream-300)] hover:border-[var(--color-cream-400)]">Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wider text-[var(--color-muted)]">
                <th className="px-6 py-3 font-medium" scope="col">Program</th>
                <th className="px-6 py-3 font-medium" scope="col">Category</th>
                <th className="px-6 py-3 font-medium" scope="col">Status</th>
                <th className="px-6 py-3 font-medium" scope="col">Dates</th>
                <th className="px-6 py-3 font-medium" scope="col">Capacity</th>
                <th className="px-6 py-3 font-medium text-right" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {programs.map(p => (
                <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0 transition-colors hover:bg-[var(--color-bg-elevated)]/50">
                  <td className="px-6 py-4">
                    <Link href={`/programs/${p.id}`} className="font-medium text-[var(--color-cream-100)] hover:text-[var(--color-orange-400)]">{p.title}</Link>
                    <p className="mt-0.5 text-xs text-[var(--color-muted)]">{p.trainer_name}</p>
                  </td>
                  <td className="px-6 py-4 text-[var(--color-cream-400)]">{p.category}</td>
                  <td className="px-6 py-4">{statusBadge(p.status)}</td>
                  <td className="px-6 py-4 text-xs text-[var(--color-cream-400)]">
                    {new Date(p.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(p.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-[var(--color-cream-300)]">{p.enrolled_count || 0}/{p.capacity}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/programs/${p.id}/edit`} className="rounded-md border border-[var(--color-border-light)] px-3 py-1.5 text-xs font-medium text-[var(--color-cream-300)] hover:border-[var(--color-orange-500)] hover:text-[var(--color-orange-400)]">Edit</Link>
                      <button onClick={() => setDeleteConfirm(p.id)} className="rounded-md border border-[var(--color-error)]/30 px-3 py-1.5 text-xs font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/10">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
