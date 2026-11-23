const test = require('node:test');
const assert = require('node:assert/strict');
const server = require('../server');
const { validateCancel } = require('../routes/reservations.routes');
async function baseURL() {
  if (!server.listening) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${server.address().port}`;
}
test.after(async () => {
  if (server.listening) await new Promise(resolve => server.close(resolve));
});
const id = '123e4567-e89b-42d3-a456-426614174000';
test('Cancelar sin sesion devuelve 401', async () => {
  const base = await baseURL();
  const response = await fetch(base + '/api/reservations/cancel', {
    method: 'PATCH', headers: { Origin: base, 'Content-Type': 'application/json' }, body: JSON.stringify({ id })
  });
  assert.equal(response.status, 401);
});
test('Cancelar desde un origen ajeno devuelve 403', async () => {
  const base = await baseURL();
  const response = await fetch(base + '/api/reservations/cancel', {
    method: 'PATCH', headers: { Origin: 'https://externo.example', 'Content-Type': 'application/json' }, body: JSON.stringify({ id })
  });
  assert.equal(response.status, 403);
});
test('Cancelar sin origen devuelve 403', async () => {
  const base = await baseURL();
  const response = await fetch(base + '/api/reservations/cancel', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id })
  });
  assert.equal(response.status, 403);
});
test('La ruta cancelar no admite GET', async () => {
  const base = await baseURL();
  assert.equal((await fetch(base + '/api/reservations/cancel')).status, 405);
});
test('Cancelar rechaza IDs y campos adicionales', () => {
  assert.equal(validateCancel({ id: 'invalido' }), null);
  assert.equal(validateCancel({ id, user_id: id }), null);
  assert.equal(validateCancel({ id }), id);
});
