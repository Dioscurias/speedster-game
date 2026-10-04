"""Package Quaternius CC0 hero + selected compatible animations. No third-party deps.
Usage: python3 scripts/prepare-superhero.py /tmp/superhero-pack.zip /tmp/hero-animations.zip
"""
import copy,json,math,struct,sys,zipfile
from pathlib import Path
out=Path('public/assets/human')
hero=zipfile.ZipFile(sys.argv[1]);anims=zipfile.ZipFile(sys.argv[2])
name=next(n for n in hero.namelist() if n.endswith('Godot - UE/Superhero_Male_FullBody.gltf'))
j=json.loads(hero.read(name));data=bytearray(hero.read(name.rsplit('/',1)[0]+'/'+j['buffers'][0]['uri']))
b=anims.read(next(n for n in anims.namelist() if n.endswith('/UAL1_Standard.glb')));length=struct.unpack_from('<I',b,12)[0];a=json.loads(b[20:20+length]);ab=b[28+length:]
# Suit colors are supplied by the game. Keep original geometry, UVs, skin and rig.
j['materials']=[{'name':m['name'],'pbrMetallicRoughness':{'baseColorFactor':[1,1,1,1],'metallicFactor':.25,'roughnessFactor':.43}} for m in j['materials']]
for key in ['images','textures','samplers']:j.pop(key,None)
j['animations']=[]
nodes={n.get('name'):i for i,n in enumerate(j['nodes'])}
def mul(a,b):
 x,y,z,w=a;X,Y,Z,W=b
 return [w*X+x*W+y*Z-z*Y,w*Y-x*Z+y*W+z*X,w*Z+x*Y-y*X+z*W,w*W-x*X-y*Y-z*Z]
def inverse(q):return [-q[0],-q[1],-q[2],q[3]]
def read(accessor):
 ac=a['accessors'][accessor];v=a['bufferViews'][ac['bufferView']];dim={'SCALAR':1,'VEC3':3,'VEC4':4}[ac['type']];offset=v.get('byteOffset',0)+ac.get('byteOffset',0)
 return [list(struct.unpack_from('<'+'f'*dim,ab,offset+i*v.get('byteStride',dim*4))) for i in range(ac['count'])]
def append(values,kind):
 while len(data)%4:data.append(0)
 offset=len(data);flat=[n for row in values for n in row];data.extend(struct.pack('<'+'f'*len(flat),*flat));view=len(j['bufferViews']);j['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(data)-offset})
 ac={'bufferView':view,'componentType':5126,'count':len(values),'type':kind}
 if kind=='SCALAR':ac.update(min=[min(flat)],max=[max(flat)])
 index=len(j['accessors']);j['accessors'].append(ac);return index
for source_name,new_name in [('Idle_Loop','Idle'),('Walk_Loop','Walk'),('Sprint_Loop','Run')]:
 clip=next(c for c in a['animations'] if c['name']==source_name);dest={'name':new_name,'channels':[],'samplers':[]};times={}
 for c in clip['channels']:
  sn=a['nodes'][c['target']['node']];ni=nodes.get(sn['name']);path=c['target']['path']
  if ni is None or (path!='rotation' and not(path=='translation' and sn['name']=='pelvis')):continue
  sampler=clip['samplers'][c['sampler']];values=read(sampler['output']);tn=j['nodes'][ni]
  if path=='rotation':
   correction=mul(tn.get('rotation',[0,0,0,1]),inverse(sn.get('rotation',[0,0,0,1])));values=[mul(correction,q) for q in values]
  else:
   source=sn.get('translation',[0,0,0]);target=tn.get('translation',[0,0,0]);values=[[target[k]+(v[k]-source[k]) for k in range(3)] for v in values]
  ti=sampler['input']
  if ti not in times:times[ti]=append(read(ti),'SCALAR')
  dest['channels'].append({'sampler':len(dest['samplers']),'target':{'node':ni,'path':path}})
  dest['samplers'].append({'input':times[ti],'output':append(values,'VEC4' if path=='rotation' else 'VEC3'),'interpolation':'LINEAR'})
 j['animations'].append(dest)
j['buffers']=[{'byteLength':len(data)}]
raw=json.dumps(j,separators=(',',':')).encode();raw+=b' '*((-len(raw))%4);data+=b'\0'*((-len(data))%4)
out.mkdir(parents=True,exist_ok=True);(out/'Superhero.glb').write_bytes(struct.pack('<III',0x46546c67,2,28+len(raw)+len(data))+struct.pack('<II',len(raw),0x4e4f534a)+raw+struct.pack('<II',len(data),0x004e4942)+data)
(out/'QUATERNIUS-LICENSE.txt').write_bytes(hero.read(next(n for n in hero.namelist() if n.endswith('License_Standard.txt'))))
(out/'ANIMATION-LICENSE.txt').write_bytes(anims.read(next(n for n in anims.namelist() if n.endswith('License.txt'))))
print('Packaged original superhero + Idle/Walk/Run:',(out/'Superhero.glb').stat().st_size,'bytes')
