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
for(const name of ['leica.html','leica-bodies.html','leica-serial.html','leica-sources.html']){
  const html=await read(name);
  assert(html.includes('https://tojimasaya.com/'+name),'Canonical URL missing: '+name);
  assert(html.includes('js/site-header.js'),'Shared navigation missing: '+name);
  assert(html.includes('leica-archive.css'),'Shared archive layout missing: '+name);
  assert(sitemap.includes('https://tojimasaya.com/'+name),'Sitemap entry missing: '+name);
}
assert((await read('gear.html')).includes('href="leica.html" class="leica-db-link"'));
assert((await read('gear-camera.html')).includes('href="leica.html" class="leica-db-link"'));
const serial=await json('data/leica-serial.json');
assert.equal(serial.camera.length,1698);assert.equal(serial.lens.length,85);
console.log('PASS: 185 body entries, 152 models, original facts and photo bytes, 18 photo links, 1,698 camera / 85 lens records, archive entrances and canonical URLs preserved.');
