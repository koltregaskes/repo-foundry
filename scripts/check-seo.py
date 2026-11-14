"""Validate built SEO and crawlability, with no network or dependencies."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse, unquote
import json, os, re, struct, zlib
import xml.etree.ElementTree as ET
ROOT=Path(os.environ.get('SEO_ROOT',Path(__file__).resolve().parent.parent/'dist/public')).resolve()
BASE=json.loads((Path(__file__).resolve().parent.parent/'launch-config.json').read_text())['base']
FEED='feed.xml'
class Head(HTMLParser):
 def __init__(self):
  super().__init__();self.links={};self.meta={};self.schemas=[];self.schema=None
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='link':self.links.setdefault(a.get('rel'),[]).append(a.get('href'))
  if tag=='meta':self.meta.setdefault(a.get('property',a.get('name')),[]).append(a.get('content'))
  if tag=='script' and a.get('type')=='application/ld+json':self.schema=''
 def handle_data(self,data):
  if self.schema is not None:self.schema+=data
 def handle_endtag(self,tag):
  if tag=='script' and self.schema is not None:
   self.schemas.append(json.loads(self.schema));self.schema=None
 def one(self,collection,key):
  values=collection.get(key,[]);assert len(values)==1 and values[0],('missing/duplicate',key);return values[0]
def local(url):
 assert isinstance(url,str) and url.startswith(BASE),('outside approved site',url)
 parsed=urlparse(url);assert not parsed.query and not parsed.fragment,('noncanonical query/hash',url)
 target=(ROOT/unquote(url[len(BASE):])).resolve();assert target.is_relative_to(ROOT),url
 return target/'index.html' if target.is_dir() else target
checked_pngs=set()
def png(file):
 if file in checked_pngs:return
 data=file.read_bytes();assert data[:8]==b'\x89PNG\r\n\x1a\n','OG is not PNG'
 offset=8;chunks=[];image=b'';header=None
 while offset<len(data):
  assert offset+12<=len(data),'truncated PNG chunk'
  length=struct.unpack('>I',data[offset:offset+4])[0];kind=data[offset+4:offset+8];body=data[offset+8:offset+8+length]
  assert offset+12+length<=len(data),'truncated PNG data'
  crc=struct.unpack('>I',data[offset+8+length:offset+12+length])[0];assert zlib.crc32(kind+body)&0xffffffff==crc,'PNG CRC'
  chunks.append(kind)
  if kind==b'IHDR':
   assert header is None and len(body)==13;header=struct.unpack('>IIBBBBB',body)
  if kind==b'IDAT':image+=body
  offset+=12+length
  if kind==b'IEND':break
 assert chunks[0]==b'IHDR' and chunks[-1]==b'IEND' and offset==len(data),'incomplete PNG'
 width,height,depth,colour,compression,filtering,interlace=header
 assert 600<=width<=8192 and 315<=height<=8192 and compression==filtering==interlace==0
 channels={0:1,2:3,3:1,4:2,6:4};assert colour in channels and depth in [1,2,4,8,16]
 row=(width*channels[colour]*depth+7)//8;decoder=zlib.decompressobj();raw=decoder.decompress(image,(row+1)*height+1)
 assert decoder.eof and len(raw)==(row+1)*height,'PNG decode size'
 assert all(raw[n] in range(5) for n in range(0,len(raw),row+1)),'PNG filter'
 checked_pngs.add(file)
def schemas(blocks):
 assert blocks,'missing JSON-LD';seen=set()
 for block in blocks:
  assert isinstance(block,dict) and block.get('@context')=='https://schema.org','invalid schema context'
  nodes=block.get('@graph',[block]);assert isinstance(nodes,list) and nodes,'empty graph'
  for node in nodes:
   assert isinstance(node,dict) and node.get('@type'),'empty schema'
   key=node.get('@id') or json.dumps(node,sort_keys=True);assert key not in seen,'duplicate JSON-LD';seen.add(key)
urls=[n.text for n in ET.parse(ROOT/'sitemap.xml').findall('.//{*}loc')]
assert urls and len(urls)==len(set(urls)),'empty/duplicate sitemap'
files=[local(url) for url in urls];assert all(p.is_file() for p in files),'missing sitemap target'
for page in ROOT.rglob('*.html'):
 h=Head();h.feed(page.read_text(encoding='utf8'))
 if 'noindex' not in ','.join(h.meta.get('robots',[])):assert page in files,(page,'missing indexable route')
for url,page in zip(urls,files):
 h=Head();h.feed(page.read_text(encoding='utf8'));rel=page.relative_to(ROOT)
 expected=BASE+('' if str(rel)=='index.html' else rel.as_posix().removesuffix('index.html'))
 assert url==expected,(rel,'canonical route alias')
 assert 'noindex' not in h.one(h.meta,'robots').lower(),(rel,'noindex in sitemap')
 assert h.one(h.links,'canonical')==url,(rel,'canonical')
 for key in ['description','og:title','og:description','og:image:alt','twitter:card']:h.one(h.meta,key)
 assert h.one(h.meta,'og:url')==url,(rel,'og:url')
 png(local(h.one(h.meta,'og:image')))
 assert h.one(h.meta,'twitter:image')==h.one(h.meta,'og:image')
 schemas(h.schemas)
 assert h.one(h.links,'alternate')==BASE+FEED,(rel,'RSS discovery')
robots=(ROOT/'robots.txt').read_text();assert BASE+'sitemap.xml' in robots
assert not re.search(r'^\s*Disallow:\s*/\s*$',robots,re.M|re.I),'robots blocks site'
llms=(ROOT/'llms.txt').read_text();assert BASE in llms
for url in re.findall(r'\]\((https?://[^)]+)\)',llms):
 if url.startswith(BASE):assert local(url).is_file(),('llms missing target',url)
feed=ET.parse(ROOT/FEED);assert feed.getroot().tag=='rss'
assert feed.find('channel/link').text==BASE
for item in feed.findall('channel/item'):
 assert item.findtext('title') and item.findtext('guid') and item.findtext('pubDate'),'incomplete RSS item'
 url=item.findtext('link');parsed=urlparse(url or '');assert parsed.scheme=='https' and parsed.hostname and not parsed.username,'unsafe feed link'
 if url.startswith(BASE):assert local(url).is_file(),('RSS missing target',url)
# An honestly empty source feed is valid; fabricated seed items are not required.
print(f'SEO contract passed: {len(urls)} indexable routes, decoded PNG, unique schemas and crawlability')
