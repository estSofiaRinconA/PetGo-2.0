
-- =====================================================
-- PETGO 2.0
-- MIGRACION 002: MASCOTAS
-- Nueva base de datos Supabase
-- =====================================================

BEGIN;

-- -----------------------------------------------------
-- 1. CREAR TABLA DE MASCOTAS
-- -----------------------------------------------------

CREATE TABLE public.pets (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    -- Propietario de la mascota
    user_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    -- Informacion principal
    nombre VARCHAR(100) NOT NULL,

    especie VARCHAR(50) NOT NULL,

    raza VARCHAR(100),

    fecha_nacimiento DATE,

    observaciones TEXT,

    -- Fechas de seguimiento
    created_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    -- Validaciones basicas
    CONSTRAINT pets_nombre_no_vacio
        CHECK (LENGTH(TRIM(nombre)) > 0),

    CONSTRAINT pets_especie_no_vacia
        CHECK (LENGTH(TRIM(especie)) > 0),

    CONSTRAINT pets_observaciones_longitud
        CHECK (
            observaciones IS NULL
            OR LENGTH(observaciones) <= 2000
        ),

    CONSTRAINT pets_fecha_nacimiento_valida
        CHECK (
            fecha_nacimiento IS NULL
            OR fecha_nacimiento <= CURRENT_DATE
        )
);

-- -----------------------------------------------------
-- 2. INDICE PARA CONSULTAR MASCOTAS POR PROPIETARIO
-- -----------------------------------------------------

CREATE INDEX idx_pets_user_id
ON public.pets(user_id);

-- -----------------------------------------------------
-- 3. ACTIVAR SEGURIDAD RLS
-- -----------------------------------------------------

ALTER TABLE public.pets
ENABLE ROW LEVEL SECURITY;

-- Evitar acceso directo desde los roles publicos.
-- Toda operacion pasara por nuestra API Node.js.

REVOKE ALL ON TABLE public.pets
FROM anon, authenticated;

-- Sin politicas para clientes directos.
-- La API validara el usuario autenticado y la
-- propiedad de cada mascota antes de operar.

-- -----------------------------------------------------
-- 4. ACTUALIZACION AUTOMATICA DE updated_at
-- -----------------------------------------------------

CREATE FUNCTION public.actualizar_fecha_mascota()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Evitar ejecucion directa desde clientes publicos.

REVOKE ALL ON FUNCTION
public.actualizar_fecha_mascota()
FROM PUBLIC;

CREATE TRIGGER petgo_actualizar_mascota
BEFORE UPDATE ON public.pets
FOR EACH ROW
EXECUTE FUNCTION public.actualizar_fecha_mascota();

COMMIT;
