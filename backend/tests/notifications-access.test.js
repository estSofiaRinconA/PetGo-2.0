const test=require('node:test');
const assert=require('node:assert/strict');
const server=require('../server');
async function base(){if(!server.listening)await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return `http://127.0.0.1:${server.address().port}`;}
test.after(async()=>{if(server.listening)await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()));});
test('GET notificaciones requiere sesion',async()=>{assert.equal((await fetch((await base())+'/api/notifications')).status,401);});
test('PATCH notificacion requiere sesion',async()=>{const u=await base();assert.equal((await fetch(u+'/api/notifications/read',{method:'PATCH',headers:{Origin:u,'Content-Type':'application/json'},body:JSON.stringify({id:'123e4567-e89b-42d3-a456-426614174000'})})).status,401);});
test('PATCH desde otro origen se rechaza',async()=>{const u=await base();assert.equal((await fetch(u+'/api/notifications/read',{method:'PATCH',headers:{Origin:'https://sitio-ajeno.example','Content-Type':'application/json'},body:'{}'})).status,403);});
test('GET en endpoint de marcar leidas devuelve 405',async()=>{assert.equal((await fetch((await base())+'/api/notifications/read')).status,405);});
