create table scans (
  id bigint generated always as identity primary key,
  snippet text not null check (char_length(snippet) <= 80),
  score int not null check (score between 0 and 100),
  verdict text not null check (verdict in ('SAFE','SUSPICIOUS','PHISHING')),
  created_at timestamptz default now()
);
alter table scans enable row level security;
create policy "read" on scans for select using (true);
create policy "insert" on scans for insert with check (true);
alter publication supabase_realtime add table scans;
