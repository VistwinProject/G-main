// Build static Pages output only; never publish server, tooling, or internal notes.
import { mkdir, readdir, cp, writeFile } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url));
const output=resolve(process.argv[2] || join(root,'dist/pages'));
if(!relative(root,output) || output===resolve(root,'apps'))throw Error('Use a separate empty output directory');
try{
  if((await readdir(output)).length)throw Error('Output must be empty; choose a new directory: '+output);
}catch(error){if(error.code!=='ENOENT')throw error;}
await mkdir(output,{recursive:true});
for(const app of ['main','pad']){
  const source=join(root,'apps',app),target=join(output,app);
  await mkdir(target);
  for(const entry of await readdir(source)){
    if(!['index.html','css','js','assets','models','robots.txt'].includes(entry) && !/^layout(?:-[a-z0-9]+)?\.json$/.test(entry))continue;
    await cp(join(source,entry),join(target,entry),{recursive:true});
  }
}
await writeFile(join(output,'.nojekyll'),'');
await writeFile(join(output,'index.html'),`<!doctype html>
<html lang="zh-Hant"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow">
<title>雲端宅邸</title>
<script>location.replace('./main/' + location.search + location.hash);</script>
<p><a href="./main/">開啟 Main 主畫面</a> · <a href="./pad/">開啟 Pad 住戶端</a></p>
</html>
`);
const commit=execFileSync('git',['-c','safe.directory='+root,'rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
await writeFile(join(output,'deploy-version.json'),JSON.stringify({sourceCommit:commit,main:'./main/',pad:'./pad/'},null,2)+'\n');
console.log('Pages output: '+output+'\nSource commit: '+commit);

