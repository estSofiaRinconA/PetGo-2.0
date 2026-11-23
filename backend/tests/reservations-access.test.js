const test = require('node:test');
const assert = require('node:assert/strict');
const server = require('../server');
const { validRequest } = require('../routes/reservations.routes');

async function baseURL() {
  if (!server.listening) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${server.address().port}`;
}
test.after(async () => {
  if (server.listening) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});
test('Consultar reservas sin sesión devuelve 401', async () => {
  const base = await baseURL();
  assert.equal((await fetch(base + '/api/reservations')).status, 401);
});
test('Crear reserva sin sesión devuelve 401', async () => {
  const base = await baseURL();
  const response = await fetch(base + '/api/reservations', {
    method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' }, body: '{}'
  });
  assert.equal(response.status, 401);
});
test('Crear reserva desde origen ajeno devuelve 403', async () => {
  const base = await baseURL();
  const response = await fetch(base + '/api/reservations', {
    method: 'POST', headers: { Origin: 'https://no-autorizado.example', 'Content-Type': 'application/json' }, body: '{}'
  });
  assert.equal(response.status, 403);
});
test('Validar reserva rechaza IDs ajenos al formato UUID', () => {
  assert.equal(validRequest({ pet_id: 'otra-persona', service_variant_id: 'x', scheduled_at: new Date(Date.now() + 86400000).toISOString() }), null);
});
test('Validar reserva rechaza fecha pasada y campos adicionales', () => {
  const id = '123e4567-e89b-42d3-a456-426614174000';
  assert.equal(validRequest({ pet_id: id, service_variant_id: id, scheduled_at: new Date(Date.now() - 86400000).toISOString() }), null);
  assert.equal(validRequest({ pet_id: id, service_variant_id: id, scheduled_at: new Date(Date.now() + 86400000).toISOString(), user_id: id }), null);
});
