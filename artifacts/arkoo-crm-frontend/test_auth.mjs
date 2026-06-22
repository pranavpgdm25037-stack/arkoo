import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lbvltsahxiavgvnzgqon.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxidmx0c2FoeGlhdmd2bnpncW9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MDYxMDAsImV4cCI6MjA5NDQ4MjEwMH0.exLWc8K2kmH5aSKFxXJRCfcuh4lyEGjpcmCoPJQqCgw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log("Attempting login...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'arkooprebuildai@gmail.com',
    password: 'arkooprebuildai123',
  });

  if (error) {
    console.error("Auth Error:", error.message);
  } else {
    console.log("Auth Success! Session acquired.");
  }
}

testAuth();
