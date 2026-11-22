const test = require('node:test');
const assert = require('node:assert/strict');
const server = require('../server');
async function origin() {
  if (!server.listening) await new Promise(resolve => server.listen(0,'127.0.0.1', resolve));
  return `http://127.0.0.1:${server.address().port}`;
}
test.after(async () => {
  if (server.listening) await new Promise(resolve => server.close(resolve));
});
test('PATCH mascota sin sesion responde 401', async () => {
  const base = await origin();
  const res = await fetch(base+'/api/pets/item', {
    method:'PATCH', headers:{ Origin:base, 'Content-Type':'application/json' },
    body:JSON.stringify({id:'11111111-1111-4111-8111-111111111111',nombre:'Sol',especie:'gato',raza:'',observaciones:'',fecha_nacimiento:''})
  });
  assert.equal(res.status,401);
});
test('DELETE mascota sin sesion responde 401', async () => {
  const base = await origin();
  const res = await fetch(base+'/api/pets/item', {
    method:'DELETE', headers:{ Origin:base, 'Content-Type':'application/json' },
    body:JSON.stringify({id:'11111111-1111-4111-8111-111111111111'})
  });
  assert.equal(res.status,401);
});
test('PATCH desde origen ajeno responde 403', async () => {
  const base=await origin();
  const res=await fetch(base+'/api/pets/item',{
    method:'PATCH',headers:{Origin:'https://invalid.example','Content-Type':'application/json'},
    body:JSON.stringify({id:'11111111-1111-4111-8111-111111111111'})
  });
  assert.equal(res.status,403);
});
test('DELETE sin Origin responde 403', async () => {
  const base=await origin();
  const res=await fetch(base+'/api/pets/item',{
    method:'DELETE',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:'11111111-1111-4111-8111-111111111111'})
  });
  assert.equal(res.status,403);
});
test('Ruta de edicion no acepta GET', async () => {
  const base=await origin();
  const res=await fetch(base+'/api/pets/item');
  assert.equal(res.status,405);
});
