
-- PetGo 2.0
-- Migración 003: modalidades de servicios

CREATE TABLE IF NOT EXISTS petgo_v2.service_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    service_id UUID NOT NULL
        REFERENCES petgo_v2.services(id),

    nombre TEXT NOT NULL,
    slug TEXT NOT NULL,
    descripcion TEXT NOT NULL DEFAULT '',

    duracion_min INTEGER,
    precio_cop INTEGER,

    activo BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT variants_nombre_not_empty
        CHECK (LENGTH(TRIM(nombre)) > 0),

    CONSTRAINT variants_slug_format
        CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),

    CONSTRAINT variants_duracion_positive
        CHECK (duracion_min > 0),

    CONSTRAINT variants_precio_nonnegative
        CHECK (precio_cop >= 0),

    CONSTRAINT variants_unique_slug
        UNIQUE (service_id, slug)
);

-- Activar seguridad
ALTER TABLE petgo_v2.service_variants
ENABLE ROW LEVEL SECURITY;

ALTER TABLE petgo_v2.service_variants
FORCE ROW LEVEL SECURITY;

-- Índice para consultar modalidades por servicio
CREATE INDEX IF NOT EXISTS
idx_service_variants_service_id
ON petgo_v2.service_variants(service_id);
