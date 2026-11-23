
-- =====================================================
-- PETGO 2.0
-- MIGRACION 004: RESERVAS
-- Nueva base de datos Supabase
-- =====================================================

BEGIN;

-- -----------------------------------------------------
-- 1. PREPARAR VERIFICACION DEL PROPIETARIO
-- -----------------------------------------------------

-- Esta restriccion permite comprobar conjuntamente
-- el identificador de la mascota y su propietario.

ALTER TABLE public.pets
ADD CONSTRAINT pets_id_user_unique
UNIQUE (id, user_id);

-- -----------------------------------------------------
-- 2. CREAR TABLA DE RESERVAS
-- -----------------------------------------------------

CREATE TABLE public.bookings (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    -- Cliente que realiza la reserva
    user_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE RESTRICT,

    -- Mascota que recibira el servicio
    pet_id UUID NOT NULL,

    -- Modalidad del servicio seleccionado
    service_variant_id UUID NOT NULL
        REFERENCES public.service_variants(id)
        ON DELETE RESTRICT,

    -- Fecha y hora solicitadas
    scheduled_at TIMESTAMPTZ NOT NULL,

    -- Estado inicial de la solicitud
    status VARCHAR(20) NOT NULL
        DEFAULT 'pendiente',

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    -- Solo se admiten los estados definidos
    CONSTRAINT bookings_status_valido
        CHECK (
            status IN (
                'pendiente',
                'confirmada',
                'completada',
                'cancelada'
            )
        ),

    -- Una mascota debe pertenecer al cliente
    -- asociado con esta reserva.
    CONSTRAINT bookings_mascota_propietario
        FOREIGN KEY (pet_id, user_id)
        REFERENCES public.pets(id, user_id)
        ON DELETE RESTRICT
);

-- -----------------------------------------------------
-- 3. INDICES
-- -----------------------------------------------------

-- Consultar reservas de un cliente
CREATE INDEX idx_bookings_user_id
ON public.bookings(user_id);

-- Consultar reservas de una mascota
CREATE INDEX idx_bookings_pet_id
ON public.bookings(pet_id);

-- Consultar reservas por fecha
CREATE INDEX idx_bookings_scheduled_at
ON public.bookings(scheduled_at);

-- Filtrar reservas de clientes por estado
CREATE INDEX idx_bookings_user_status
ON public.bookings(user_id, status);

-- -----------------------------------------------------
-- 4. SEGURIDAD
-- -----------------------------------------------------

ALTER TABLE public.bookings
ENABLE ROW LEVEL SECURITY;

-- No conceder acceso directo desde el navegador.
-- Toda operacion pasara por nuestra API Node.js.

REVOKE ALL ON TABLE public.bookings
FROM anon, authenticated;

-- El backend gestionara las reservas mediante
-- credenciales que permaneceran solo en el servidor.

-- -----------------------------------------------------
-- 5. ACTUALIZAR AUTOMATICAMENTE updated_at
-- -----------------------------------------------------

CREATE FUNCTION public.actualizar_fecha_reserva()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION
public.actualizar_fecha_reserva()
FROM PUBLIC;

CREATE TRIGGER petgo_actualizar_reserva
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.actualizar_fecha_reserva();

COMMIT;
