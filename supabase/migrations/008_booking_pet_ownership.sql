
-- PetGo 2.0
-- Migración 008: garantizar propiedad de mascotas en reservas

-- Permitir referencia compuesta
ALTER TABLE petgo_v2.pets
ADD CONSTRAINT pets_id_user_unique
UNIQUE (id, user_id);

-- Impedir reservas asociadas a mascotas de otro usuario
ALTER TABLE petgo_v2.bookings
ADD CONSTRAINT bookings_pet_owner_fkey
FOREIGN KEY (pet_id, user_id)
REFERENCES petgo_v2.pets(id, user_id);
