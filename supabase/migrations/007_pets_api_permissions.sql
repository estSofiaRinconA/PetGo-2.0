-- PETGO 2.0 - Permisos minimos para el backend de mascotas
BEGIN;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.pets FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT ON TABLE public.pets TO service_role;
COMMIT;

SELECT
  has_table_privilege('service_role','public.pets','SELECT') AS api_puede_leer,
  has_table_privilege('service_role','public.pets','INSERT') AS api_puede_insertar,
  has_table_privilege('anon','public.pets','SELECT') AS anon_puede_leer,
  has_table_privilege('authenticated','public.pets','SELECT') AS usuario_directo_puede_leer;
