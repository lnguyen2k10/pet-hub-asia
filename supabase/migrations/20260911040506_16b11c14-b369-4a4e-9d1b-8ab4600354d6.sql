drop policy "blog_categories_admin_write" on public.blog_categories;
drop policy "blog_posts_admin_all" on public.blog_posts;
drop function if exists public.is_admin();

create policy "blog_categories_admin_write" on public.blog_categories for all to authenticated
using (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin'))
with check (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin'));

create policy "blog_posts_admin_all" on public.blog_posts for all to authenticated
using (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin'))
with check (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin'));