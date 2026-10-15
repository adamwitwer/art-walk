import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {matches,groups,directions,distanceMeters,readProgress} from '../public/domain.js';
const data=JSON.parse(readFileSync(new URL('../public/stops.json',import.meta.url)));
test('PDF extraction has 35 numbered stops, 86 artists, complete contacts, and local pins',()=>{
  assert.deepEqual(data.stops.map(s=>s.id),Array.from({length:35},(_,i)=>i+1));
  assert.equal(data.stops.flatMap(s=>s.artists).length,86);
  assert.deepEqual(data.stops.filter(s=>s.accessible).map(s=>s.id),[2,8,10,11,13,32]);
  for(const stop of data.stops){
    assert.ok(stop.lat>38.95&&stop.lat<39&&stop.lng> -77.11&&stop.lng< -77.05);
    assert.ok(stop.address&&stop.city&&stop.artists.length);
    for(const artist of stop.artists){assert.ok(artist.name&&artist.medium&&artist.contact);assert.ok(/^(https:\/\/|mailto:)/.test(artist.url));assert.ok(groups(artist.medium).length,artist.medium);}
  }
});
test('search handles artists, addresses, explicit stop numbers, and combined art filters',()=>{
  assert.ok(matches(data.stops[32],'Jenny Wilson','Mixed media'));
  assert.ok(!matches(data.stops[32],'Jenny Wilson','Photography'));
  assert.ok(matches(data.stops[0],' cityline '));
  assert.ok(matches(data.stops[34],'#35'));
  assert.ok(!matches(data.stops[33],'#35'));
  assert.ok(matches(data.stops[1],'Grafton','Painting & drawing'));
  assert.ok(matches(data.stops[25],'','Ceramics'));
});
test('directions use the full address and walking mode for both providers',()=>{
  for(const stop of [data.stops[0],data.stops[10],data.stops[34]]){
    const apple=new URL(directions(stop));
    assert.equal(apple.hostname,'maps.apple.com');assert.equal(apple.searchParams.get('mode'),'walking');
    assert.equal(apple.searchParams.get('destination'),`${stop.address}, ${stop.city}, USA`);
    const google=new URL(directions(stop,'google'));
    assert.equal(google.searchParams.get('travelmode'),'walking');assert.equal(google.searchParams.get('destination'),apple.searchParams.get('destination'));
  }
});
test('saved progress tolerates corrupt storage, deduplicates, and validates IDs',()=>{
  const storage=value=>({getItem:()=>value});
  assert.equal(readProgress(storage('{bad')).saved.size,0);
  assert.equal(readProgress(storage('null')).visited.size,0);
  const p=readProgress(storage(JSON.stringify({saved:[1,1,35,36,-1,'2'],visited:[8,32],provider:'google'})));
  assert.deepEqual([...p.saved],[1,35]);assert.deepEqual([...p.visited],[8,32]);assert.equal(p.provider,'google');
  assert.equal(readProgress({getItem:()=>{throw Error('Unavailable');}}).saved.size,0);
});
test('nearest distances are symmetric and reasonable across the neighborhood',()=>{
  assert.equal(distanceMeters(data.stops[0],data.stops[0]),0);
  assert.equal(distanceMeters(data.stops[0],data.stops[1]),distanceMeters(data.stops[1],data.stops[0]));
  assert.ok(distanceMeters(data.stops[0],data.stops[1])>400);
  assert.ok(distanceMeters(data.stops[0],data.stops[1])<1000);
});
test('text size defaults safely for existing progress and restores supported preferences',()=>{
  const stored=data=>({getItem:()=>JSON.stringify(data)});
  for(const textSize of [undefined,null,'huge',3,'default']){
    const p=readProgress(stored({saved:[8],visited:[2],provider:'google',textSize}));
    assert.equal(p.textSize,'default');
    assert.deepEqual([...p.saved],[8]);assert.deepEqual([...p.visited],[2]);assert.equal(p.provider,'google');
  }
  for(const textSize of ['larger','largest'])assert.equal(readProgress(stored({textSize})).textSize,textSize);
  assert.equal(readProgress({getItem:()=>{throw Error('Unavailable');}}).textSize,'default');
  assert.equal(readProgress({getItem:()=>'{bad'}).textSize,'default');
});
test('every offline asset exists and only curated files are served',()=>{
  const sw=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');
  const assets=sw.match(/const ASSETS = (\[[^;]+\])/)[1].replaceAll("'",'"');
  for(const file of JSON.parse(assets)){assert.doesNotThrow(()=>readFileSync(new URL('../public'+(file==='/'?'/index.html':file),import.meta.url)),file);assert.ok(!/\.pdf$|sponsor/i.test(file));}
});
