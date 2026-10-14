// Node entrypoint avoids executing a platform-specific CLI committed in node_modules.
const esbuild=require('esbuild');
const fs=require('node:fs');
esbuild.buildSync({entryPoints:['server.ts'],bundle:true,platform:'node',format:'cjs',outfile:'dist/server.cjs',external:['express']});
for(const name of ['index.html','manifest.json','icon.svg','people.js','people.css'])fs.copyFileSync(name,'dist/'+name);
