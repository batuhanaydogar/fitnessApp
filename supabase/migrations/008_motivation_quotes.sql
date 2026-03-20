-- 008_motivation_quotes.sql
-- Motivasyon sozleri ve kullanici favorileri

create table if not exists public.motivational_quotes (
  id uuid primary key default gen_random_uuid(),
  quote text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_favorite_quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  quote_id uuid not null references public.motivational_quotes (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, quote_id)
);

alter table public.motivational_quotes enable row level security;
alter table public.user_favorite_quotes enable row level security;

drop policy if exists "motivational_quotes_select_active" on public.motivational_quotes;
create policy "motivational_quotes_select_active"
  on public.motivational_quotes
  for select
  using (is_active = true);

drop policy if exists "user_favorite_quotes_all_own" on public.user_favorite_quotes;
create policy "user_favorite_quotes_all_own"
  on public.user_favorite_quotes
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

insert into public.motivational_quotes (quote)
values
  ('Bugun yaptigin sey yarinki formunu olusturur.'),
  ('Kucuk ilerleme her gun tekrarlandiginda buyuk sonuclar getirir.'),
  ('Mazeret degil, tekrar sayisi biriktir.'),
  ('Bugunun zorlugu yarinin gucudur.'),
  ('Disiplin, motivasyonun bitti yerde devreye girer.'),
  ('Her tekrar, hedefe atilan sessiz bir imzadir.'),
  ('Hiz degil, sureklilik seni degistirir.'),
  ('Baslangic zor olabilir ama birakmak daha zor.'),
  ('Dunle yarisma, bugunku halinle yaris.'),
  ('Konfor alanindan ciktigin an gelisim baslar.')
on conflict (quote) do nothing;
