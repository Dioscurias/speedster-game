"""Convert an OpenStreetMap XML snapshot into the local, attributed game map."""
import sys,json,math,xml.etree.ElementTree as ET,datetime
source=sys.argv[1]
root=ET.parse(source).getroot()
if len(sys.argv)>2:
 extra=ET.parse(sys.argv[2]).getroot();seen={(e.tag,e.attrib.get('id')) for e in root}
 for e in extra:
  if (e.tag,e.attrib.get('id')) not in seen:root.append(e)
origin={'lat':30.26715,'lon':-97.74306}
sx=111320*math.cos(math.radians(origin['lat']));sz=111320
nodes={n.attrib['id']:(float(n.attrib['lon']),float(n.attrib['lat'])) for n in root.findall('node')}
def project(p):return [round((p[0]-origin['lon'])*sx,2),round(-(p[1]-origin['lat'])*sz,2)]
def tags(el):return {t.attrib['k']:t.attrib['v'] for t in el.findall('tag')}
def height(t):
 try:
  h=t.get('height','')
  if h:return max(3,min(350,float(h.replace('m','').replace('ft','').strip())*(.3048 if 'ft' in h else 1)))
  return max(3,min(250,float(t.get('building:levels',3))*3.4))
 except ValueError:return 12
roads=[];buildings=[];areas=[];features=[];ways={}
for way in root.findall('way'):
 t=tags(way);refs=[n.attrib['ref'] for n in way.findall('nd')];pts=[project(nodes[n]) for n in refs if n in nodes];ways[way.attrib['id']]=(pts,t)
 if len(pts)<2:continue
 if 'highway' in t and t['highway'] not in ['construction','proposed','steps','corridor','platform']:
  typ=t['highway'];width={'motorway':16,'trunk':15,'primary':15,'secondary':13,'tertiary':11,'residential':9,'living_street':7,'service':5,'footway':2.2,'pedestrian':5,'path':2,'cycleway':2.5}.get(typ,8)
  try:width=max(width,float(t.get('lanes',0))*3.3)
  except ValueError:pass
  roads.append({'id':way.attrib['id'],'name':t.get('name',''),'kind':typ,'width':width,'bridge':t.get('bridge')=='yes','surface':t.get('surface','asphalt' if width>5 else 'paved'),'oneway':t.get('oneway','no'),'lanes':t.get('lanes',''),'points':pts})
 if 'building' in t and refs[0]==refs[-1] and len(pts)>=4:
  buildings.append({'id':way.attrib['id'],'name':t.get('name',''),'height':round(height(t),2),'kind':t.get('building','yes'),'material':t.get('building:material',''),'colour':t.get('building:colour',''),'levels':t.get('building:levels',''),'heightSource':'mapped' if 'height'in t or 'building:levels'in t else 'estimated','polygon':pts[:-1]})
 if refs[0]==refs[-1] and len(pts)>=4 and (t.get('natural')=='water' or t.get('leisure') in ['park','garden'] or t.get('landuse') in ['grass','recreation_ground']):areas.append({'name':t.get('name',''),'kind':'water' if t.get('natural')=='water' else 'park','surface':t.get('surface','grass'),'polygon':pts[:-1]})
# Join outer ways for water and park multipolygons in this extract.
for rel in root.findall('relation'):
 t=tags(rel)
 if not(t.get('natural')=='water' or t.get('leisure')=='park'):continue
 lines=[ways[m.attrib['ref']][0][:] for m in rel.findall('member') if m.attrib.get('type')=='way' and m.attrib.get('role')=='outer' and m.attrib['ref'] in ways]
 while lines:
  poly=lines.pop(0);changed=True
  while changed and poly[0]!=poly[-1]:
   changed=False
   for i,line in enumerate(lines):
    if poly[-1]==line[0]:poly+=line[1:]
    elif poly[-1]==line[-1]:poly+=list(reversed(line[:-1]))
    else:continue
    lines.pop(i);changed=True;break
  if len(poly)>3 and poly[0]==poly[-1]:areas.append({'name':t.get('name',''),'kind':'water' if t.get('natural')=='water' else 'park','surface':t.get('surface','grass'),'polygon':poly[:-1]})
b=root.find('bounds').attrib
lo=project((float(b['minlon']),float(b['minlat'])));hi=project((float(b['maxlon']),float(b['maxlat'])))
# OSM includes whole ways crossing the requested bounds. Keep only nearby features.
def nearby(poly):return any(lo[0]-150<p[0]<hi[0]+150 and hi[1]-150<p[1]<lo[1]+150 for p in poly)
roads=[r for r in roads if nearby(r['points'])]
buildings=[b for b in buildings if nearby(b['polygon'])]
areas=[a for a in areas if nearby(a['polygon'])]
# Retain real street furniture and points of interest, previously discarded.
for node in root.findall('node'):
 t=tags(node);kind=None
 if t.get('natural')=='tree':kind='tree'
 elif t.get('highway') in ['crossing','traffic_signals','street_lamp','bus_stop']:kind=t['highway']
 elif t.get('amenity') in ['bench','waste_basket','bicycle_parking','fountain','drinking_water']:kind=t['amenity']
 elif t.get('name') and any(k in t for k in ['amenity','shop','tourism','historic']):kind='poi'
 if not kind:continue
 p=project(nodes[node.attrib['id']])
 if not(lo[0]<p[0]<hi[0] and hi[1]<p[1]<lo[1]):continue
 features.append({'id':node.attrib['id'],'kind':kind,'name':t.get('name',''),'category':t.get('amenity',t.get('tourism',t.get('shop',''))),'x':p[0],'z':p[1]})
data={'name':'Downtown Austin, Texas','origin':origin,'bounds':{'minX':lo[0]+10,'maxX':hi[0]-10,'minZ':hi[1]+10,'maxZ':lo[1]-10},'attribution':'© OpenStreetMap contributors','license':'ODbL 1.0','source':'https://www.openstreetmap.org/copyright','downloaded':'2026-09-22','roads':roads,'buildings':buildings,'areas':areas,'features':features}
json.dump(data,open('public/assets/austin/map.json','w'),separators=(',',':'))
print(f'{len(roads)} roads, {len(buildings)} buildings, {len(areas)} areas; bounds {data["bounds"]}')
print(f'{len(features)} mapped street features')
print('Road names:',sorted(set(r['name'] for r in roads if r['name']))[:30])
