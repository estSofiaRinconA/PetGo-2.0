
-- PetGo 2.0
-- Migración 004: modalidades iniciales

INSERT INTO petgo_v2.service_variants (
    service_id,
    nombre,
    slug,
    descripcion,
    activo
)
SELECT
    s.id,
    v.nombre,
    v.slug,
    v.descripcion,
    FALSE
FROM (
    VALUES
        (
            'paseos',
            'Paseo individual',
            'individual',
            'Paseo exclusivo para una mascota.'
        ),
        (
            'paseos',
            'Paseo extendido',
            'extendido',
            'Paseo de mayor duración.'
        ),
        (
            'banos',
            'Baño básico',
            'basico',
            'Servicio de baño e higiene.'
        )
) AS v(servicio_slug, nombre, slug, descripcion)
JOIN petgo_v2.services s
    ON s.slug = v.servicio_slug
ON CONFLICT (service_id, slug) DO NOTHING;
