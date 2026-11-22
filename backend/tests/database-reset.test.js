// PETGO 2.0 - PRUEBAS DE RUTAS
const test = require('node:test');
const assert = require('node:assert/strict');
const server = require('../server');
async function iniciarServidor() {
  if(!server.listening) await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  return `http://127.0.0.1:${server.address().port}`;
}
test.after(async()=>{
  if(server.listening) await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
});
test('La API propia sigue activa',async()=>{
  const url=await iniciarServidor();const r=await fetch(url+'/');
  assert.equal(r.status,200);assert.equal((await r.json()).success,true);
});
test('Las rutas restantes siguen pendientes',async()=>{
  const url=await iniciarServidor();
  for(const path of ['/api/reservations','/api/notifications']){
    assert.equal((await fetch(url+path)).status,503);
  }
});
test('Una ruta desconocida devuelve 404',async()=>{
  const url=await iniciarServidor();assert.equal((await fetch(url+'/api/ruta-inexistente')).status,404);
});
test('Registro rechaza un metodo incorrecto',async()=>{
  const url=await iniciarServidor();assert.equal((await fetch(url+'/api/auth/register')).status,405);
});
test('Login rechaza un metodo incorrecto',async()=>{
  const url=await iniciarServidor();assert.equal((await fetch(url+'/api/auth/login')).status,405);
});
test('Consultar usuario sin sesion devuelve 401',async()=>{
  const url=await iniciarServidor();assert.equal((await fetch(url+'/api/auth/me')).status,401);
});
test('Registro rechaza datos incompletos',async()=>{
  const url=await iniciarServidor();const r=await fetch(url+'/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nombre:'',email:'incorrecto',password:'123'})});
  assert.equal(r.status,400);
});
test('Registro rechaza JSON invalido',async()=>{
  const url=await iniciarServidor();const r=await fetch(url+'/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:'{json-invalido'});
  assert.equal(r.status,400);
});
test('Consultar perfil sin sesion devuelve 401',async()=>{
  const url=await iniciarServidor();assert.equal((await fetch(url+'/api/profile')).status,401);
});
test('Modificar perfil sin sesion se rechaza',async()=>{
  const url=await iniciarServidor();const r=await fetch(url+'/api/profile',{method:'PATCH',headers:{'Content-Type':'application/json',Origin:url},body:JSON.stringify({nombre:'Prueba',telefono:'',ciudad:''})});
  assert.equal(r.status,401);
});
test('Modificar perfil desde otro origen se rechaza',async()=>{
  const url=await iniciarServidor();const r=await fetch(url+'/api/profile',{method:'PATCH',headers:{'Content-Type':'application/json',Origin:'https://sitio-no-autorizado.example'},body:JSON.stringify({nombre:'Prueba',telefono:'',ciudad:''})});
  assert.equal(r.status,403);
});
test('Mascotas exige sesion',async()=>{
  const url=await iniciarServidor();assert.equal((await fetch(url+'/api/pets')).status,401);
});

test('El catalogo requiere sesion',async()=>{
  const url=await iniciarServidor();
  const r=await fetch(url+'/api/services');
  assert.equal(r.status,401);
});
