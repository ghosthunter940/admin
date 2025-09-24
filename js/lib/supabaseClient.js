// Import fungsi createClient dari pustaka Supabase melalui CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Ganti dengan URL dan Kunci Anon Supabase Anda
// Pastikan ini adalah kredensial yang benar untuk proyek Anda.
const SUPABASE_URL = 'https://fskpmmkfjzboohejdvfu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZza3BtbWtmanpib29oZWpkdmZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MjQwODMsImV4cCI6MjA3NDIwMDA4M30.dZWuyAaf7PdScK3Fgto55GlCcXExeSYHXxgKZJFfKi0';

// Buat dan EKSPOR koneksi Supabase agar bisa diimpor oleh file lain
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

