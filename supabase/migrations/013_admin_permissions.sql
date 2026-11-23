-- PetGo 2.0 - Paso 90: autorizacion administrativa, auditoria y cambios atomicos.
-- No concede privilegios administrativos a usuarios publicos.
BEGIN;
CREATE TABLE IF NOT EXISTS public.petgo_admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.petgo_booking_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  actor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  previous_status varchar(20) NOT NULL,
  new_status varchar(20) NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT petgo_audit_status_check CHECK (
    (previous_status='pendiente' AND new_status='confirmada') OR
    (previous_status='confirmada' AND new_status='completada')
  )
);
CREATE INDEX IF NOT EXISTS petgo_booking_audit_booking_idx
  ON public.petgo_booking_audit(booking_id,changed_at DESC);
ALTER TABLE public.petgo_admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petgo_booking_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.petgo_admin_users FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.petgo_booking_audit FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT ON public.petgo_admin_users TO service_role;
-- No se otorga INSERT/UPDATE/DELETE de roles a la API.
GRANT SELECT ON public.petgo_booking_audit TO service_role;

-- Funcion atomica: verificar rol, bloquear reserva, cambiar estado,
-- registrar auditoria y generar notificacion en una sola transaccion.
CREATE OR REPLACE FUNCTION public.petgo_admin_change_booking_status(
  p_actor uuid, p_booking uuid, p_status text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  r public.bookings%ROWTYPE;
  previous text;
  title text;
  body text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.petgo_admin_users WHERE user_id=p_actor) THEN
    RAISE EXCEPTION 'Acceso administrativo denegado' USING ERRCODE='42501';
  END IF;
  SELECT * INTO r FROM public.bookings WHERE id=p_booking FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reserva no encontrada' USING ERRCODE='P0002';
  END IF;
  previous := r.status;
  IF NOT ((previous='pendiente' AND p_status='confirmada') OR
          (previous='confirmada' AND p_status='completada')) THEN
    RAISE EXCEPTION 'Transicion de estado no permitida' USING ERRCODE='23514';
  END IF;
  UPDATE public.bookings SET status=p_status WHERE id=p_booking;
  INSERT INTO public.petgo_booking_audit(booking_id,actor_user_id,previous_status,new_status)
  VALUES (p_booking,p_actor,previous,p_status);
  IF p_status='confirmada' THEN
    title := 'Reserva confirmada';
    body := 'Tu reserva ha sido confirmada. Puedes consultar sus datos en Mis reservas.';
  ELSE
    title := 'Servicio completado';
    body := 'Tu reserva figura como completada. Gracias por confiar en PetGo.';
  END IF;
  INSERT INTO public.notifications(user_id,booking_id,tipo,titulo,mensaje)
  VALUES(r.user_id,p_booking,'reserva',title,body);
  RETURN jsonb_build_object('id',p_booking,'status',p_status,'previous_status',previous);
END;
$$;
REVOKE ALL ON FUNCTION public.petgo_admin_change_booking_status(uuid,uuid,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.petgo_admin_change_booking_status(uuid,uuid,text)
  TO service_role;
COMMIT;

-- Comprobacion: lectura del rol y ejecucion de la funcion exclusivamente del backend.
SELECT
  has_table_privilege('service_role','public.petgo_admin_users','SELECT') AS api_lee_roles,
  has_table_privilege('anon','public.petgo_admin_users','SELECT') AS anon_lee_roles,
  has_table_privilege('authenticated','public.petgo_admin_users','SELECT') AS cliente_lee_roles,
  has_function_privilege('service_role',
    'public.petgo_admin_change_booking_status(uuid,uuid,text)','EXECUTE') AS api_cambia_estado,
  has_function_privilege('authenticated',
    'public.petgo_admin_change_booking_status(uuid,uuid,text)','EXECUTE') AS cliente_cambia_estado;
