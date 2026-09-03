-- roles
create type public.app_role as enum ('admin','moderator','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy user_roles_select_own on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- membership settings (single row)
create table public.membership_settings (
  id uuid primary key default gen_random_uuid(),
  price_amount numeric not null default 299000,
  currency text not null default 'VND',
  period_label text not null default 'năm',
  qr_image_url text,
  bank_info text,
  refund_note text not null default 'Cam kết hoàn phí 100% trong vòng 1 năm nếu bạn không hài lòng.',
  instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.membership_settings to anon, authenticated;
grant all on public.membership_settings to service_role;
alter table public.membership_settings enable row level security;
create policy membership_settings_public_read on public.membership_settings for select to anon, authenticated using (true);
create policy membership_settings_admin_write on public.membership_settings for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

insert into public.membership_settings (bank_info, instructions)
values ('Chủ tài khoản: 1PET ASIA — Vietcombank — 0123456789', 'Chuyển khoản đúng số tiền, nội dung: 1PET <email của bạn>. Sau đó tải ảnh chứng từ lên và chờ duyệt trong 24h.');

-- membership requests
create table public.membership_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shop_id uuid references public.shops(id) on delete set null,
  contact_name text,
  contact_phone text,
  amount numeric not null default 299000,
  proof_url text,
  note text,
  status text not null default 'pending',
  admin_note text,
  starts_at date,
  expires_at date,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.membership_requests to authenticated;
grant all on public.membership_requests to service_role;
alter table public.membership_requests enable row level security;

create policy membership_requests_select_own on public.membership_requests for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy membership_requests_insert_own on public.membership_requests for insert to authenticated
  with check (auth.uid() = user_id and status = 'pending');
create policy membership_requests_update_admin on public.membership_requests for update to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create trigger membership_settings_updated_at before update on public.membership_settings
  for each row execute function public.set_updated_at();
create trigger membership_requests_updated_at before update on public.membership_requests
  for each row execute function public.set_updated_at();

create index membership_requests_status_idx on public.membership_requests (status, created_at desc);