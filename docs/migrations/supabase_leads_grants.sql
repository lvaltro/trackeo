-- Corrige error 42501: permission denied for table leads.
-- Copiar TODO el bloque incluyendo las lineas que empiezan con --

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now()
);

grant usage on schema public to anon;
grant insert on public.leads to anon;
grant select on public.leads to anon;

alter table public.leads enable row level security;

drop policy if exists "Permitir insertar leads" on public.leads;
create policy "Permitir insertar leads"
  on public.leads
  for insert
  to anon
  with check (true);
