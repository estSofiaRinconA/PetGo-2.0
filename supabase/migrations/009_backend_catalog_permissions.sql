
-- PetGo 2.0
-- Migracion 009: lectura del catalogo desde el backend

-- Acceso al esquema para el rol del servidor
GRANT USAGE ON SCHEMA petgo_v2 TO service_role;

-- Autorizar exclusivamente lectura del catalogo
GRANT SELECT ON TABLE petgo_v2.services
TO service_role;

GRANT SELECT ON TABLE petgo_v2.service_variants
TO service_role;

-- Mantener el acceso publico restringido
REVOKE ALL ON SCHEMA petgo_v2
FROM anon, authenticated;

-- Comprobacion
SELECT
    has_schema_privilege(
        'service_role',
        'petgo_v2',
        'USAGE'
    ) AS acceso_esquema,

    has_table_privilege(
        'service_role',
        'petgo_v2.services',
        'SELECT'
    ) AS lectura_servicios,

    has_table_privilege(
        'service_role',
        'petgo_v2.service_variants',
        'SELECT'
    ) AS lectura_modalidades;
