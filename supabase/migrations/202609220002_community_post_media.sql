-- Non-destructive media support for existing community posts.
alter table if exists public.community_posts
  add column if not exists image_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community-posts', 'community-posts', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Public can view community photos"
on storage.objects for select
using (bucket_id = 'community-posts');

create policy "Members can upload own community photos"
on storage.objects for insert to authenticated
with check (bucket_id = 'community-posts' and (storage.foldername(name))[1] = auth.uid()::text);
