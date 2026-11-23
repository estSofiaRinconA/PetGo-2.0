-- PetGo 2.0 — Migracion 010: notificaciones de reservas.
-- Ejecutar una vez despues de la migracion 009.
BEGIN;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.notifications FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, UPDATE ON TABLE public.notifications TO service_role;

-- La restriccion de la migracion 005 no contemplaba el evento
-- "reserva_creada". Ampliamos su expresion sin eliminar otros
-- tipos ya admitidos y sin quitar la validacion.
DO $migration$
DECLARE
  definition text;
  expression text;
BEGIN
  SELECT pg_get_constraintdef(c.oid)
  INTO definition
  FROM pg_constraint AS c
  WHERE c.conrelid = 'public.notifications'::regclass
    AND c.conname = 'notifications_tipo_valido'
    AND c.contype = 'c';

  IF definition IS NULL THEN
    RAISE EXCEPTION 'No existe la restriccion notifications_tipo_valido; revisar migracion 005 antes de continuar';
  END IF;

  -- pg_get_constraintdef devuelve CHECK (<expresion>).
  expression := substring(definition FROM '^CHECK \((.*)\)$');

  IF expression IS NULL THEN
    RAISE EXCEPTION 'Formato de restriccion inesperado: %', definition;
  END IF;

  -- Si el evento ya esta incluido, no cambiamos nada.
  IF position('reserva_creada' IN expression) = 0 THEN
    ALTER TABLE public.notifications
      DROP CONSTRAINT notifications_tipo_valido;

    EXECUTE format(
      'ALTER TABLE public.notifications ADD CONSTRAINT notifications_tipo_valido CHECK ((%s) OR (tipo = %L))',
      expression, 'reserva_creada'
    );
  END IF;
END;
$migration$;

-- El trigger se ejecuta en la BD al crear una reserva; no depende del navegador.
CREATE OR REPLACE FUNCTION public.petgo_notify_booking_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, booking_id, tipo, titulo, mensaje)
  VALUES (
    NEW.user_id,
    NEW.id,
    'reserva_creada',
    'Solicitud de reserva recibida',
    'Recibimos tu solicitud. Su estado es pendiente de confirmacion.'
  );
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.petgo_notify_booking_created() FROM PUBLIC;
DROP TRIGGER IF EXISTS petgo_booking_created_notification ON public.bookings;
CREATE TRIGGER petgo_booking_created_notification
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.petgo_notify_booking_created();

-- Crear avisos de reservas anteriores, sin duplicarlos si se repite la migracion.
INSERT INTO public.notifications (user_id, booking_id, tipo, titulo, mensaje)
SELECT b.user_id, b.id, 'reserva_creada',
       'Solicitud de reserva recibida',
       'Recibimos tu solicitud. Su estado es pendiente de confirmacion.'
FROM public.bookings AS b
WHERE NOT EXISTS (
  SELECT 1 FROM public.notifications AS n
  WHERE n.booking_id = b.id AND n.tipo = 'reserva_creada'
);
COMMIT;

SELECT
  has_table_privilege('service_role','public.notifications','SELECT') AS api_lee_notificaciones,
  has_table_privilege('service_role','public.notifications','UPDATE') AS api_marca_leidas,
  has_table_privilege('anon','public.notifications','SELECT') AS anon_lee_notificaciones,
  has_table_privilege('authenticated','public.notifications','SELECT') AS cliente_directo_lee_notificaciones;
