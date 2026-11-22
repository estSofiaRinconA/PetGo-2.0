-- PETGO 2.0 - Permisos mínimos para solicitudes de reserva desde API Node.js.
BEGIN;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.bookings FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT ON TABLE public.bookings TO service_role;
COMMIT;

SELECT
  has_table_privilege('service_role', 'public.bookings', 'SELECT') AS api_lee_reservas,
  has_table_privilege('service_role', 'public.bookings', 'INSERT') AS api_crea_reservas,
  has_table_privilege('anon', 'public.bookings', 'SELECT') AS anon_lee_reservas,
  has_table_privilege('authenticated', 'public.bookings', 'SELECT') AS cliente_directo_lee_reservas;
