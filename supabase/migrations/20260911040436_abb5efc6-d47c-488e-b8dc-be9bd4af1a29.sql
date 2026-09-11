create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
$$;
revoke execute on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;

create table public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.blog_categories to anon;
grant select, insert, update, delete on public.blog_categories to authenticated;
grant all on public.blog_categories to service_role;
alter table public.blog_categories enable row level security;
create policy "blog_categories_public_read" on public.blog_categories for select to anon, authenticated using (true);
create policy "blog_categories_admin_write" on public.blog_categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content text not null default '',
  cover_url text,
  category_id uuid references public.blog_categories(id) on delete set null,
  author_id uuid references auth.users(id) on delete set null,
  author_name text,
  read_minutes int not null default 3,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index blog_posts_category_idx on public.blog_posts(category_id);
create index blog_posts_published_idx on public.blog_posts(is_published, published_at desc);
grant select on public.blog_posts to anon;
grant select, insert, update, delete on public.blog_posts to authenticated;
grant all on public.blog_posts to service_role;
alter table public.blog_posts enable row level security;
create policy "blog_posts_public_read" on public.blog_posts for select to anon, authenticated using (is_published = true);
create policy "blog_posts_admin_all" on public.blog_posts for all to authenticated using (public.is_admin()) with check (public.is_admin());

create trigger update_blog_categories_updated_at before update on public.blog_categories for each row execute function public.update_updated_at_column();
create trigger update_blog_posts_updated_at before update on public.blog_posts for each row execute function public.update_updated_at_column();

insert into public.blog_categories (slug, name, description, sort_order) values
  ('cham-soc-cho', 'Chăm sóc chó', 'Kinh nghiệm nuôi dưỡng, huấn luyện và chăm sóc chó cưng.', 1),
  ('cham-soc-meo', 'Chăm sóc mèo', 'Bí quyết chăm mèo khỏe mạnh, vui vẻ mỗi ngày.', 2),
  ('dinh-duong', 'Dinh dưỡng', 'Chế độ ăn, thức ăn hạt, pate và thực phẩm bổ sung.', 3),
  ('suc-khoe-thu-y', 'Sức khỏe & Thú y', 'Phòng bệnh, tiêm phòng và dấu hiệu cần đi khám.', 4);

insert into public.blog_posts (slug, title, excerpt, content, category_id, author_name, read_minutes, is_published, published_at)
values
  ('cham-soc-cho-con-moi-ve-nha', 'Chăm sóc chó con mới về nhà: 7 điều cần chuẩn bị',
   'Tuần đầu tiên quyết định rất nhiều đến thói quen của cún. Đây là danh sách chuẩn bị đầy đủ cho người nuôi lần đầu.',
   E'Đón một chú chó con về nhà là niềm vui lớn, nhưng cũng cần chuẩn bị kỹ.\n\n## 1. Không gian riêng\nChuẩn bị một góc yên tĩnh với đệm nằm, bát ăn và bát nước sạch.\n\n## 2. Thức ăn phù hợp\nGiữ nguyên loại thức ăn cũ trong 7 ngày đầu, sau đó đổi dần để tránh rối loạn tiêu hóa.\n\n## 3. Lịch tiêm phòng\nLiên hệ phòng khám thú y gần nhà để lên lịch tiêm mũi đầu tiên và tẩy giun.\n\n## 4. Huấn luyện đi vệ sinh\nĐưa cún ra đúng chỗ sau mỗi bữa ăn và sau khi ngủ dậy, khen thưởng ngay khi làm đúng.\n\n## 5. Xã hội hóa sớm\nCho cún làm quen với âm thanh, người lạ và vật nuôi khác một cách nhẹ nhàng.\n\n## 6. Đồ chơi gặm\nGiúp giảm ngứa lợi khi thay răng và hạn chế cắn phá đồ đạc.\n\n## 7. Kiên nhẫn\nMọi thói quen tốt đều cần thời gian. Hãy nhất quán trong mọi hiệu lệnh.',
   (select id from public.blog_categories where slug = 'cham-soc-cho'), '1Pet.Asia', 6, true, now() - interval '3 days'),
  ('meo-bo-an-nguyen-nhan', 'Mèo bỏ ăn: 5 nguyên nhân thường gặp và cách xử lý',
   'Mèo bỏ ăn quá 24 giờ là dấu hiệu không nên bỏ qua. Cùng điểm qua các nguyên nhân phổ biến nhất.',
   E'Mèo là loài rất nhạy cảm với thay đổi. Khi bé bỏ ăn, hãy kiểm tra theo thứ tự sau.\n\n## 1. Thay đổi môi trường\nChuyển nhà, thêm thú cưng mới hay đổi vị trí bát ăn đều có thể khiến mèo stress.\n\n## 2. Vấn đề răng miệng\nViêm nướu, gãy răng khiến mèo đau khi nhai. Quan sát xem mèo có chảy nước dãi không.\n\n## 3. Thức ăn không hợp\nMèo rất kén mùi vị. Thử hâm ấm pate để tăng mùi thơm.\n\n## 4. Búi lông\nMèo lông dài dễ tích búi lông gây khó chịu đường tiêu hóa.\n\n## 5. Bệnh lý\nNếu mèo bỏ ăn kèm nôn, tiêu chảy hoặc lờ đờ, hãy đưa đi khám ngay.',
   (select id from public.blog_categories where slug = 'cham-soc-meo'), '1Pet.Asia', 5, true, now() - interval '7 days'),
  ('chon-thuc-an-hat-cho-thu-cung', 'Cách đọc nhãn thức ăn hạt để chọn đúng cho thú cưng',
   'Không phải bao bì đẹp là thức ăn tốt. Học cách đọc bảng thành phần trong 3 phút.',
   E'Bảng thành phần được xếp theo khối lượng giảm dần, nên 3 nguyên liệu đầu tiên quyết định chất lượng.\n\n## Ưu tiên nguồn đạm rõ ràng\n"Thịt gà" tốt hơn "phụ phẩm động vật" chung chung.\n\n## Chú ý hàm lượng đạm và béo\nChó trưởng thành cần khoảng 18-25% đạm; mèo cần cao hơn, từ 30% trở lên.\n\n## Hạn chế chất độn\nNgô, lúa mì chiếm tỉ lệ lớn thường làm giảm giá trị dinh dưỡng.\n\n## Kiểm tra hạn sử dụng\nMua túi nhỏ nếu nhà chỉ nuôi một bé để đảm bảo độ tươi.',
   (select id from public.blog_categories where slug = 'dinh-duong'), '1Pet.Asia', 4, true, now() - interval '1 day');
