-- Run once in Supabase SQL editor
create table if not exists public.scraped_brands (
  id           bigint generated always as identity primary key,
  country      text not null,
  rank         int  not null,
  brand_name   text not null,
  brand_slug   text not null,
  brand_url    text,
  mentions     int  default 0,
  scraped_at   timestamptz default now()
);

create index if not exists scraped_brands_country_rank on public.scraped_brands (country, rank);

-- Public read access (no auth needed to browse brands)
alter table public.scraped_brands enable row level security;
create policy "public read" on public.scraped_brands for select using (true);
