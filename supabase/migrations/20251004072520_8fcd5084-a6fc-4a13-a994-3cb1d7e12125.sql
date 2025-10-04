-- Storage RLS policies for per-user folder access in user-files bucket

-- SELECT (list/read) - users can only read their own files
CREATE POLICY "files.select.own"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- INSERT (upload) - users can only upload to their own folder
CREATE POLICY "files.insert.own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE (remove) - users can only delete their own files
CREATE POLICY "files.delete.own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);