// Paso 92: contrato publico minimo de permisos sobre cambios admin.
const test = require('node:test');
const assert = require('node:assert/strict');
const server = require('../server');
const UUID = '123e4567-e89b-42d3-a456-426614174000';
async function base() {
  if (!server.listening) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${server.address().port}`;
}
test.after(async () => {
  if (server.listening) await new Promise(resolve => server.close(resolve));
});
test('No se confirma una reserva sin autenticar', async () => {
  const url = await base();
  const response = await fetch(url + '/api/admin/bookings/status', {
    method: 'PATCH',
    headers: { Origin: url, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: UUID, status: 'confirmada' })
  });
  assert.equal(response.status, 401);
});
test('Un origen externo no puede confirmar reservas', async () => {
  const url = await base();
  const response = await fetch(url + '/api/admin/bookings/status', {
    method: 'PATCH',
    headers: { Origin: 'https://externo.example', 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: UUID, status: 'confirmada' })
  });
  assert.equal(response.status, 403);
});
