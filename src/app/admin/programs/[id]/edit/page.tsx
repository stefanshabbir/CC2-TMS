'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getProgramById } from '@/lib/data';
import ProgramForm from '@/components/ProgramForm';
import Link from 'next/link';
import type { Program } from '@/lib/types';

export default function EditProgramPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [program, setProgram] = useState<Program | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const p = await getProgramById(id);
      setProgram(p || null);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-[var(--color-cream-300)]">Loading program...</div>;
  }

  if (!program) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-[var(--color-cream-100)]">Program Not Found</h1>
          <Link href="/admin/programs" className="text-sm text-[var(--color-orange-400)] hover:underline">← Back to programs</Link>
        </div>
      </div>
    );
  }

  return <ProgramForm initialData={program} isEdit />;
}
