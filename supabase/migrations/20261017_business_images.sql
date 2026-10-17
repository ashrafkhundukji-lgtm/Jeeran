-- Shop identity: optional logo + cover image per business (dashboard
-- profile → "Shop identity"). Additive only — both nullable, every reader
-- falls back to the first-letter avatar / category cover when absent.
-- Written only by POST/DELETE /api/business/[id]/images (service role),
-- which re-encodes to webp with sharp, so the bucket's mime allowlist is a
-- second line of defence, not the primary check. No SVG (script injection).
alter table public.businesses
  add column if not exists logo_url text,
  add column if not exists cover_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('business-images', 'business-images', true, 2097152,
        array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;
