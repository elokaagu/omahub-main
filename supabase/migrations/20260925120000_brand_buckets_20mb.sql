-- Align brand/product image buckets with the 20MB Studio uploader limit.
update storage.buckets
set
  file_size_limit = 20971520,
  allowed_mime_types = array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
where id in ('brand-assets', 'brand-images', 'product-images');
