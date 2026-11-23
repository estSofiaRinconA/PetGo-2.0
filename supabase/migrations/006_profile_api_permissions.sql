
-- =====================================================
-- PETGO 2.0
-- MIGRACION 006: PERMISOS DE LA API PARA PERFILES
-- =====================================================

BEGIN;

-- Mantener RLS habilitado.
ALTER TABLE public.profiles
ENABLE ROW LEVEL SECURITY;

-- Los clientes publicos no tienen acceso directo.
REVOKE ALL ON TABLE public.profiles
FROM anon, authenticated;

-- Permitir que nuestra API utilice el esquema.
GRANT USAGE ON SCHEMA public
TO service_role;

-- Conceder solamente las operaciones necesarias
-- para consultar y modificar un perfil.
GRANT SELECT, UPDATE ON TABLE public.profiles
TO service_role;

COMMIT;

-- Verificar permisos tras aplicar la migracion.
SELECT
    has_table_privilege(
        'service_role',
        'public.profiles',
        'SELECT'
    ) AS api_puede_leer,

    has_table_privilege(
        'service_role',
        'public.profiles',
        'UPDATE'
    ) AS api_puede_actualizar,

    has_table_privilege(
        'anon',
        'public.profiles',
        'SELECT'
    ) AS publico_puede_leer,

    has_table_privilege(
        'authenticated',
        'public.profiles',
        'SELECT'
    ) AS usuario_directo_puede_leer;
