
-- PetGo 2.0
-- Migración 007: sistema de reservas

CREATE TABLE IF NOT EXISTS petgo_v2.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES petgo_v2.profiles(id),

    pet_id UUID NOT NULL
        REFERENCES petgo_v2.pets(id),

    variant_id UUID NOT NULL
        REFERENCES petgo_v2.service_variants(id),

    fecha DATE NOT NULL,
    hora TIME NOT NULL,

    precio_cop INTEGER NOT NULL,
    duracion_min INTEGER NOT NULL,

    estado TEXT NOT NULL DEFAULT 'pendiente',

    notas TEXT NOT NULL DEFAULT '',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT bookings_precio_valid
        CHECK (precio_cop >= 0),

    CONSTRAINT bookings_duracion_valid
        CHECK (duracion_min > 0),

    CONSTRAINT bookings_estado_valid
        CHECK (
            estado IN (
                'pendiente',
                'confirmada',
                'completada',
                'cancelada'
            )
        )
);

-- Activar seguridad por filas
ALTER TABLE petgo_v2.bookings
ENABLE ROW LEVEL SECURITY;

ALTER TABLE petgo_v2.bookings
FORCE ROW LEVEL SECURITY;

-- Índices para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_bookings_user_id
ON petgo_v2.bookings(user_id);

CREATE INDEX IF NOT EXISTS idx_bookings_pet_id
ON petgo_v2.bookings(pet_id);

CREATE INDEX IF NOT EXISTS idx_bookings_variant_id
ON petgo_v2.bookings(variant_id);

CREATE INDEX IF NOT EXISTS idx_bookings_fecha
ON petgo_v2.bookings(fecha);

CREATE INDEX IF NOT EXISTS idx_bookings_estado
ON petgo_v2.bookings(estado);

COMMENT ON TABLE petgo_v2.bookings IS
'Reservas de paseos y baños de PetGo 2.0.';
