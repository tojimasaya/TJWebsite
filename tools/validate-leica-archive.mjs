// Run from the website root: node tools/validate-leica-archive.mjs
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const read = p => fs.readFile(p,'utf8');
const json = async p => JSON.parse(await read(p));
const sha = async p => crypto.createHash('sha256').update(await fs.readFile(p)).digest('hex');
const manifest = await json('docs/leica-archive-import.json');
const canonical = await json('data/leica-bodies/catalog.json');
const browser = JSON.parse((await read('js/leica-bodies-data.js')).replace(/^window\.LEICA_CATALOG = /,'').replace(/;\s*$/,''));
assert.equal(await sha('data/leica-bodies/catalog.json'),manifest.body_catalog_sha256,'Canonical body catalog changed');
assert.equal(await sha('data/leica-serial.json'),manifest.serial_data_sha256,'Serial source data changed');
assert.equal(canonical.models.length,185);
assert.equal(new Set(canonical.models.map(m=>m.id)).size,185);
assert.equal(canonical.models.filter(m=>m.entry_kind==='model').length,152);
for(const m of browser.models){
  for(const rendition of m.image.renditions){
    assert.equal(await sha(rendition.path),rendition.sha256,'Display image bytes changed: '+rendition.path);
    rendition.path=rendition.path.replace(/^assets\/leica-bodies\//,'assets/');
  }
}
for(const source of browser.sources){
  if(source.access?.fallback_path){
    await fs.access(source.access.fallback_path);
    source.access.fallback_path=source.access.fallback_path.replace(/^assets\/leica-bodies\//,'assets/');
  }
}
assert.deepEqual(browser,canonical,'Browser catalog must preserve facts, verification and original image provenance');
const refs = await json('data/leica-bodies/photo-links.json');
const browserRefs=JSON.parse((await read('js/leica-photo-links.js')).replace(/^window\.LEICA_PHOTO_LINKS = /,'').replace(/;\s*$/,''));
assert.deepEqual(refs,browserRefs);
assert.equal(Object.keys(refs.models).length,18);
assert.equal(refs.unconfirmed_model_ids.length,16);
const independentIds = new Set(canonical.models.filter(m=>m.entry_kind==='model').map(m=>m.id));
for(const ref of Object.values(await json('data/leica-body-links.json')))assert(independentIds.has(ref.id));
const sitemap=await read('sitemap.xml');
for(const name of ['archive.html','leica.html','leica-bodies.html','leica-serial.html','leica-sources.html']){
  const html=await read(name);
  assert(html.includes('https://tojimasaya.com/'+name),'Canonical URL missing: '+name);
  assert(html.includes('js/site-header.js'),'Shared navigation missing: '+name);
  assert(html.includes('G-806426BQX2'),'GA4 gtag missing: '+name);
  assert(html.includes('assets/js/ga4-tracking.js'),'GA4 detail tracking missing: '+name);
  assert(html.includes('application/ld+json'),'JSON-LD missing: '+name);
  assert(html.includes('<footer class="footer">'),'Unified site footer missing: '+name);
  assert(sitemap.includes('https://tojimasaya.com/'+name),'Sitemap entry missing: '+name);
  if(name!=='archive.html'){
    assert(html.includes('leica-archive.css'),'Shared archive layout missing: '+name);
    assert(html.includes('href="archive.html"'),'Archive hub backlink missing: '+name);
    assert(!/<p class="la-breadcrumb">[^<]*<a href="gear\.html">/.test(html),'Breadcrumb still subordinate to Gear: '+name);
  }
}
const siteHeader=await read('js/site-header.js');
assert(siteHeader.includes('href="/archive.html"'),'Archive nav entry missing in js/site-header.js');
assert(siteHeader.includes('isArchivePage'),'Archive active-state check missing in js/site-header.js');
assert((await read('index.html')).includes('href="archive.html"'),'Home Archive entrance missing in index.html');
const gearHtml=await read('gear.html');
assert(gearHtml.includes('href="archive.html"') && gearHtml.includes('href="leica.html"'),'Archive/Leica cross-link missing in gear.html');
const gearCameraHtml=await read('gear-camera.html');
assert(gearCameraHtml.includes('href="archive.html"') && gearCameraHtml.includes('href="leica.html"'),'Archive/Leica cross-link missing in gear-camera.html');
const serial=await json('data/leica-serial.json');
assert.equal(serial.camera.length,1698);assert.equal(serial.lens.length,85);
console.log('PASS: 185 body entries, 152 models, original facts and photo bytes, 18 photo links, 1,698 camera / 85 lens records, independent Archive entrances, GA4, JSON-LD and canonical URLs preserved.');
