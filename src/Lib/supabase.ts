import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ufoxntrivdkzjqnscdjj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmb3hudHJpdmRrempxbnNjZGpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2OTMwNjMsImV4cCI6MjEwNjI2OTA2M30.vZ1m_ataGpcyCtVpA4UXjZJQ9rKjKRUx1rp7IAkXjXo';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: (url, options) => {
      return fetch(url, {
        ...options,
        cache: 'no-store',
      });
    },
  },
});