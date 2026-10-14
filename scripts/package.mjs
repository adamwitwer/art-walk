import {mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
await mkdir('dist',{recursive:true});
execFileSync('zip',['-qr','../dist/art-walk-netlify.zip','.'],{cwd:'public',stdio:'inherit'});
console.log('Netlify deployment package: dist/art-walk-netlify.zip');
