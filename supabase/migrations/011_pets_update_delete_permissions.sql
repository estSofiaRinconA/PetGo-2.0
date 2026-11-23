-- PetGo 2.0 - ampliar permisos solo para el backend de PetGo.
-- Mantiene RLS y el acceso directo de anon/authenticated denegado.
BEGIN;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.pets FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pets TO service_role;
-- Consultar bookings para impedir eliminaciones de mascotas con reservas.
GRANT SELECT ON TABLE public.bookings TO service_role;
COMMIT;
SELECT
  has_table_privilege('service_role','public.pets','UPDATE') AS api_actualiza_mascotas,
  has_table_privilege('service_role','public.pets','DELETE') AS api_elimina_mascotas,
  has_table_privilege('anon','public.pets','SELECT') AS anon_lee_mascotas,
  has_table_privilege('authenticated','public.pets','SELECT') AS cliente_lee_mascotas;
