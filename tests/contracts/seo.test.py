import importlib.util, unittest, tempfile, shutil, os
from pathlib import Path
SOURCE=Path(__file__).resolve().parents[2]
class SeoContract(unittest.TestCase):
 def mutate(self, change):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp)/'public'; shutil.copytree(SOURCE/'dist/public',root); change(root)
   os.environ['SEO_ROOT']=str(root)
   spec=importlib.util.spec_from_file_location('seo_under_test',SOURCE/'scripts/check-seo.py'); module=importlib.util.module_from_spec(spec)
   try: spec.loader.exec_module(module)
   finally: os.environ.pop('SEO_ROOT',None)
 def page(self, root, fn):
  p=root/'index.html';p.write_text(fn(p.read_text(encoding='utf8')),encoding='utf8')
 def test_valid_output(self): self.mutate(lambda r:None)
 def test_duplicate_canonical(self):
  with self.assertRaises(AssertionError): self.mutate(lambda r:self.page(r,lambda s:s.replace('</head>','<link rel="canonical" href="https://example.com/">\n</head>')))
 def test_empty_schema(self):
  import re
  with self.assertRaises(AssertionError): self.mutate(lambda r:self.page(r,lambda s:re.sub(r'<script type="application/ld\+json">.*?</script>','<script type="application/ld+json">{}</script>',s,flags=re.S)))
 def test_duplicate_schema(self):
  import re
  def duplicate(s):
   block=re.search(r'<script type="application/ld\+json">.*?</script>',s,re.S).group();return s.replace('</head>',block+'</head>')
  with self.assertRaises(AssertionError): self.mutate(lambda r:self.page(r,duplicate))
 def test_index_alias_cannot_replace_canonical_route(self):
  def alias(r):
   p=r/'sitemap.xml';p.write_text(p.read_text().replace('https://koltregaskes.github.io/repo-foundry/</loc>','https://koltregaskes.github.io/repo-foundry/index.html</loc>'))
   self.page(r,lambda s:s.replace('href="https://koltregaskes.github.io/repo-foundry/"','href="https://koltregaskes.github.io/repo-foundry/index.html"').replace('content="https://koltregaskes.github.io/repo-foundry/"','content="https://koltregaskes.github.io/repo-foundry/index.html"'))
  with self.assertRaises(AssertionError):self.mutate(alias)
 def test_corrupt_png(self):
  def corrupt(r):
   p=r/'assets/og-card.png';p.write_bytes(p.read_bytes()[:24])
  with self.assertRaises(AssertionError): self.mutate(corrupt)
 def test_blocked_robots(self):
  with self.assertRaises(AssertionError): self.mutate(lambda r:(r/'robots.txt').write_text('User-agent: *\nDisallow: /\nSitemap: https://koltregaskes.github.io/repo-foundry/sitemap.xml\n'))
 def test_missing_llms_target(self):
  with self.assertRaises(AssertionError): self.mutate(lambda r:(r/'llms.txt').write_text('[Gone](https://koltregaskes.github.io/repo-foundry/gone/)'))
if __name__=='__main__':unittest.main()
