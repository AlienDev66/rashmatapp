-- Tighten covers Storage to {user_id}/programs/* (match avatars pattern)

drop policy if exists "covers_auth_write" on storage.objects;
drop policy if exists "covers_own_write" on storage.objects;
drop policy if exists "covers_own_update" on storage.objects;
drop policy if exists "covers_own_delete" on storage.objects;

create policy "covers_own_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "covers_own_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "covers_own_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
