-- PETGO 2.0 / 015: reglas de agenda EDITABLES por administradores.
-- Aun NO ofrece disponibilidad automatica ni cambia reservas existentes.
BEGIN;
CREATE TABLE IF NOT EXISTS public.petgo_schedule (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id=1),
  weekdays integer[] NOT NULL DEFAULT ARRAY[1,2,3,4,5,6],
  opening_time time NOT NULL DEFAULT TIME '08:00',
  closing_time time NOT NULL DEFAULT TIME '18:00',
  timezone text NOT NULL DEFAULT 'America/Bogota' CHECK (timezone='America/Bogota'),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT petgo_schedule_hours CHECK (opening_time < closing_time),
  CONSTRAINT petgo_schedule_days CHECK (
    cardinality(weekdays) BETWEEN 1 AND 7 AND
    weekdays <@ ARRAY[1,2,3,4,5,6,7] AND
    array_position(weekdays, NULL) IS NULL
  )
);
CREATE TABLE IF NOT EXISTS public.petgo_variant_rules (
  variant_id uuid PRIMARY KEY REFERENCES public.service_variants(id) ON DELETE CASCADE,
  duration_minutes integer NOT NULL CHECK (duration_minutes BETWEEN 15 AND 480),
  capacity integer NOT NULL CHECK (capacity BETWEEN 1 AND 100),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.petgo_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petgo_variant_rules ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.petgo_schedule FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.petgo_variant_rules FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT ON public.petgo_schedule, public.petgo_variant_rules TO service_role;
-- Acceso por RPC, nunca escritura directa desde la API.
REVOKE INSERT, UPDATE, DELETE ON public.petgo_schedule, public.petgo_variant_rules FROM service_role;

INSERT INTO public.petgo_schedule (id,weekdays,opening_time,closing_time)
VALUES (1,ARRAY[1,2,3,4,5,6],TIME '08:00',TIME '18:00')
ON CONFLICT(id) DO NOTHING;

-- Semillas solo para modalidades creadas en el catalogo original.
INSERT INTO public.petgo_variant_rules(variant_id,duration_minutes,capacity)
SELECT v.id,
  CASE WHEN v.slug='bano-corte' OR (s.slug='bano-peluqueria' AND v.nombre='Baño y corte') THEN 90 ELSE 60 END,
  CASE WHEN s.slug='paseos' AND v.slug='grupal' THEN 4 ELSE 1 END
FROM public.service_variants v JOIN public.services s ON s.id=v.service_id
ON CONFLICT (variant_id) DO NOTHING;

-- Reemplazo atomico, con validacion de permisos y de conjunto completo.
CREATE OR REPLACE FUNCTION public.petgo_admin_save_schedule(
  p_actor uuid, p_weekdays integer[], p_open text, p_close text,
  p_variants jsonb
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  item jsonb;
  v_id uuid;
  duration_value integer;
  capacity_value integer;
  variants_total integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.petgo_admin_users WHERE user_id=p_actor) THEN
    RAISE EXCEPTION 'Sin permiso administrativo' USING ERRCODE='42501';
  END IF;
  IF p_weekdays IS NULL OR cardinality(p_weekdays) NOT BETWEEN 1 AND 7
     OR NOT (p_weekdays <@ ARRAY[1,2,3,4,5,6,7])
     OR (SELECT count(DISTINCT d) FROM unnest(p_weekdays) AS d) <> cardinality(p_weekdays)
  THEN RAISE EXCEPTION 'Dias invalidos' USING ERRCODE='22023'; END IF;
  IF p_open !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
     OR p_close !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
     OR p_open::time >= p_close::time
  THEN RAISE EXCEPTION 'Horario invalido' USING ERRCODE='22023'; END IF;
  IF p_variants IS NULL OR jsonb_typeof(p_variants)<>'array' THEN
    RAISE EXCEPTION 'Modalidades invalidas' USING ERRCODE='22023';
  END IF;
  SELECT count(*) INTO variants_total FROM public.service_variants WHERE activo=true;
  IF jsonb_array_length(p_variants) <> variants_total THEN
    RAISE EXCEPTION 'Es necesario configurar todas las modalidades activas' USING ERRCODE='22023';
  END IF;
  -- Detectar IDs repetidos, valores nulos o tipos inesperados.
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_variants) AS entry
    WHERE jsonb_typeof(entry) <> 'object'
       OR NOT (entry ? 'id' AND entry ? 'duration_minutes' AND entry ? 'capacity')
       OR jsonb_typeof(entry->'id') <> 'string'
       OR jsonb_typeof(entry->'duration_minutes') <> 'number'
       OR jsonb_typeof(entry->'capacity') <> 'number'
  ) THEN RAISE EXCEPTION 'Modalidad invalida' USING ERRCODE='22023'; END IF;
  IF (SELECT count(DISTINCT entry->>'id') FROM jsonb_array_elements(p_variants) AS entry)
     <> variants_total
  THEN RAISE EXCEPTION 'Modalidades duplicadas' USING ERRCODE='22023'; END IF;
  -- Bloqueo para serializar cambios de la agenda.
  PERFORM pg_catalog.pg_advisory_xact_lock(8302026);
  FOR item IN SELECT value FROM jsonb_array_elements(p_variants) LOOP
    BEGIN
      v_id := (item->>'id')::uuid;
      duration_value := (item->>'duration_minutes')::integer;
      capacity_value := (item->>'capacity')::integer;
    EXCEPTION WHEN others THEN
      RAISE EXCEPTION 'Valores invalidos' USING ERRCODE='22023';
    END;
    IF duration_value NOT BETWEEN 15 AND 480 OR capacity_value NOT BETWEEN 1 AND 100
      OR NOT EXISTS (SELECT 1 FROM public.service_variants WHERE id=v_id AND activo=true)
    THEN RAISE EXCEPTION 'Modalidad o limites invalidos' USING ERRCODE='22023'; END IF;
  END LOOP;
  INSERT INTO public.petgo_schedule(id,weekdays,opening_time,closing_time,updated_at)
  VALUES(1,p_weekdays,p_open::time,p_close::time,now())
  ON CONFLICT(id) DO UPDATE SET weekdays=excluded.weekdays,opening_time=excluded.opening_time,
  closing_time=excluded.closing_time,updated_at=now();
  FOR item IN SELECT value FROM jsonb_array_elements(p_variants) LOOP
    INSERT INTO public.petgo_variant_rules(variant_id,duration_minutes,capacity,updated_at)
    VALUES((item->>'id')::uuid,(item->>'duration_minutes')::integer,(item->>'capacity')::integer,now())
    ON CONFLICT(variant_id) DO UPDATE SET duration_minutes=excluded.duration_minutes,
    capacity=excluded.capacity,updated_at=now();
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.petgo_admin_save_schedule(uuid,integer[],text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.petgo_admin_save_schedule(uuid,integer[],text,text,jsonb) TO service_role;
COMMIT;
SELECT id, weekdays, opening_time, closing_time, timezone FROM public.petgo_schedule;
SELECT s.nombre AS servicio,v.nombre AS modalidad,r.duration_minutes,r.capacity
FROM public.petgo_variant_rules r JOIN public.service_variants v ON v.id=r.variant_id
JOIN public.services s ON s.id=v.service_id ORDER BY s.orden,v.orden;
