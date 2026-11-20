
-- PetGo 2.0
-- Migración 001: crear esquema independiente
-- Base de datos: Supabase PostgreSQL

CREATE SCHEMA IF NOT EXISTS petgo_v2;

-- Restringir el acceso inicial al esquema
REVOKE ALL ON SCHEMA petgo_v2 FROM PUBLIC;

REVOKE ALL ON SCHEMA petgo_v2
FROM anon, authenticated;
