// Temporary file preview for environments that cannot open a listening socket.
// Production remains the unbundled static application in public/.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const read=p=>readFile('public/'+p,'utf8');
let html=await read('index.html');
const css=await read('styles.css'), leafletCSS=await read('vendor/leaflet.css'), leaflet=await read('vendor/leaflet.js');
const domain=(await read('domain.js')).replaceAll('export function','function');
let app=(await read('app.js')).replace(/^import[^\n]+\n/,'').replace("await fetch('/stops.json')",'await Promise.resolve({ok:true,json:async()=>GUIDE_DATA})');
html=html.replace('<link rel="stylesheet" href="/vendor/leaflet.css">',()=>`<style>${leafletCSS}</style>`).replace('<link rel="stylesheet" href="/styles.css">',()=>`<style>${css}</style>`);
html=html.replace('<script src="/vendor/leaflet.js" defer></script>','').replace('<script src="/app.js" type="module"></script>','');
const icon=await read('icon.svg');html=html.replaceAll('src="/icon.svg"',`src="data:image/svg+xml;base64,${Buffer.from(icon).toString('base64')}"`);
const data=await read('stops.json');
html=html.replace('</body>',()=>`<script>${leaflet}</script><script>(()=>{const GUIDE_DATA=${data};\n${domain}\n${app}\n})();</script></body>`);
await mkdir('tmp',{recursive:true});
await writeFile('tmp/preview.html',html);
console.log('File preview: tmp/preview.html');
