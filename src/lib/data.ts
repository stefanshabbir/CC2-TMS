import { createClient } from './supabase/client';
import type { Program, Enrollment, Profile, Resource } from './types';

// All functions execute async queries using the browser client
// Designed to be called from Client Components.

export async function getPrograms(): Promise<Program[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('training_programs')
    .select('*, profiles!trainer_id(full_name, bio)')
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching programs:', error);
    return [];
  }

  return (data || []).map(p => ({
    ...p,
    trainer_name: p.profiles?.full_name,
    trainer_bio: p.profiles?.bio,
    category: p.training_area,
  }));
}

export async function getProgramById(id: string): Promise<Program | undefined> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('training_programs')
    .select('*, profiles!trainer_id(full_name, bio)')
    .eq('id', id)
    .single();

  if (error || !data) return undefined;

  return {
    ...data,
    trainer_name: data.profiles?.full_name,
    trainer_bio: data.profiles?.bio,
    category: data.training_area,
  };
}

export async function getUserEnrollments(userId: string): Promise<(Enrollment & { program: Program })[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('enrollments')
    .select('*, training_programs(*, profiles!trainer_id(full_name, bio))')
    .eq('trainee_id', userId);

  if (error) {
    console.error('Error fetching enrollments:', error);
    return [];
  }

  return (data || []).map(e => ({
    ...e,
    user_id: e.trainee_id, // Map for UI compatibility
    program: e.training_programs ? {
      ...e.training_programs,
      trainer_name: e.training_programs.profiles?.full_name,
      trainer_bio: e.training_programs.profiles?.bio,
      category: e.training_programs.training_area,
    } : undefined
  }));
}

export async function getTrainerPrograms(trainerId: string): Promise<Program[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('training_programs')
    .select('*, profiles!trainer_id(full_name, bio)')
    .eq('trainer_id', trainerId)
    .order('start_date', { ascending: true });

  if (error) return [];

  return (data || []).map(p => ({
    ...p,
    trainer_name: p.profiles?.full_name,
    trainer_bio: p.profiles?.bio,
    category: p.training_area,
  }));
}

export async function isUserEnrolled(userId: string, programId: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('enrollments')
    .select('id')
    .eq('trainee_id', userId)
    .eq('program_id', programId)
    .neq('status', 'cancelled')
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error('Error checking enrollment:', error);
  }
  
  return !!data;
}

export async function enrollUser(userId: string, programId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('enrollments')
    .insert({
      trainee_id: userId,
      program_id: programId,
      status: 'confirmed'
    });
    
  if (error) {
    console.error('Enrollment failed:', error);
    return false;
  }
  
  // Update capacity (simple increment)
  await supabase.rpc('increment_enrollment', { row_id: programId });
  return true;
}

export async function getProgramResources(programId: string): Promise<Resource[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('program_materials')
    .select('*, profiles!uploaded_by(full_name)')
    .eq('program_id', programId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error('Error fetching resources:', error);
    return [];
  }

  return (data || []).map(r => ({
    ...r,
    title: r.file_name,
    uploaded_by_name: r.profiles?.full_name
  }));
}

export async function getAllUsers(): Promise<Profile[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*, roles!role_id(role_name)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return (data || []).map(u => ({
    ...u,
    role: u.roles?.role_name as any
  }));
}

export async function getAdminStats() {
  const supabase = createClient();
  
  // For simplicity, doing a few parallel requests
  const [programsRes, enrollmentsRes, usersRes] = await Promise.all([
    supabase.from('training_programs').select('*'),
    supabase.from('enrollments').select('*').neq('status', 'cancelled'),
    supabase.from('profiles').select('role_id')
  ]);

  const programs = programsRes.data || [];
  const enrollments = enrollmentsRes.data || [];
  const users = usersRes.data || [];

  const totalPrograms = programs.length;
  const activeTrainers = new Set(programs.map(p => p.trainer_id)).size;
  const totalEnrollments = enrollments.length;
  
  const upcomingPrograms = programs.filter(p => p.status === 'upcoming').length;
  const inProgressPrograms = programs.filter(p => p.status === 'in-progress').length;
  const completedPrograms = programs.filter(p => p.status === 'completed').length;
  
  const totalCapacity = programs.reduce((sum, p) => sum + (p.capacity || 0), 0);
  
  // Calculate total filled from enrollments table
  const totalFilled = enrollments.length;
  
  const totalUsers = users.length;
  const trainerCount = users.filter(u => u.role_id === 2).length;
  const traineeCount = users.filter(u => u.role_id === 3).length;

  return {
    totalPrograms,
    activeTrainers,
    totalEnrollments,
    upcomingPrograms,
    inProgressPrograms,
    completedPrograms,
    totalCapacity,
    totalFilled,
    totalUsers,
    trainerCount,
    traineeCount,
  };
}
