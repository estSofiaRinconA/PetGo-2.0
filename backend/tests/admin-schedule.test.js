const test=require('node:test');
const assert=require('node:assert/strict');
const server=require('../server');
const {validSchedule}=require('../routes/schedule.routes');
const id='00000000-0000-4000-8000-000000000001';
test('Reglas de agenda rechazan datos incorrectos',()=>{
  const good={weekdays:[1,2,3,4,5,6],opening:'08:00',closing:'18:00',variants:[{id,duration_minutes:60,capacity:1}]};
  assert.equal(validSchedule(good,[id]),true);
  assert.equal(validSchedule({...good,weekdays:[1,1]},[id]),false);
  assert.equal(validSchedule({...good,opening:'19:00'},[id]),false);
  assert.equal(validSchedule({...good,variants:[{id,duration_minutes:0,capacity:1}]},[id]),false);
  assert.equal(validSchedule({...good,variants:[{id,duration_minutes:60,capacity:0}]},[id]),false);
  assert.equal(validSchedule({...good,user_id:id},[id]),false);
});
test('Agenda exige autenticacion y origen permitido',async()=>{
  const address=await new Promise((resolve,reject)=>{
    if(server.listening)return resolve(server.address());
    server.listen(0,'127.0.0.1',()=>resolve(server.address()));
    server.once('error',reject);
  });
  const base=`http://127.0.0.1:${address.port}`;
  const r=await fetch(`${base}/api/admin/schedule`);
  assert.equal(r.status,401);
  const cross=await fetch(`${base}/api/admin/schedule`,{method:'PATCH',headers:{Origin:'https://bad.example','Content-Type':'application/json'},body:'{}'});
  assert.equal(cross.status,403);
});
