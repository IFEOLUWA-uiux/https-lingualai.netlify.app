import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rpvyhtexkhkkraiwpanb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwdnlodGV4a2hra3JhaXdwYW5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyODMyODAsImV4cCI6MjA5Njg1OTI4MH0.hVVTVm8OH2VlOh9Vk4ujKHcaGYfPH_11QOqEHYwO-EM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
