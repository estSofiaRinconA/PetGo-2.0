
-- PetGo 2.0
-- Migración 011: registro automático de perfiles

BEGIN;

-- Retirar el trigger de registro de PetGo anterior.
DROP TRIGGER IF EXISTS on_auth_user_created
ON auth.users;

-- Función exclusiva para perfiles de PetGo 2.0.
CREATE OR REPLACE FUNCTION petgo_v2.handle_new_user_v2()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO petgo_v2.profiles (
        id,
        nombre,
        rol
    )
    VALUES (
        NEW.id,
        COALESCE(
            NULLIF(NEW.raw_user_meta_data ->> 'nombre', ''),
            ''
        ),
        'cliente'
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- Nuevo trigger de registro.
CREATE TRIGGER on_petgo_v2_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION petgo_v2.handle_new_user_v2();

COMMIT;
