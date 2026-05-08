import { createClient } from './supabase/client';
import type { Program, Enrollment, Profile, Resource, UserRole, Rating } from './types';

const supabase = createClient();

// All functions execute async queries using the browser client
// Designed to be called from Client Components.
const calculateStatus = (startDate: string, endDate: string): 'upcoming' | 'in-progress' | 'completed' => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) return 'upcoming';
  if (now > end) return 'completed';
  return 'in-progress';
};

export async function getPrograms(): Promise<Program[]> {
  const { data, error } = await supabase
    .from('training_programs')
    .select('*, profiles!trainer_id(full_name, bio), enrollments(count)')
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching programs:', error);
    return [];
  }

  return (data as any[] || []).map((p: any) => ({
    ...p,
    trainer_name: p.profiles?.full_name,
    trainer_bio: p.profiles?.bio,
    category: p.training_area,
    status: calculateStatus(p.start_date, p.end_date),
    enrolled_count: (p as any).enrollments?.[0]?.count || 0
  }));
}

export async function getProgramById(id: string): Promise<Program | undefined> {
  const { data, error } = await supabase
    .from('training_programs')
    .select('*, profiles!trainer_id(full_name, bio), enrollments(count)')
    .eq('id', id)
    .single();

  if (error || !data) return undefined;

  return {
    ...data,
    trainer_name: data.profiles?.full_name,
    trainer_bio: data.profiles?.bio,
    category: data.training_area,
    status: calculateStatus(data.start_date, data.end_date),
    enrolled_count: (data as any).enrollments?.[0]?.count || 0
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

  return (data as any[] || []).map((e: any) => ({
    ...e,
    user_id: e.trainee_id, // Map for UI compatibility
    program: e.training_programs ? {
      ...e.training_programs,
      trainer_name: e.training_programs.profiles?.full_name,
      trainer_bio: e.training_programs.profiles?.bio,
      category: e.training_programs.training_area,
      status: calculateStatus(e.training_programs.start_date, e.training_programs.end_date)
    } : undefined
  }));
}

export async function getTrainerPrograms(trainerId: string): Promise<Program[]> {
  const { data, error } = await supabase
    .from('training_programs')
    .select('*, profiles!trainer_id(full_name, bio)')
    .eq('trainer_id', trainerId)
    .order('start_date', { ascending: true });

  if (error) return [];

  return (data || []).map((p: any) => ({
    ...p,
    trainer_name: p.profiles?.full_name,
    trainer_bio: p.profiles?.bio,
    category: p.training_area,
    status: calculateStatus(p.start_date, p.end_date)
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
    .select('*, profiles!uid(full_name)')
    .eq('program_id', programId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error('Error fetching resources:', error.message, '| Hint:', error.hint, '| Details:', error.details);
    return [];
  }

  return (data || []).map((r: any) => {
    const ext = r.file_name?.split('.').pop()?.toLowerCase();
    let detectedType: Resource['file_type'] = 'other';
    if (ext === 'pdf') detectedType = 'pdf';
    else if (['ppt', 'pptx'].includes(ext || '')) detectedType = 'slides';
    else if (['mp4', 'mov', 'avi'].includes(ext || '')) detectedType = 'video';
    else if (['doc', 'docx', 'txt'].includes(ext || '')) detectedType = 'document';

    return {
      ...r,
      title: r.file_name,
      description: r.description,
      uploaded_by_name: r.profiles?.full_name,
      file_type: detectedType
    };
  });
}

export async function getAllUsers(): Promise<Profile[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*, roles!role_id(role_name)')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error.message, '| Hint:', error.hint, '| Details:', error.details);
    return [];
  }

  return (data || []).map((u: any) => {
    const rawRole = (u.roles?.role_name || '').toLowerCase();
    let roleName: UserRole = 'trainee';
    if (rawRole.includes('admin')) roleName = 'admin';
    else if (rawRole.includes('trainer')) roleName = 'trainer';

    return {
      ...u,
      role: roleName
    };
  });
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
  const activeTrainers = new Set(programs.map((p: any) => p.trainer_id)).size;
  const totalEnrollments = enrollments.length;

  const programsWithStatus = programs.map((p: any) => ({
    ...p,
    status: calculateStatus(p.start_date, p.end_date)
  }));

  const upcomingPrograms = programsWithStatus.filter((p: any) => p.status === 'upcoming').length;
  const inProgressPrograms = programsWithStatus.filter((p: any) => p.status === 'in-progress').length;
  const completedPrograms = programsWithStatus.filter((p: any) => p.status === 'completed').length;

  const totalCapacity = programs.reduce((sum: number, p: any) => sum + (p.capacity || 0), 0);

  // Calculate total filled from enrollments table
  const totalFilled = enrollments.length;

  const totalUsers = users.length;
  const trainerCount = users.filter((u: any) => u.role_id === 2).length;
  const traineeCount = users.filter((u: any) => u.role_id === 3).length;

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

export async function addResource(payload: {
  program_id: string;
  file_name: string;
  description?: string;
  file_url: string;
  uid: string;
}): Promise<boolean> {
  const { error } = await supabase
    .from('program_materials')
    .insert(payload);

  if (error) {
    console.error('Error adding resource:', error.message, '| Hint:', error.hint, '| Details:', error.details);
    return false;
  }
  return true;
}

export async function uploadFile(bucket: string, path: string, file: File): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true });

  if (error) {
    console.error('Error uploading file:', error.message, '| Error Type:', (error as any).error, '| Status:', (error as any).status);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl;
}

export async function deleteResource(id: string, fileUrl: string): Promise<boolean> {
  // 1. Delete from DB
  const { error: dbError } = await supabase
    .from('program_materials')
    .delete()
    .eq('id', id);

  if (dbError) {
    console.error('Error deleting resource from DB:', dbError);
    return false;
  }

  // 2. Delete from Storage if URL is valid
  try {
    // Extract path from URL (e.g., https://.../storage/v1/object/public/bucket/path/to/file)
    // A simpler way is to pass the storage path directly, but let's try to parse if needed.
    // Assuming fileUrl contains the path after 'program-resources/'
    const urlParts = fileUrl.split('program-resources/');
    if (urlParts.length > 1) {
      const storagePath = decodeURIComponent(urlParts[1]);
      const { error: stError } = await supabase.storage
        .from('program-resources')
        .remove([storagePath]);

      if (stError) console.warn('Storage delete warning:', stError.message);
    }
  } catch (err) {
    console.warn('Could not delete from storage:', err);
  }

  return true;
}

export async function submitRating(payload: {
  program_id: string;
  user_id: string;
  rating: number;
  comments?: string;
  feedback_type: 'trainee_to_program' | 'trainer_to_session';
}): Promise<boolean> {
  const { error } = await supabase
    .from('feedback')
    .upsert(payload);

  if (error) {
    console.error('Error submitting rating:', error);
    return false;
  }
  return true;
}

export async function getProgramRatings(programId: string): Promise<Rating[]> {
  // 1. Fetch ratings first
  const { data: ratingsData, error: ratingsError } = await supabase
    .from('feedback')
    .select('*')
    .eq('program_id', programId)
    .order('submitted_at', { ascending: false });

  if (ratingsError) {
    console.error('Error fetching feedback:', ratingsError.message);
    return [];
  }

  if (!ratingsData || ratingsData.length === 0) return [];

  // 2. Fetch profiles for these ratings
  const uids = [...new Set(ratingsData.map((r: any) => r.user_id))];
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', uids);

  const profileMap = (profilesData || []).reduce((acc: Record<string, string>, p: any) => {
    acc[p.id] = p.full_name;
    return acc;
  }, {});

  // 3. Combine
  return ratingsData.map((r: any) => ({
    ...r,
    user_name: profileMap[r.user_id] || 'Participant'
  }));
}
