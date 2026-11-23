const test=require('node:test');
const assert=require('node:assert/strict');
const server=require('../server');
const {validChange,allowedOrigin}=require('../routes/admin.routes');
const uuid='123e4567-e89b-42d3-a456-426614174000';
async function base(){
  if(!server.listening)await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  return `http://127.0.0.1:${server.address().port}`;
}
test.after(async()=>{if(server.listening)await new Promise(resolve=>server.close(resolve));});
test('Sin sesion no se puede ver acceso admin',async()=>{
  const url=await base();
  assert.equal((await fetch(url+'/api/admin/me')).status,401);
});
test('Sin sesion no se listan reservas administrativas',async()=>{
  const url=await base();
  assert.equal((await fetch(url+'/api/admin/bookings')).status,401);
});
test('Cambio de estado desde un origen externo es rechazado',async()=>{
  const url=await base();
  const response=await fetch(url+'/api/admin/bookings/status',{
    method:'PATCH',headers:{Origin:'https://externo.example','Content-Type':'application/json'},
    body:JSON.stringify({id:uuid,status:'confirmada'})
  });
  assert.equal(response.status,403);
});
test('Cambio de estado sin Origin es rechazado',async()=>{
  const url=await base();
  const response=await fetch(url+'/api/admin/bookings/status',{
    method:'PATCH',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:uuid,status:'confirmada'})
  });
  assert.equal(response.status,403);
});
test('Cambio de estado sin sesion es rechazado',async()=>{
  const url=await base();
  const response=await fetch(url+'/api/admin/bookings/status',{
    method:'PATCH',headers:{Origin:url,'Content-Type':'application/json'},
    body:JSON.stringify({id:uuid,status:'confirmada'})
  });
  assert.equal(response.status,401);
});
test('No se aceptan cambios arbitrarios, IDs incorrectos ni campos extra',()=>{
  assert.deepEqual(validChange({id:uuid,status:'confirmada'}),{id:uuid,status:'confirmada'});
  assert.equal(validChange({id:uuid,status:'cancelada'}),null);
  assert.equal(validChange({id:uuid,status:'completada',user_id:uuid}),null);
  assert.equal(validChange({id:'foo',status:'confirmada'}),null);
});
test('GET no cambia el estado de las reservas',async()=>{
  const url=await base();
  assert.equal((await fetch(url+'/api/admin/bookings/status')).status,405);
});
