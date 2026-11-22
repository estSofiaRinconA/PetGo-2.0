-- PetGo 2.0: permitir a la API leer el catálogo real.
BEGIN;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_variants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.services, public.service_variants FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT ON TABLE public.services, public.service_variants TO service_role;
COMMIT;

SELECT
  has_table_privilege('service_role', 'public.services', 'SELECT') AS api_lee_servicios,
  has_table_privilege('service_role', 'public.service_variants', 'SELECT') AS api_lee_modalidades,
  has_table_privilege('anon', 'public.services', 'SELECT') AS anon_lee_servicios,
  has_table_privilege('authenticated', 'public.service_variants', 'SELECT') AS cliente_lee_modalidades;
