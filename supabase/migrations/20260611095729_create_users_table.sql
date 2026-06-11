create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  created_at timestamp default now()
);