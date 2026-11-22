const test=require('node:test');
const assert=require('node:assert/strict');
const server=require('../server');
async function onPort(){if(!server.listening)await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return `http://127.0.0.1:${server.address().port}`;}
test.after(async()=>{if(server.listening)await new Promise(resolve=>server.close(resolve));});
test('GET mascotas sin sesion devuelve 401',async()=>{const u=await onPort();const r=await fetch(u+'/api/pets');assert.equal(r.status,401);});
test('POST mascotas sin Origin devuelve 403',async()=>{const u=await onPort();const r=await fetch(u+'/api/pets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nombre:'Luna',especie:'perro',raza:'',observaciones:''})});assert.equal(r.status,403);});
