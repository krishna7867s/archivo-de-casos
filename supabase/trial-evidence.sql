alter table public.danganronpa_pruebas_juicio
  add column ruta text unique,
  add column publicado boolean not null default false,
  alter column imagen_svg drop not null,
  add constraint pruebas_juicio_ruta check (ruta = caso_id || '/' || prueba_id || '.svg');

update public.danganronpa_pruebas_juicio set publicado = true where caso_id in ('reloj', 'sello', 'deposito');
alter table public.danganronpa_pruebas_juicio enable row level security;
revoke all on public.danganronpa_pruebas_juicio from public, anon, authenticated;
grant select on public.danganronpa_pruebas_juicio to anon, authenticated;

drop policy "Leer pruebas ficticias publicadas" on public.danganronpa_pruebas_juicio;
create policy "Lectura de pruebas publicadas"
on public.danganronpa_pruebas_juicio for select to anon, authenticated
using (publicado);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trial-evidence', 'trial-evidence', false, 131072, array['image/svg+xml']);

create policy "Descarga de imágenes de pruebas publicadas"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'trial-evidence' and exists (
    select 1 from public.danganronpa_pruebas_juicio as prueba
    where prueba.ruta = name and prueba.publicado
  )
);
