import {matches, groups, directions, distanceMeters, readProgress} from './domain.js';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let storage;
try { storage = localStorage; } catch { storage = {getItem:() => null, setItem:() => {throw Error('Storage unavailable');}}; }
let progress = readProgress(storage);
let stops = [], view = 'explore', filter = 'all', selected = null, location = null, map, markers, userMarker, savedMap = false;
let toastTimeout;
document.body.dataset.view = view;
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { $('#toast').hidden = true; }, 3500);
}
function persist() {
  try { storage.setItem('artwalk-2026', JSON.stringify({saved:[...progress.saved],visited:[...progress.visited],provider:progress.provider})); }
  catch { toast('Browser storage is unavailable. Progress will last for this session only.'); }
}
function filteredStops() {
  return stops.filter(s => matches(s, $('#search').value, $('#medium').value)
    && (view !== 'saved' || progress.saved.has(s.id))
    && (filter !== 'accessible' || s.accessible)
    && (filter !== 'unvisited' || !progress.visited.has(s.id)))
    .sort((a, b) => location ? distanceMeters(location, a) - distanceMeters(location, b) : a.id - b.id);
}
function distanceLabel(stop) {
  if (!location) return '';
  const miles = distanceMeters(location, stop) / 1609.344;
  return `${miles < .1 ? '<0.1' : miles.toFixed(1)} mi away · straight line`;
}
function card(stop) {
  const saved = progress.saved.has(stop.id), visited = progress.visited.has(stop.id);
  const media = [...new Set(stop.artists.map(a => a.medium))];
  return `<article class="stop-card ${visited ? 'visited' : ''}" id="stop-${stop.id}">
    <div class="card-main"><span class="stop-number" aria-label="Stop ${stop.id}">${stop.id}</span>
    <button class="stop-open" data-open="${stop.id}"><h3>${escape(stop.address)}</h3><span class="card-city">${escape(stop.title || stop.city)}${stop.accessible ? ' · ♿' : ''}</span></button>
    <button class="save-button" data-save="${stop.id}" aria-pressed="${saved}" aria-label="${saved ? 'Unsave' : 'Save'} stop ${stop.id}">${saved ? '♥' : '♡'}</button></div>
    <p class="artist-preview">${stop.artists.map(a => escape(a.name)).join(' · ')}</p>
    <div class="medium-preview">${escape(media.join(' / '))}</div>
    ${location ? `<div class="small-status">${distanceLabel(stop)}</div>` : ''}
    <div class="card-actions"><button data-map="${stop.id}" aria-label="Show stop ${stop.id} on map">◇ On map</button><button data-visit="${stop.id}" aria-pressed="${visited}">${visited ? '✓ Visited' : '○ Mark visited'}</button><a href="${escape(directions(stop,progress.provider))}" target="_blank" rel="noopener noreferrer" aria-label="Walking directions to stop ${stop.id}">Walk here ↗</a></div>
  </article>`;
}
function render() {
  const items = filteredStops();
  $('#result-count').textContent = `${items.length} ${items.length === 1 ? 'stop' : 'stops'} · ${items.reduce((n,s) => n+s.artists.length,0)} artists`;
  $('#list-title').textContent = view === 'saved' ? 'Your own art walk' : location ? 'Closest stops first' : 'Find your next stop';
  $('#stop-list').innerHTML = items.length ? items.map(card).join('') : `<div class="empty-state"><h3>${view === 'saved' && !progress.saved.size ? 'Make it your kind of walk.' : 'No stops here yet.'}</h3><p>${view === 'saved' && !progress.saved.size ? 'Tap a heart on any stop to save it here. Pick a few favorites, then head out.' : 'Try another search or clear your filters to see more of the neighborhood.'}</p><button id="clear-filters">${view === 'saved' && !progress.saved.size ? 'Explore all stops ↗' : 'Clear filters'}</button></div>`;
  $('#saved-count').textContent = progress.saved.size;
  $('#progress-label').textContent = `${progress.visited.size} of 35 visited`;
  $('#progress').value = progress.visited.size;
  $$('.bottom-nav button').forEach(b => {if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  $$('.filter-chips button').forEach(b => b.setAttribute('aria-pressed',b.dataset.filter===filter));
  $('#map-saved').setAttribute('aria-pressed',savedMap);
  $('#map-status').textContent = `${mapItems().length} stops shown · tap a number`;
  renderPins();
}
function setView(next) {
  view=next; document.body.dataset.view=view;
  render();
  requestAnimationFrame(() => { if(map){map.invalidateSize();if(view==='map')fitMap();} });
  window.scrollTo({top:0,behavior:'instant'});
}
function toggle(type,id) {
  const set=progress[type];
  if(set.has(id))set.delete(id);else set.add(id);
  persist();render();
  if($('#detail').open && selected?.id===id)renderDetail(false);
  toast(type==='saved' ? (set.has(id) ? `Stop ${id} saved to My walk` : `Stop ${id} removed from My walk`) : (set.has(id) ? `Stop ${id} marked visited` : `Stop ${id} marked unvisited`));
}
function renderDetail(resetScroll = true) {
  const s=selected;
  if(!s)return;
  const visited=progress.visited.has(s.id),saved=progress.saved.has(s.id);
  const scroll=$('#detail').scrollTop;
  const active=document.activeElement?.dataset;
  $('#detail-content').innerHTML=`<div class="dialog-header"><span class="stop-number">${s.id}</span><p class="eyebrow">STOP ${s.id} OF 35</p><button class="icon-button" data-close="detail" aria-label="Close stop details">×</button></div>
    <h2 id="detail-title" class="detail-address">${escape(s.address)}</h2><p class="detail-city">${escape(s.city)}${s.title ? ` · ${escape(s.title)}`:''}</p>
    ${s.accessible?'<span class="access-badge">♿ Marked accessible in the pamphlet</span>':''}
    <div class="detail-buttons"><a class="primary-button" href="${escape(directions(s,progress.provider))}" target="_blank" rel="noopener noreferrer">Walk here ↗</a><button class="secondary-button" data-save="${s.id}" aria-pressed="${saved}">${saved?'♥ Saved':'♡ Save stop'}</button><button class="secondary-button" data-visit="${s.id}" aria-pressed="${visited}">${visited?'✓ Visited':'Mark visited'}</button></div>
    <p class="eyebrow" style="margin-top:28px">${s.artists.length} ${s.artists.length===1?'ARTIST':'ARTISTS'} TO DISCOVER</p>
    <ul class="artist-list">${s.artists.map(a=>`<li><h3>${escape(a.name)}</h3><p>${escape(a.medium)}</p><a href="${escape(a.url)}" ${a.url.startsWith('mailto:')?'':'target="_blank" rel="noopener noreferrer"'}>${escape(a.contact)} ${a.url.startsWith('mailto:')?'✉':'↗'}</a></li>`).join('')}</ul>
    <div class="detail-controls"><button data-prev ${s.id===1?'disabled':''}>← Previous stop</button><button data-share="${s.id}">Share stop ↗</button><button data-next ${s.id===35?'disabled':''}>Next stop →</button></div>`;
  $('#detail').scrollTop=resetScroll?0:scroll;
  if(!resetScroll && active){const key=active.save?'save':active.visit?'visit':null;if(key)$(`#detail [data-${key}]`)?.focus({preventScroll:true});}
}
function openStop(id) {
  selected=stops.find(s=>s.id===id);if(!selected)return;
  renderDetail();
  if(!$('#detail').open){$('#detail').showModal();document.body.style.overflow='hidden';}
  const url=new URL(window.location);url.searchParams.set('stop',id);history.replaceState(null,'',url);
  renderPins();
}
$('#detail').addEventListener('close',()=>{document.body.style.overflow='';const url=new URL(window.location);url.searchParams.delete('stop');history.replaceState(null,'',url);selected=null;renderPins();});
$('#info').addEventListener('close',()=>{document.body.style.overflow='';});
for(const dialog of [$('#info'),$('#detail')])dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
function mapItems() {return filteredStops().filter(s=>!savedMap||progress.saved.has(s.id));}
function fitMap() {
  if(!map)return;
  const items=mapItems();if(items.length)map.fitBounds(items.map(s=>[s.lat,s.lng]),{padding:[36,36],maxZoom:16,animate:false});
}
function renderPins() {
  if(!map||!markers)return;
  markers.clearLayers();
  mapItems().forEach(s=>{
    const classes=`${progress.visited.has(s.id)?'visited':progress.saved.has(s.id)?'saved':''} ${selected?.id===s.id?'selected':''}`;
    const marker=L.marker([s.lat,s.lng],{icon:L.divIcon({className:'map-pin',html:`<span class="pin ${classes}">${s.id}</span>`,iconSize:[34,34],iconAnchor:[17,17]}),title:`Stop ${s.id}: ${s.address}`,alt:`Stop ${s.id}: ${s.address}`,keyboard:true}).addTo(markers);
    marker.on('click',()=>openStop(s.id));
    marker.getElement()?.setAttribute('aria-label',`Stop ${s.id}: ${s.address}`);
  });
}
function initMap() {
  if(!window.L){$('#map-warning').hidden=false;$('#map').innerHTML='<p class="loading">Map could not load. The complete stop list is still available.</p>';return;}
  map=L.map('map',{zoomControl:true,scrollWheelZoom:false}).setView([38.9714,-77.0737],14);
  const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'}).addTo(map);
  tiles.on('tileerror',()=>{$('#map-warning').hidden=false;});
  tiles.on('tileload',()=>{if(navigator.onLine)$('#map-warning').hidden=true;});
  markers=L.layerGroup().addTo(map);renderPins();fitMap();
  new ResizeObserver(()=>map.invalidateSize()).observe($('#map'));
}
async function shareStop(id) {
  const stop=stops.find(s=>s.id===id),url=new URL(window.location);url.search='';url.searchParams.set('stop',id);
  try {
    if(navigator.share)await navigator.share({title:`Art Walk stop ${id}`,text:stop.address,url:url.href});
    else {await navigator.clipboard.writeText(url.href);toast('Link copied. Share it with your walking buddy.');}
  }catch(error){if(error.name!=='AbortError')toast('Copy the page address to share this stop.');}
}
document.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.dataset.save)toggle('saved',Number(b.dataset.save));
  else if(b.dataset.visit)toggle('visited',Number(b.dataset.visit));
  else if(b.dataset.open)openStop(Number(b.dataset.open));
  else if(b.dataset.map){const s=stops.find(s=>s.id===Number(b.dataset.map));savedMap=false;setView('map');requestAnimationFrame(()=>{if(map)map.setView([s.lat,s.lng],16,{animate:false});openStop(s.id);});}
  else if(b.dataset.view)setView(b.dataset.view);
  else if(b.dataset.filter){filter=b.dataset.filter;render();fitMap();}
  else if(b.dataset.close)$(`#${b.dataset.close}`).close();
  else if(b.hasAttribute('data-prev'))openStop(selected.id-1);
  else if(b.hasAttribute('data-next'))openStop(selected.id+1);
  else if(b.dataset.share)shareStop(Number(b.dataset.share));
  else if(b.id==='clear-filters'){$('#search').value='';$('#medium').value='all';filter='all';if(view==='saved'&&!progress.saved.size)setView('explore');else render();fitMap();}
});
$('#search').addEventListener('input',()=>{render();fitMap();});
$('#medium').addEventListener('change',()=>{render();fitMap();});
$('#fit-map').addEventListener('click',fitMap);
$('#map-saved').addEventListener('click',()=>{savedMap=!savedMap;render();fitMap();if(savedMap&&!progress.saved.size)toast('Save some stops with a heart to see them here.');});
$('#info-button').addEventListener('click',()=>{$('#maps-provider').value=progress.provider;$('#info').showModal();document.body.style.overflow='hidden';});
$('#maps-provider').addEventListener('change',()=>{progress.provider=$('#maps-provider').value;persist();render();});
$('#near-me').addEventListener('click',()=>{
  if(location){location=null;if(userMarker){userMarker.remove();userMarker=null;}$('#near-me').textContent='◎ Near me';$('#location-status').hidden=true;render();fitMap();return;}
  if(!navigator.geolocation){toast('This browser does not support location.');return;}
  $('#near-me').disabled=true;$('#location-status').hidden=false;$('#location-status').textContent='Finding your location…';
  navigator.geolocation.getCurrentPosition(position=>{
    location={lat:position.coords.latitude,lng:position.coords.longitude};
    $('#near-me').disabled=false;$('#near-me').textContent='× Clear location';
    const accuracy=Math.round(position.coords.accuracy);
    $('#location-status').textContent=`Closest stops first. Distances are straight-line estimates, not walking routes.${accuracy>100?' Your location is approximate.':''}`;
    if(map){userMarker=L.circleMarker([location.lat,location.lng],{radius:8,color:'#fff',weight:3,fillColor:'#2879b9',fillOpacity:1}).addTo(map).bindTooltip('You are here');}
    render();
  },error=>{$('#near-me').disabled=false;$('#location-status').textContent=error.code===1?'Location access was declined. You can still browse every stop.':'Could not find your location. Try again outside with a connection.';},{enableHighAccuracy:true,timeout:12000,maximumAge:60000});
});
function networkStatus(){if(!navigator.onLine){$('#offline-status').textContent='Offline · list & saved progress available';$('#map-warning').hidden=false;}else $('#map-warning').hidden=true;}
window.addEventListener('offline',networkStatus);
window.addEventListener('online',()=>{offlineReady();networkStatus();});
window.addEventListener('storage',e=>{if(e.key==='artwalk-2026'){progress=readProgress(storage);render();if($('#detail').open)renderDetail(false);}});
async function offlineReady(){
  if(!('serviceWorker' in navigator)){ $('#offline-status').textContent='Offline guide isn’t supported in this browser';return; }
  try{
    await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    $('#offline-status').textContent=navigator.onLine?'✓ Offline list & artist details ready':'Offline · list & artist details ready';
  }catch{$('#offline-status').textContent='Offline guide unavailable. Keep this page open.';}
}
async function start(){
  try{
    const response=await fetch('/stops.json');if(!response.ok)throw Error('Data unavailable');
    const data=await response.json();stops=data.stops;
    [...new Set(stops.flatMap(s=>s.artists.flatMap(a=>groups(a.medium))))].sort().forEach(m=>{$('#medium').add(new Option(m,m));});
    render();initMap();
    const id=Number(new URL(window.location).searchParams.get('stop'));if(id>=1&&id<=35)openStop(id);
    offlineReady();networkStatus();
  }catch{ $('#stop-list').innerHTML='<div class="empty-state"><h3>The guide couldn’t load.</h3><p>Reconnect and reload to download the stop list.</p><button onclick="window.location.reload()">Try again</button></div>';$('#result-count').textContent='';$('#offline-status').textContent='Connect to download the guide'; }
}
start();
