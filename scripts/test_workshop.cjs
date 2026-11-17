const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root,'docs/atelier-v02.html'),'utf8');
const script = html.split('<script>')[1].split('</script>')[0];
function app(stored = null) {
  const elements = new Map(), saved = [];
  const el = selector => {
    if (!elements.has(selector)) elements.set(selector,{innerHTML:'',textContent:'',style:{}});
    return elements.get(selector);
  };
  const context = { document:{querySelector:el,addEventListener(){}},
    window:{addEventListener(){},scrollTo(){}}, location:{hash:''},
    localStorage:{getItem(){return stored},setItem(...args){saved.push(args)}},
    crypto:crypto.webcrypto, Blob, setTimeout(){} };
  vm.createContext(context);vm.runInContext(script,context);
  return {run: code => vm.runInContext(code,context), saved};
}
test('all options and views render, plans survive switching and round-trip validation', () => {
  const a=app();
  a.run(`for(const id of Object.keys(options)){choose(id);for(const [page] of pages){location.hash='#'+page;render();if(!$('#main').innerHTML)throw Error(page)}}`);
  a.run(`state.plans.bench.scope='saved scope';choose('bench');validateState(state);parseBackup(JSON.stringify(state));if(state.plans.bench.scope!=='saved scope')throw Error('lost plan')`);
  assert.ok(a.saved.length > 0);
});
test('backup rejects injected identifiers across every record collection', () => {
  const a=app();
  a.run(`choose('bench')`);
  const valid=JSON.parse(a.run('JSON.stringify(state)'));
  const records={tasks:valid.tasks[0],checks:valid.checks[0],hypotheses:valid.hypotheses[0],logs:{id:'safe',option:'bench',status:'Non exécuté',date:new Date().toISOString(),title:'test',env:'local',protocol:'none',result:'',evidence:'',limits:''}};
  for(const [key,record] of Object.entries(records)) {
    const state=structuredClone(valid);
    state[key]=[{...record,id:'"><img src=x onerror=alert(1)>'}];
    assert.throws(()=>a.run(`parseBackup(${JSON.stringify(JSON.stringify(state))})`),key);
  }
  a.run(`state.tasks[0].id='"><img src=x onerror=alert(1)>';location.hash='#spec';render();if($('#main').innerHTML.includes('<img src=x'))throw Error('active markup')`);
});
test('invalid records, forged completed evidence and oversized backups are rejected', () => {
  const a=app();a.run(`choose('bench')`);
  const valid=JSON.parse(a.run('JSON.stringify(state)'));
  for(const change of [s=>s.tasks[0].status='unknown',s=>s.tasks[0].status='Terminé',s=>s.checks[0].done=true,s=>s.hypotheses[0].status='Confirmé',s=>s.decisions[0].date='invalid',s=>s.tasks.push(s.tasks[0]),s=>s.selected='constructor',s=>s.tasks[0].file={}]) {
    const state=structuredClone(valid);change(state);
    assert.throws(()=>a.run(`parseBackup(${JSON.stringify(JSON.stringify(state))})`));
  }
  assert.throws(()=>a.run(`parseBackup(' '.repeat(MAX_BACKUP_BYTES+1))`));
});
test('corrupt stored state renders recovery mode and is not overwritten by edits', () => {
  const a=app('{"version":1,"selected":"constructor"}');
  assert.equal(a.run('recoveryRequired'),true);
  assert.equal(a.run('state.selected'),null);
  a.run('choose("bench")');
  assert.equal(a.saved.length,0);
});
test('standalone and deployed CSP authorize only the exact workshop inline script', () => {
  const hash='sha256-'+crypto.createHash('sha256').update(script).digest('base64');
  const config=JSON.parse(fs.readFileSync(path.join(root,'docs/vercel.json'),'utf8'));
  const csp=config.headers[0].headers.find(h=>h.key==='Content-Security-Policy').value;
  assert.ok(csp.includes(hash));
  assert.ok(html.includes(hash));
  assert.ok(!csp.split('script-src')[1].split(';')[0].includes('unsafe-inline'));
});
