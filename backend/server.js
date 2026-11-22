// PETGO 2.0 — API Node.js
const http = require('node:http');
const PORT = Number(process.env.PORT || 3000);
function responder(res,codigo,contenido,extra={}) {
  res.writeHead(codigo,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...extra});
  res.end(JSON.stringify(contenido));
}
const rutas = new Map([
  ['/api/auth/register',['POST']], ['/api/auth/login',['POST']],
  ['/api/auth/me',['GET']], ['/api/auth/logout',['POST']],
  ['/api/profile',['GET','PATCH']], ['/api/pets',['GET','POST']],
  ['/api/services',['GET']], ['/api/reservations',['GET','POST']],
  ['/api/notifications',['GET']]
]);
const server = http.createServer(async(req,res)=>{
  if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
  let pathname;
  try{pathname=new URL(req.url,`http://${req.headers.host||'localhost'}`).pathname;}
  catch{return responder(res,400,{success:false,error:'URL invalida'});}
  if(pathname==='/' && req.method==='GET')return responder(res,200,{success:true,message:'API PetGo 2.0 activa'});
  const metodos=rutas.get(pathname);
  if(!metodos)return responder(res,404,{success:false,error:'Ruta no encontrada'});
  if(!metodos.includes(req.method))return responder(res,405,{success:false,error:'M\u00e9todo no permitido'},{Allow:metodos.join(', ')});
  if(pathname.startsWith('/api/auth/')){
    try{return await require('./routes/auth.routes').manejarAuth(req,res,pathname);}
    catch(err){console.error('Auth:',err.name||'Error');return responder(res,503,{success:false,error:'Autenticacion no disponible.'});}
  }
  if(pathname==='/api/profile'){
    try{return await require('./routes/profile.routes').manejarPerfil(req,res);}
    catch(err){console.error('Profile:',err.name||'Error');return responder(res,503,{success:false,error:'Perfil no disponible.'});}
  }
  if(pathname==='/api/services'){
    try{return await require('./routes/services.routes').handleServices(req,res);}
    catch(err){console.error('Services:',err.name||'Error');return responder(res,503,{success:false,error:'Catalogo no disponible.'});}
  }
  if(pathname==='/api/pets'){
    try{return await require('./routes/pets.routes').handlePets(req,res);}
    catch(err){console.error('Pets:',err.name||'Error');return responder(res,503,{success:false,error:'Mascotas no disponible.'});}
  }
  return responder(res,503,{success:false,error:'Funcion temporalmente no disponible: integracion pendiente.'});
});
if(require.main===module)server.listen(PORT,()=>console.log(`API PetGo activa en http://localhost:${PORT}`));
module.exports=server;
