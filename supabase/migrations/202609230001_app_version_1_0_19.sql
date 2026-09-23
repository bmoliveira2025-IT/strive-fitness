-- Announce the already published Android APK to existing installations.
-- jsonb_populate_record adapts release_notes to the current column type
-- (json/jsonb or text[]) without changing the production schema.
with release as (
  select *
  from jsonb_populate_record(
    null::public.app_versions,
    jsonb_build_object(
      'platform', 'android',
      'version', '1.0.19',
      'release_notes', jsonb_build_array(
        'Treinos e programas aprimorados',
        'Fotos e cartão de treino na comunidade',
        'Interface mais leve e ajustes de layout'
      ),
      'download_url', 'https://strivefitness-mu.vercel.app/strive.apk',
      'is_mandatory', false
    )
  )
)
insert into public.app_versions
  (platform, version, release_notes, download_url, is_mandatory)
select platform, version, release_notes, download_url, is_mandatory
from release
where not exists (
  select 1 from public.app_versions
  where platform = 'android' and version = '1.0.19'
);
