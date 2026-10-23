// Zero dependencies. Optional browser checks are run separately (see README).
const {spawnSync}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');let count=0;
function run(args){const result=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0)process.exit(result.status||1);}
for(const name of fs.readdirSync(root).filter(name=>name.endsWith('.js')))run(['--check',name]);
for(const name of fs.readdirSync(__dirname).filter(name=>name.endsWith('.cjs')&&!name.includes('browser')&&name!=='run.cjs')){run([path.join('tests',name)]);count++;}
console.log(`PASS: JavaScript syntax and ${count} regression suites.`);
