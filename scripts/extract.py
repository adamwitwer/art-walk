"""Extract artist-only PDF columns and join the organizer's ordered map pins.
Requires Poppler pdftotext; no Python dependencies. See docs/content.md.
"""
import json, re, subprocess, tempfile, xml.etree.ElementTree as ET
from pathlib import Path
import argparse
p=argparse.ArgumentParser()
p.add_argument('pdf',type=Path)
p.add_argument('kml',type=Path)
p.add_argument('--output',type=Path,default=Path('public/stops.json'))
a=p.parse_args()
columns=[(30,135,255,475),(295,475,250,135),(545,510,235,105),(780,45,255,565),(1035,45,250,565)]
text='\n'.join(subprocess.check_output(['pdftotext','-f','1','-l','1','-x',str(x),'-y',str(y),'-W',str(w),'-H',str(h),'-layout',str(a.pdf),'-'],text=True) for x,y,w,h in columns)
ns={'k':'http://www.opengis.net/kml/2.2'}
pins=ET.parse(a.kml).findall('.//k:Placemark',ns)
assert len(pins)==35
media=r'Fashion|Painting|Mixed Media|Watercolor|Fused Glass|Ceramics|Beaded Jewelry|Layered Paper|Porcelain Pottery|Button Jewelry|Contemporary Jewelry|Generative Art|Hardwood Birdhouses|Wire Sculpture|Assemblage|Jewelry|Restorative Media|Pastel|B&W Photography|Steel Sculpture|Woven Sculpture|Stained Glass|Photography|Colored Pencils|Pottery|Quilts|Sculpture'
pattern=re.compile(r'^(.+?) ((?:'+media+r').*?) / (.*)$')
stops=[]
for block in re.split(r'(?m)^\s*(?=\d{1,2} \d{3,4} )',text):
    lines=[s.strip() for s in block.splitlines() if s.strip()]
    if not lines or not re.match(r'^\d{1,2} \d{3,4} ',lines[0]): continue
    number,address=lines.pop(0).split(' ',1)
    number=int(number)
    title='Cityline Studios' if number==1 else None
    if title: assert lines.pop(0)==title
    artists=[]
    i=0
    while i<len(lines):
        line=lines[i]
        if line.endswith('/'):
            i+=1
            line+=' '+lines[i]
        m=pattern.match(line)
        if not m: raise ValueError(line)
        name,medium,contact=m.groups()
        link='https://www.instagram.com/'+contact[1:]+'/' if contact.startswith('@') else ('mailto:'+contact if '@' in contact else 'https://'+contact)
        artists.append(dict(name=name,medium=medium,contact=contact,url=link))
        i+=1
    pin=pins[number-1]
    assert address.split()[0]==pin.find('k:name',ns).text.split()[0]
    lng,lat,_=map(float,pin.find('k:Point/k:coordinates',ns).text.strip().split(','))
    display=address.title().replace(' Nw',' NW').replace('31St','31st').replace('32Nd','32nd').replace('33Rd','33rd')
    city='Chevy Chase, MD' if number<=10 else 'Washington, DC'
    stops.append(dict(id=number,address=display,city=city,title=title,accessible=number in [2,8,10,11,13,32],lat=lat,lng=lng,artists=artists))
stops.sort(key=lambda s:s['id'])
assert [s['id'] for s in stops]==list(range(1,36))
assert sum(len(s['artists']) for s in stops)==86
result=dict(event=dict(name='Ch/Art Art Walk',year=2026,dates=['2026-10-17','2026-10-18'],hours='Noon–5 pm both days',timezone='America/New_York',organizer='https://www.chevychaseart.org/art-walk-info'),source=dict(pamphlet=a.pdf.name,revision='2026-07-27',coordinates='https://www.google.com/maps/d/viewer?mid=1rI_Hlm5UGMQWi1DlbaBmodLwz2h4F5M'),stops=stops)
a.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(f'Extracted {len(stops)} stops / {sum(len(s["artists"]) for s in stops)} artists.')
