// Supabase Configuration
const SUPABASE_URL = 'https://etikcksmwuwovxougium.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0aWtja3Ntd3V3b3Z4b3VnaXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MjE4NzgsImV4cCI6MjA4MDk5Nzg3OH0.F3CfMrad9_DJZfZr-e72UZujD2uDLwr_qpk7N0Psu-U';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
