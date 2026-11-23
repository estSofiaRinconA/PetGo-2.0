
-- =====================================================
-- PETGO 2.0
-- MIGRACION 001: PERFILES DE USUARIOS
-- Nueva base de datos Supabase
-- =====================================================

BEGIN;

-- -----------------------------------------------------
-- 1. TABLA DE PERFILES
-- -----------------------------------------------------

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    nombre VARCHAR(100),

    telefono VARCHAR(30),

    ciudad VARCHAR(100),

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW()
);

-- -----------------------------------------------------
-- 2. SEGURIDAD DE LA TABLA
-- -----------------------------------------------------

ALTER TABLE public.profiles
ENABLE ROW LEVEL SECURITY;

-- No permitimos operaciones directas desde clientes
-- publicos. Las operaciones de perfiles pasaran por
-- nuestra API propia de Node.js.

REVOKE ALL ON TABLE public.profiles
FROM anon, authenticated;

-- El backend administrara las operaciones utilizando
-- credenciales seguras exclusivamente del servidor.
-- Su autorizacion por usuario se implementara en la API.

-- -----------------------------------------------------
-- 3. ESQUEMA PRIVADO PARA FUNCIONES INTERNAS
-- -----------------------------------------------------

CREATE SCHEMA IF NOT EXISTS petgo_private;

-- No exponer funciones internas a clientes publicos.

REVOKE ALL ON SCHEMA petgo_private
FROM PUBLIC;

-- -----------------------------------------------------
-- 4. CREAR PERFIL AL REGISTRAR UN USUARIO
-- -----------------------------------------------------

CREATE FUNCTION petgo_private.crear_perfil_usuario()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        nombre
    )
    VALUES (
        NEW.id,
        LEFT(
            NULLIF(
                TRIM(
                    COALESCE(
                        NEW.raw_user_meta_data ->> 'nombre',
                        ''
                    )
                ),
                ''
            ),
            100
        )
    );

    RETURN NEW;
END;
$$;

-- Restringir la ejecucion directa de la funcion.

REVOKE ALL ON FUNCTION
petgo_private.crear_perfil_usuario()
FROM PUBLIC;

-- -----------------------------------------------------
-- 5. ACTIVAR CREACION AUTOMATICA DEL PERFIL
-- -----------------------------------------------------

CREATE TRIGGER petgo_usuario_registrado
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION
petgo_private.crear_perfil_usuario();

COMMIT;
