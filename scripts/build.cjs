// Node entrypoint avoids executing a platform-specific CLI committed in node_modules.
const esbuild=require('esbuild');
const fs=require('node:fs');
fs.mkdirSync('dist',{recursive:true});
esbuild.buildSync({entryPoints:['server.ts'],bundle:true,platform:'node',nodePaths:(process.env.NODE_PATH||'').split(require('node:path').delimiter).filter(Boolean),format:'cjs',outfile:'dist/server.cjs',external:['express']});
// Keep dependency labels reproducible when dependencies live outside a sparse checkout.
const path=require('node:path');
let bundle=fs.readFileSync('dist/server.cjs','utf8');
for(const root of (process.env.NODE_PATH||'').split(path.delimiter).filter(Boolean)){
  const label=path.relative(process.cwd(),root).split(path.sep).join('/');
  if(label!=='node_modules')bundle=bundle.split(label+'/').join('node_modules/');
}
fs.writeFileSync('dist/server.cjs',bundle);
for(const name of ['index.html','manifest.json','icon.svg','people.js','people.css','associations.js','associations.css','relationship-review.js','human.js','human.css'])fs.copyFileSync(name,'dist/'+name);
