
-- PetGo 2.0
-- Migración 006: mascotas de los clientes

CREATE TABLE IF NOT EXISTS petgo_v2.pets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES petgo_v2.profiles(id)
        ON DELETE CASCADE,

    nombre TEXT NOT NULL,
    especie TEXT NOT NULL,
    raza TEXT,
    fecha_nacimiento DATE,
    descripcion TEXT NOT NULL DEFAULT '',
    foto_path TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pets_nombre_not_empty
        CHECK (LENGTH(TRIM(nombre)) > 0),

    CONSTRAINT pets_especie_not_empty
        CHECK (LENGTH(TRIM(especie)) > 0),

    CONSTRAINT pets_fecha_nacimiento_valida
        CHECK (
            fecha_nacimiento IS NULL
            OR fecha_nacimiento >= DATE '1900-01-01'
        )
);

-- Activar seguridad por filas
ALTER TABLE petgo_v2.pets
ENABLE ROW LEVEL SECURITY;

ALTER TABLE petgo_v2.pets
FORCE ROW LEVEL SECURITY;

-- Índice para buscar mascotas por propietario
CREATE INDEX IF NOT EXISTS idx_pets_user_id
ON petgo_v2.pets(user_id);

-- Descripción de la tabla
COMMENT ON TABLE petgo_v2.pets IS
'Mascotas registradas por los clientes de PetGo 2.0.';
