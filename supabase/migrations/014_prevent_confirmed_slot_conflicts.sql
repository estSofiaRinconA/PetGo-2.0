-- PETGO 2.0 - Paso 92: evitar que dos reservas confirmadas
-- de la misma modalidad usen exactamente la misma fecha y hora.
--
-- IMPORTANTE: esta regla presupone provisionalmente una capacidad de
-- una reserva confirmada por modalidad y hora de inicio. NO resuelve
-- duraciones, solapamientos, personal disponible ni horario de atencion.
-- Las solicitudes pendientes siguen siendo solicitudes, no bloqueos.

BEGIN;

-- Si existen conflictos previos, la migracion se detiene SIN modificar
-- el esquema. Revisarlos manualmente antes de volver a ejecutar.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.bookings
    WHERE status = 'confirmada'
    GROUP BY service_variant_id, scheduled_at
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Existen reservas confirmadas duplicadas para la misma modalidad y hora. Revisarlas antes de aplicar el indice.';
  END IF;
END;
$$;

-- El indice unico es una garantia atomica a nivel PostgreSQL,
-- incluso con solicitudes de confirmacion simultaneas.
CREATE UNIQUE INDEX IF NOT EXISTS
  petgo_unique_confirmed_variant_start
ON public.bookings (service_variant_id, scheduled_at)
WHERE status = 'confirmada';

COMMIT;

-- Consulta de verificacion: 1 fila si existe el indice.
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'bookings'
  AND indexname = 'petgo_unique_confirmed_variant_start';
