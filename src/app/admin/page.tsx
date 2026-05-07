'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { getAdminStats, getPrograms } from '@/lib/data';
import type { Program } from '@/lib/types';

function StatCard({ label, value, sub, icon }: { label: string; value: number | string; sub?: string; icon: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--color-muted)]">{label}</span>
        <span className="text-2xl" aria-hidden="true">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-[var(--color-cream-50)]">{value}</p>
      {sub && <p className="mt-1 text-xs text-[var(--color-cream-400)]">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  
  const [stats, setStats] = useState<any>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (user?.role !== 'admin') {
        setLoading(false);
        return;
      }
      try {
        const s = await getAdminStats();
        const p = await getPrograms();
        setStats(s);
        setPrograms(p);
      } catch (err) {
        console.error('Error loading admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-[var(--color-cream-300)]">Loading dashboard...</div>;
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-[var(--color-cream-100)]">Access Denied</h1>
          <p className="mb-4 text-[var(--color-muted)]">You need admin privileges to view this page.</p>
          <Link href="/programs" className="text-sm text-[var(--color-orange-400)] hover:underline">← Back to catalog</Link>
        </div>
      </div>
    );
  }

  const recentPrograms = programs.slice(0, 5);
  const fillRate = stats.totalCapacity > 0 ? Math.round((stats.totalFilled / stats.totalCapacity) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-cream-50)]">Admin Console</h1>
        <p className="mt-1 text-[var(--color-muted)]">Platform overview and quick actions.</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Programs" value={stats.totalPrograms} sub={`${stats.upcomingPrograms} upcoming`} icon="📚" />
        <StatCard label="Active Trainers" value={stats.trainerCount} sub={`${stats.totalUsers} total users`} icon="👨‍🏫" />
        <StatCard label="Total Enrollments" value={stats.totalEnrollments} sub={`${fillRate}% avg fill rate`} icon="🎓" />
        <StatCard label="In Progress" value={stats.inProgressPrograms} sub={`${stats.completedPrograms} completed`} icon="⚡" />
      </div>

      {/* Quick Actions */}
      <div className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-cream-200)]">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/programs/new" className="rounded-lg bg-[var(--color-orange-500)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-orange-500)]/25 transition-all hover:bg-[var(--color-orange-600)]">
            + Create Program
          </Link>
          <Link href="/admin/programs" className="rounded-lg border border-[var(--color-border-light)] px-5 py-2.5 text-sm font-medium text-[var(--color-cream-300)] transition-colors hover:border-[var(--color-orange-500)] hover:text-[var(--color-orange-400)]">
            Manage Programs
          </Link>
          <Link href="/admin/users" className="rounded-lg border border-[var(--color-border-light)] px-5 py-2.5 text-sm font-medium text-[var(--color-cream-300)] transition-colors hover:border-[var(--color-orange-500)] hover:text-[var(--color-orange-400)]">
            Manage Users
          </Link>
        </div>
      </div>

      {/* Capacity Overview */}
      <div className="mb-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-cream-200)]">Capacity Overview</h2>
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-[var(--color-cream-300)]">Total seats filled</span>
          <span className="font-semibold text-[var(--color-cream-100)]">{stats.totalFilled} / {stats.totalCapacity}</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--color-border)]" role="progressbar" aria-valuenow={stats.totalFilled} aria-valuemin={0} aria-valuemax={stats.totalCapacity}>
          <div className="h-full rounded-full bg-gradient-to-r from-[var(--color-orange-500)] to-[var(--color-orange-400)] transition-all" style={{ width: `${fillRate}%` }} />
        </div>
        <p className="mt-2 text-xs text-[var(--color-muted)]">{stats.totalCapacity - stats.totalFilled} seats remaining across all programs</p>
      </div>

      {/* Recent Programs Table */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <h2 className="text-lg font-semibold text-[var(--color-cream-200)]">Recent Programs</h2>
          <Link href="/admin/programs" className="text-sm font-medium text-[var(--color-orange-400)] hover:underline">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wider text-[var(--color-muted)]">
                <th className="px-6 py-3 font-medium" scope="col">Program</th>
                <th className="px-6 py-3 font-medium" scope="col">Status</th>
                <th className="px-6 py-3 font-medium" scope="col">Enrolled</th>
                <th className="px-6 py-3 font-medium" scope="col">Trainer</th>
              </tr>
            </thead>
            <tbody>
              {recentPrograms.map(p => (
                <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0 transition-colors hover:bg-[var(--color-bg-elevated)]/50">
                  <td className="px-6 py-4">
                    <Link href={`/programs/${p.id}`} className="font-medium text-[var(--color-cream-100)] hover:text-[var(--color-orange-400)]">{p.title}</Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${p.status === 'upcoming' ? 'border-[var(--color-orange-500)]/30 bg-[var(--color-orange-500)]/15 text-[var(--color-orange-400)]' : p.status === 'in-progress' ? 'border-[var(--color-success)]/30 bg-[var(--color-success)]/15 text-[var(--color-success)]' : 'border-[var(--color-muted)]/30 bg-[var(--color-muted)]/15 text-[var(--color-muted)]'}`}>
                      {p.status === 'in-progress' ? 'In Progress' : p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[var(--color-cream-300)]">{p.enrolled_count || 0}/{p.capacity}</td>
                  <td className="px-6 py-4 text-[var(--color-cream-400)]">{p.trainer_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
