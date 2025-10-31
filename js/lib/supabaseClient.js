// Import fungsi createClient dari pustaka Supabase melalui CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Ganti dengan URL dan Kunci Anon Supabase Anda
// Pastikan ini adalah kredensial yang benar untuk proyek Anda.
const SUPABASE_URL = 'https://uklkjufdtwecjrmvavgv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbGtqdWZkdHdlY2pybXZhdmd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4OTIxNDMsImV4cCI6MjA3NzQ2ODE0M30.zB3-EfOqmehI386R7OmOPVl9igHvCR0EoLVjv44OeIw';

// Buat dan EKSPOR koneksi Supabase agar bisa diimpor oleh file lain
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


