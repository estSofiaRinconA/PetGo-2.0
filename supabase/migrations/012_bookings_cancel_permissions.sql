-- PetGo 2.0 — Paso 86: Cancelar solicitudes propias desde nuestra API.
-- Conservamos RLS y no concedemos acceso directo a clientes.
BEGIN;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.bookings FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT UPDATE ON TABLE public.bookings TO service_role;
COMMIT;
SELECT
  has_table_privilege('service_role','public.bookings','UPDATE') AS api_actualiza_reservas,
  has_table_privilege('anon','public.bookings','UPDATE') AS anon_actualiza_reservas,
  has_table_privilege('authenticated','public.bookings','UPDATE') AS cliente_actualiza_reservas;
