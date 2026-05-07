'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { getAllUsers } from '@/lib/data';
import { createClient } from '@/lib/supabase/client';
import type { Profile, UserRole } from '@/lib/types';

export default function UserManagementPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('trainee');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (user?.role !== 'admin') {
        setLoading(false);
        return;
      }
      try {
        const u = await getAllUsers();
        setUsers(u);
      } catch (err) {
        console.error('Error loading users:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-[var(--color-cream-300)]">Loading users...</div>;
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

  const startEdit = (u: Profile) => {
    setEditingId(u.id);
    setEditRole(u.role || 'trainee');
  };

  const saveRole = async (id: string) => {
    const supabase = createClient();
    const roleId = editRole === 'admin' ? 1 : editRole === 'trainer' ? 2 : 3;
    
    const { error } = await supabase.from('profiles').update({ role_id: roleId }).eq('id', id);
    if (!error) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: editRole } : u));
      setFeedback(`Role updated successfully.`);
    } else {
      setFeedback(`Error: ${error.message}`);
    }
    setEditingId(null);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    // Supabase auth.users delete must usually be done via edge functions or service role,
    // but we can delete the profile if RLS permits. Usually admins have this permission.
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (!error) {
      setUsers(prev => prev.filter(u => u.id !== id));
      setFeedback('User removed.');
    } else {
      setFeedback(`Error: ${error.message}`);
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  const roleBadge = (role: UserRole) => {
    const cls = role === 'admin'
      ? 'border-[var(--color-orange-500)]/30 bg-[var(--color-orange-500)]/15 text-[var(--color-orange-400)]'
      : role === 'trainer'
      ? 'border-blue-500/30 bg-blue-500/15 text-blue-400'
      : 'border-[var(--color-success)]/30 bg-[var(--color-success)]/15 text-[var(--color-success)]';
    return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${cls}`}>{role}</span>;
  };

  const admins = users.filter(u => u.role === 'admin');
  const trainers = users.filter(u => u.role === 'trainer');
  const trainees = users.filter(u => u.role === 'trainee');

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-cream-50)]">User Management</h1>
        <p className="mt-1 text-[var(--color-muted)]">
          Manage accounts, verify registrations, and assign roles. {' '}
          <span className="text-[var(--color-cream-400)]">{users.length} total users</span>
          {' · '}<span className="text-[var(--color-orange-400)]">{admins.length} admins</span>
          {' · '}<span className="text-blue-400">{trainers.length} trainers</span>
          {' · '}<span className="text-[var(--color-success)]">{trainees.length} trainees</span>
        </p>
      </div>

      {feedback && (
        <div role="status" className="mb-6 rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 p-4 text-sm text-[var(--color-success)]">{feedback}</div>
      )}

      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wider text-[var(--color-muted)]">
                <th className="px-6 py-3 font-medium" scope="col">User</th>
                <th className="px-6 py-3 font-medium" scope="col">Email</th>
                <th className="px-6 py-3 font-medium" scope="col">Role</th>
                <th className="px-6 py-3 font-medium" scope="col">Joined</th>
                <th className="px-6 py-3 font-medium text-right" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-[var(--color-border)] last:border-0 transition-colors hover:bg-[var(--color-bg-elevated)]/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-orange-500)] to-[var(--color-orange-600)] text-xs font-bold text-white" aria-hidden="true">
                        {u.full_name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-medium text-[var(--color-cream-100)]">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[var(--color-cream-400)]">{u.email}</td>
                  <td className="px-6 py-4">
                    {editingId === u.id ? (
                      <select value={editRole} onChange={e => setEditRole(e.target.value as UserRole)} className="rounded-md border border-[var(--color-border-light)] bg-[var(--color-bg-surface)] px-2 py-1 text-xs text-[var(--color-cream-100)]" aria-label="Select new role">
                        <option value="admin">Admin</option>
                        <option value="trainer">Trainer</option>
                        <option value="trainee">Trainee</option>
                      </select>
                    ) : roleBadge(u.role || 'trainee')}
                  </td>
                  <td className="px-6 py-4 text-xs text-[var(--color-muted)]">
                    {new Date(u.created_at || new Date().toISOString()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {editingId === u.id ? (
                        <>
                          <button onClick={() => saveRole(u.id)} className="rounded-md bg-[var(--color-orange-500)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-orange-600)]">Save</button>
                          <button onClick={() => setEditingId(null)} className="rounded-md border border-[var(--color-border-light)] px-3 py-1.5 text-xs text-[var(--color-cream-300)]">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(u)} className="rounded-md border border-[var(--color-border-light)] px-3 py-1.5 text-xs font-medium text-[var(--color-cream-300)] hover:border-[var(--color-orange-500)] hover:text-[var(--color-orange-400)]">Change Role</button>
                          {u.id !== user.id && (
                            <button onClick={() => handleDelete(u.id)} className="rounded-md border border-[var(--color-error)]/30 px-3 py-1.5 text-xs font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/10">Remove</button>
                          )}
                        </>
                      )}
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
