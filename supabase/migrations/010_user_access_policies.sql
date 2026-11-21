
-- PetGo 2.0
-- Migración 010: acceso de clientes mediante RLS

-- 1. Acceso al esquema para usuarios autenticados
GRANT USAGE ON SCHEMA petgo_v2 TO authenticated;

-- 2. Privilegios sobre perfiles
GRANT SELECT ON petgo_v2.profiles TO authenticated;

GRANT UPDATE (
    nombre,
    telefono,
    ciudad,
    foto_path
) ON petgo_v2.profiles TO authenticated;

CREATE POLICY profiles_select_own
ON petgo_v2.profiles
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = id);

CREATE POLICY profiles_update_own
ON petgo_v2.profiles
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = id)
WITH CHECK ((SELECT auth.uid()) = id);

-- 3. Privilegios sobre mascotas
GRANT SELECT, INSERT, DELETE
ON petgo_v2.pets TO authenticated;

GRANT UPDATE (
    nombre,
    especie,
    raza,
    fecha_nacimiento,
    descripcion,
    foto_path
) ON petgo_v2.pets TO authenticated;

CREATE POLICY pets_select_own
ON petgo_v2.pets
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY pets_insert_own
ON petgo_v2.pets
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY pets_update_own
ON petgo_v2.pets
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY pets_delete_own
ON petgo_v2.pets
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- 4. Reservas: lectura del propietario
GRANT SELECT
ON petgo_v2.bookings TO authenticated;

CREATE POLICY bookings_select_own
ON petgo_v2.bookings
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- No se conceden permisos para modificar:
-- profiles.rol
-- pets.user_id
-- bookings.estado
-- bookings.precio_cop
-- bookings.duracion_min
--
-- Las operaciones administrativas y la creación
-- de reservas se implementarán posteriormente.
