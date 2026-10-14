export function matches(stop, query = '', medium = 'all') {
  const haystack = [stop.id, stop.address, stop.city, stop.title || '', ...stop.artists.flatMap(a => [a.name, a.medium])].join(' ').toLocaleLowerCase();
  const q = query.trim().toLocaleLowerCase();
  return (!q || haystack.includes(q) || /^#?\d+$/.test(q) && Number(q.replace('#', '')) === stop.id)
    && (medium === 'all' || stop.artists.some(a => groups(a.medium).includes(medium)));
}
export function groups(medium) {
  const m = medium.toLowerCase();
  const result = [];
  if (/painting|watercolor|pastel|graphite|pencils|drawing|print/.test(m)) result.push('Painting & drawing');
  if (/jewelry/.test(m)) result.push('Jewelry');
  if (/ceramics|pottery/.test(m)) result.push('Ceramics');
  if (/sculpture|assemblage|birdhouse/.test(m)) result.push('Sculpture');
  if (/photo/.test(m)) result.push('Photography');
  if (/mixed|collage|paper|encaustic|restorative/.test(m)) result.push('Mixed media');
  if (/glass/.test(m)) result.push('Glass');
  if (/quilts|fashion|woven/.test(m)) result.push('Fiber & fashion');
  if (/digital|generative/.test(m)) result.push('Digital art');
  return result;
}
export function directions(stop, provider = 'apple') {
  const address = `${stop.address}, ${stop.city}, USA`;
  if (provider === 'google') return `https://www.google.com/maps/dir/?${new URLSearchParams({api:'1',destination:address,travelmode:'walking'})}`;
  return `https://maps.apple.com/directions?${new URLSearchParams({destination:address,mode:'walking'})}`;
}
export function distanceMeters(a, b) {
  const r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
export function readProgress(storage) {
  try {
    const data = JSON.parse(storage.getItem('artwalk-2026') || '{}');
    const clean = values => new Set(Array.isArray(values) ? values.filter(v => Number.isInteger(v) && v >= 1 && v <= 35) : []);
    return {saved:clean(data.saved), visited:clean(data.visited), provider:data.provider === 'google' ? 'google' : 'apple'};
  } catch { return {saved:new Set(), visited:new Set(), provider:'apple'}; }
}
