
-- =====================================================
-- PETGO 2.0
-- MIGRACION 005: NOTIFICACIONES
-- Nueva base de datos Supabase
-- =====================================================

BEGIN;

-- -----------------------------------------------------
-- 1. CREAR TABLA DE NOTIFICACIONES
-- -----------------------------------------------------

CREATE TABLE public.notifications (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    -- Usuario destinatario
    user_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    -- Reserva relacionada, cuando corresponda
    booking_id UUID
        REFERENCES public.bookings(id)
        ON DELETE SET NULL,

    -- Categoria de notificacion
    tipo VARCHAR(30) NOT NULL
        DEFAULT 'general',

    -- Contenido
    titulo VARCHAR(150) NOT NULL,

    mensaje TEXT NOT NULL,

    -- NULL significa que no ha sido leida
    leida_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    -- Validaciones
    CONSTRAINT notifications_tipo_valido
        CHECK (
            tipo IN (
                'general',
                'reserva',
                'sistema'
            )
        ),

    CONSTRAINT notifications_titulo_valido
        CHECK (
            LENGTH(TRIM(titulo)) > 0
        ),

    CONSTRAINT notifications_mensaje_valido
        CHECK (
            LENGTH(TRIM(mensaje)) > 0
            AND LENGTH(mensaje) <= 2000
        )
);

-- -----------------------------------------------------
-- 2. INDICES
-- -----------------------------------------------------

-- Consultar las notificaciones recientes de un usuario

CREATE INDEX idx_notifications_user_date
ON public.notifications(
    user_id,
    created_at DESC
);

-- Consultar notificaciones sin leer

CREATE INDEX idx_notifications_unread
ON public.notifications(
    user_id,
    created_at DESC
)
WHERE leida_at IS NULL;

-- -----------------------------------------------------
-- 3. SEGURIDAD
-- -----------------------------------------------------

ALTER TABLE public.notifications
ENABLE ROW LEVEL SECURITY;

-- Prohibir acceso directo desde los clientes.
-- El frontend solo hablara con nuestra API PetGo.

REVOKE ALL ON TABLE public.notifications
FROM anon, authenticated;

-- El backend verificara la identidad del usuario
-- antes de consultar o marcar notificaciones
-- como leidas.

COMMIT;
