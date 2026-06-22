import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lbvltsahxiavgvnzgqon.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxidmx0c2FoeGlhdmd2bnpncW9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MDYxMDAsImV4cCI6MjA5NDQ4MjEwMH0.exLWc8K2kmH5aSKFxXJRCfcuh4lyEGjpcmCoPJQqCgw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
