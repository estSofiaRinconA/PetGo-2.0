
-- =====================================================
-- PETGO 2.0
-- MIGRACION 003: SERVICIOS Y MODALIDADES
-- Nueva base de datos Supabase
-- =====================================================

BEGIN;

-- -----------------------------------------------------
-- 1. CATEGORIAS DE SERVICIOS
-- -----------------------------------------------------

CREATE TABLE public.services (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nombre VARCHAR(100) NOT NULL,

    slug VARCHAR(60) NOT NULL UNIQUE,

    descripcion TEXT,

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    orden INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT services_nombre_no_vacio
        CHECK (LENGTH(TRIM(nombre)) > 0),

    CONSTRAINT services_slug_no_vacio
        CHECK (LENGTH(TRIM(slug)) > 0),

    CONSTRAINT services_orden_valido
        CHECK (orden >= 0)
);

-- -----------------------------------------------------
-- 2. MODALIDADES DE CADA SERVICIO
-- -----------------------------------------------------

CREATE TABLE public.service_variants (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    service_id UUID NOT NULL
        REFERENCES public.services(id)
        ON DELETE RESTRICT,

    nombre VARCHAR(100) NOT NULL,

    slug VARCHAR(60) NOT NULL,

    descripcion TEXT,

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    orden INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT variants_nombre_no_vacio
        CHECK (LENGTH(TRIM(nombre)) > 0),

    CONSTRAINT variants_slug_no_vacio
        CHECK (LENGTH(TRIM(slug)) > 0),

    CONSTRAINT variants_orden_valido
        CHECK (orden >= 0),

    CONSTRAINT variants_slug_por_servicio
        UNIQUE (service_id, slug)
);

-- Indice para consultar modalidades por categoria.

CREATE INDEX idx_service_variants_service_id
ON public.service_variants(service_id);

-- -----------------------------------------------------
-- 3. SEGURIDAD
-- -----------------------------------------------------

ALTER TABLE public.services
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.service_variants
ENABLE ROW LEVEL SECURITY;

-- Los navegadores no consultaran directamente
-- las tablas de Supabase.
--
-- El frontend consumira nuestra API Node.js.

REVOKE ALL ON TABLE public.services
FROM anon, authenticated;

REVOKE ALL ON TABLE public.service_variants
FROM anon, authenticated;

-- Permisos del rol de servidor.
-- Su credencial debera permanecer solo en el backend.

GRANT SELECT ON TABLE public.services
TO service_role;

GRANT SELECT ON TABLE public.service_variants
TO service_role;

-- -----------------------------------------------------
-- 4. INSERTAR CATEGORIAS INICIALES
-- -----------------------------------------------------

INSERT INTO public.services (
    nombre,
    slug,
    descripcion,
    orden
)
VALUES
(
    'Paseos',
    'paseos',
    'Servicio de paseo para mascotas.',
    1
),
(
    'Baño y peluquería',
    'bano-peluqueria',
    'Servicio de higiene y peluquería para mascotas.',
    2
);

-- -----------------------------------------------------
-- 5. INSERTAR MODALIDADES DE PASEOS
-- -----------------------------------------------------

INSERT INTO public.service_variants (
    service_id,
    nombre,
    slug,
    descripcion,
    orden
)
SELECT
    s.id,
    v.nombre,
    v.slug,
    v.descripcion,
    v.orden
FROM public.services AS s
CROSS JOIN (
    VALUES
    (
        'Paseo individual',
        'individual',
        'Paseo de atención individual.',
        1
    ),
    (
        'Paseo grupal',
        'grupal',
        'Paseo en grupo.',
        2
    )
) AS v(nombre, slug, descripcion, orden)
WHERE s.slug = 'paseos';

-- -----------------------------------------------------
-- 6. INSERTAR MODALIDADES DE BAÑO Y PELUQUERIA
-- -----------------------------------------------------

INSERT INTO public.service_variants (
    service_id,
    nombre,
    slug,
    descripcion,
    orden
)
SELECT
    s.id,
    v.nombre,
    v.slug,
    v.descripcion,
    v.orden
FROM public.services AS s
CROSS JOIN (
    VALUES
    (
        'Solo baño',
        'solo-bano',
        'Servicio de baño para mascotas.',
        1
    ),
    (
        'Baño y corte',
        'bano-corte',
        'Servicio de baño y corte.',
        2
    )
) AS v(nombre, slug, descripcion, orden)
WHERE s.slug = 'bano-peluqueria';

COMMIT;
