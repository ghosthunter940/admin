// File ini berisi header standar untuk keamanan (CORS)
// yang memungkinkan function Anda dipanggil dari browser jika diperlukan.

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
