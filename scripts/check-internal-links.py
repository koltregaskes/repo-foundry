"""Check built links, fragments, downloads and deep Pages fallback resolution."""
from pathlib import Path
from urllib.parse import urljoin,urlsplit,unquote
from html.parser import HTMLParser
import json,re,sys
ROOT=Path(sys.argv[1] if len(sys.argv)>1 else 'dist/public').resolve()
BASE=json.loads(Path('launch-config.json').read_text())['base']
class Page(HTMLParser):
 def __init__(self,html):
  super().__init__();self.base=None;self.links=[];self.ids=set();self.refresh=None;self.feed(html)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='base':self.base=a.get('href')
  else:
   self.links.extend(a[k] for k in ['href','src'] if a.get(k))
   if 'srcset' in a:self.links.extend(v.strip().split()[0] for v in a['srcset'].split(','))
  if a.get('id'):self.ids.add(a['id'])
  if tag=='meta' and a.get('http-equiv','').lower()=='refresh':
   m=re.search(r'url=(.*)',a.get('content',''),re.I);self.refresh=m.group(1).strip() if m else None
cache={}
def read(file):
 if file not in cache:cache[file]=Page(file.read_text(encoding='utf8'))
 return cache[file]
def target(url):
 parsed=urlsplit(url);approved=urlsplit(BASE)
 assert parsed.netloc==approved.netloc and parsed.path.startswith(approved.path),('outside project redirect',url)
 file=(ROOT/unquote(parsed.path[len(approved.path):])).resolve();assert file.is_relative_to(ROOT),url
 return file/'index.html' if file.is_dir() else file
count=0
for file in ROOT.rglob('*.html'):
 html=read(file);relative=file.relative_to(ROOT).as_posix();urls=[urljoin(BASE,relative)]
 if relative=='404.html':urls+= [urljoin(BASE,'missing/deep/route/')]
 for document in urls:
  base=urljoin(document,html.base or '')
  for link in html.links+([html.refresh] if html.refresh else []):
   url=urljoin(base,link);parsed=urlsplit(url)
   assert parsed.scheme in ['http','https','mailto','tel'],('unsafe URL scheme',relative)
   assert parsed.scheme!='http',('insecure published link',relative)
   assert not parsed.username and not parsed.password,('credential URL',relative)
   if parsed.netloc!=urlsplit(BASE).netloc:continue
   dest=target(url);assert dest.is_file(),(relative,'missing internal target',parsed.path)
   if parsed.fragment and dest.suffix=='.html':assert unquote(parsed.fragment) in read(dest).ids,(relative,'missing fragment',parsed.fragment)
   count+=1
  if html.refresh:
   seen={document};current=urljoin(base,html.refresh)
   while True:
    assert current not in seen,('redirect loop',relative);seen.add(current);assert len(seen)<9,'redirect chain too long'
    page=read(target(current))
    if not page.refresh:break
    current=urljoin(urljoin(current,page.base or ''),page.refresh)
print(f'Built link contract passed: {len(cache)} pages, {count} internal references, deep 404 fallback and redirects')
