const fs=require('fs'),vm=require('vm'),assert=require('assert');
const esbuild=require('esbuild');
const source=fs.readFileSync(require('path').join(__dirname,'..','server.ts'),'utf8');
const section=source.slice(source.indexOf('  // Extract only from'),source.indexOf('  // Authenticated front gateway'));
const code=esbuild.transformSync(section,{loader:'ts'}).code;
(async()=>{
  let handler,calls=0,upstreamOK=true;
  const original='Luis: Enviaré el informe.';
  let result={items:[{tipo:'accion',title:'Enviar informe',detalle:'Enviar informe',evidencia:original,responsable:'Luis',vencimiento:null},{tipo:'decision',title:'Inventada',detalle:'No consta',evidencia:'No existe'}]};
  const context={app:{post:(path,fn)=>handler=fn},PM_API_URL:'http://unused',PM_API_KEY:'test',AbortSignal,
    fetch:async()=>({ok:upstreamOK,status:403,json:async()=>({title:'Reunión',fecha:'2026-10-02',content:original})}),
    ai:{models:{generateContent:async()=>{calls++;return {text:JSON.stringify(result)}}}}};
  vm.createContext(context);vm.runInContext(code,context);
  async function request(body){const res={statusCode:200,status(code){this.statusCode=code;return this},json(data){this.data=data;return this}};await handler({body},res);return res}
  let res=await request({project_id:'p',meeting_id:'m'});assert.equal(res.data.items.length,1);assert.equal(res.data.omitted,1);
  upstreamOK=false;res=await request({project_id:'p',meeting_id:'m'});assert.equal(res.statusCode,403);assert.equal(calls,1);
  res=await request({project_id:2,meeting_id:'m'});assert.equal(res.statusCode,400);
  upstreamOK=true;result={nonsense:true};res=await request({project_id:'p',meeting_id:'m'});assert.equal(res.statusCode,502);
  console.log('Proveedor IA: respuesta válida, evidencia inexistente, permisos y respuesta inválida verificados con dobles de prueba.');
})().catch(e=>{console.error(e);process.exitCode=1});
