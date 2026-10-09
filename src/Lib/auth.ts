import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  username: string;
  phoneNumber: string;
  role: 'Admin' | 'OE Installer';
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  // Always get fresh user session directly from Supabase server state
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  // Fetch the matching profile record
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    // Fallback using user metadata if public.profiles isn't created yet
    return {
      id: user.id,
      email: user.email || '',
      fullName: user.user_metadata?.full_name || 'User',
      username: user.user_metadata?.username || user.email?.split('@')[0] || '',
      phoneNumber: user.user_metadata?.phone_number || '',
      role: user.user_metadata?.role || 'OE Installer',
    };
  }

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    username: profile.username || profile.email.split('@')[0],
    phoneNumber: profile.phone_number,
    role: profile.role || 'OE Installer',
  };
}

export async function signOutUser() {
  await supabase.auth.signOut();
  localStorage.clear(); // Clear cached session state completely
  window.location.reload();
}

export type UserRole = 'ADMIN' | 'INSTALLER' | 'AGENT' | string;