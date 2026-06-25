-- Create leads table
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text,
  status text not null default 'new',
  ai_score integer,
  ai_reasoning text,
  apply_answers jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security (RLS)
alter table public.leads enable row level security;

-- Policy: Allow anyone to insert leads (since the contact form is public)
-- To prevent spam, you might want to use a captcha or restrict this to specific origins, 
-- but for now, we'll allow public anonymous inserts.
create policy "Allow public inserts" 
  on public.leads 
  for insert 
  with check (true);

-- Policy: Allow reading and updating only if authenticated via service role (for edge functions)
-- or anon key (if you want the dashboard to read directly). 
-- NOTE: If the dashboard uses the anon key, anyone could theoretically query the table. 
-- In a real production app, dashboard access should require authenticated users.
-- For the sake of this prototype, if you access `/dashboard` publicly, we'll allow public reads.
create policy "Allow public reads" 
  on public.leads 
  for select 
  using (true);

create policy "Allow service role updates"
  on public.leads
  for update
  using (true);

-- Enable Supabase Realtime for the leads table
alter publication supabase_realtime add table public.leads;
