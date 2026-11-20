
-- PetGo 2.0
-- Migración 005: perfiles de usuarios

CREATE TABLE IF NOT EXISTS petgo_v2.profiles (
    id UUID PRIMARY KEY
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    nombre TEXT NOT NULL DEFAULT '',
    telefono TEXT,
    ciudad TEXT,
    foto_path TEXT,

    rol TEXT NOT NULL DEFAULT 'cliente',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT profiles_rol_valido
        CHECK (rol IN ('cliente', 'admin'))
);

-- Activar protección por filas
ALTER TABLE petgo_v2.profiles
ENABLE ROW LEVEL SECURITY;

ALTER TABLE petgo_v2.profiles
FORCE ROW LEVEL SECURITY;

-- Documentación
COMMENT ON TABLE petgo_v2.profiles IS
'Perfiles de clientes y administradores de PetGo 2.0.';
