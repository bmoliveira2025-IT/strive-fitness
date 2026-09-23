-- Author-only post editing and deletion. Run after 202609220002_community_post_media.sql.
create or replace function public.edit_own_community_post(p_id text, p_content text, p_image_url text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if nullif(trim(p_content), '') is null then raise exception 'Post content required'; end if;
  update public.community_posts
     set content = trim(p_content), image_url = p_image_url
   where id::text = p_id and user_id::text = auth.uid()::text
   returning id::text into v_id;
  if v_id is null then raise exception 'Post not found or not owned by user'; end if;
  return v_id;
end;
$$;

create or replace function public.delete_own_community_post(p_id text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.community_posts where id::text = p_id and user_id::text = auth.uid()::text) then
    raise exception 'Post not found or not owned by user';
  end if;
  delete from public.community_comments where post_id::text = p_id;
  delete from public.community_likes where post_id::text = p_id;
  delete from public.community_posts where id::text = p_id and user_id::text = auth.uid()::text returning id::text into v_id;
  return v_id;
end;
$$;

revoke all on function public.edit_own_community_post(text, text, text) from public, anon;
revoke all on function public.delete_own_community_post(text) from public, anon;
grant execute on function public.edit_own_community_post(text, text, text) to authenticated;
grant execute on function public.delete_own_community_post(text) to authenticated;

create policy "Members can delete own community photos"
on storage.objects for delete to authenticated
using (bucket_id = 'community-posts' and (storage.foldername(name))[1] = auth.uid()::text);
