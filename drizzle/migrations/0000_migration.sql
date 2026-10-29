create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- First account ever created becomes the owner (admin)
create or replace function public.assign_first_owner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_owner after insert on auth.users
for each row execute function public.assign_first_owner();

create table public.site_settings (
  id int primary key default 1 check (id = 1),
  owner_name text not null default 'Md. Nafim Muttaki',
  owner_bio text not null default '',
  avatar_url text not null default '',
  discord_username text not null default '',
  discord_user_id text not null default '',
  discord_server_invite text not null default '',
  portfolio_url text not null default 'https://nafim.vercel.app',
  donate_url text not null default 'https://buymeacoffee.com/mdnafimmuttaki',
  github_url text not null default '',
  youtube_url text not null default '',
  x_url text not null default '',
  site_title text not null default 'NafChessLog',
  tagline text not null default 'Game Review',
  accent_color text not null default '#f2b632',
  board_light text not null default '#e8e2cc',
  board_dark text not null default '#5f8b62',
  announcement text not null default '',
  announcement_enabled boolean not null default false,
  default_sound boolean not null default true,
  default_black_view boolean not null default false,
  footer_note text not null default '',
  updated_at timestamptz not null default now()
);
grant select on public.site_settings to anon, authenticated;
grant update on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "Anyone reads settings" on public.site_settings for select to anon, authenticated using (true);
create policy "Owner updates settings" on public.site_settings for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

insert into public.site_settings (id) values (1);