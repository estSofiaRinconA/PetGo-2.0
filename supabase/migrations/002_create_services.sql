
-- PetGo 2.0
-- Migración 002: catálogo de servicios

CREATE TABLE IF NOT EXISTS petgo_v2.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nombre TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    descripcion TEXT NOT NULL DEFAULT '',
    imagen_path TEXT,

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT services_nombre_not_empty
        CHECK (LENGTH(TRIM(nombre)) > 0),

    CONSTRAINT services_slug_format
        CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

-- Activar seguridad por filas
ALTER TABLE petgo_v2.services
ENABLE ROW LEVEL SECURITY;

-- Evitar acceso accidental si alguna consulta
-- utiliza un rol sin restricciones de RLS
ALTER TABLE petgo_v2.services
FORCE ROW LEVEL SECURITY;

-- Documentar la tabla
COMMENT ON TABLE petgo_v2.services IS
'Catálogo de servicios ofrecidos directamente por PetGo.';


-- Registrar los dos servicios principales

INSERT INTO petgo_v2.services (
    nombre,
    slug,
    descripcion
)
VALUES
(
    'Paseos',
    'paseos',
    'Servicio de paseos para mascotas.'
),
(
    'Baños',
    'banos',
    'Servicio de baño e higiene para mascotas.'
)
ON CONFLICT (slug) DO NOTHING;
