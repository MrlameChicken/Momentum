import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = file => readFileSync(new URL('../'+file,import.meta.url),'utf8');
const html=read('index.html'), css=read('styles.css'), js=read('app.js'), sql=read('supabase-setup.sql');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
assert.equal(new Set(ids).size,ids.length,'DOM IDs must be unique');
for(const [,id] of js.matchAll(/\$\("([^"]+)"\)/g)){
  assert.ok(ids.includes(id),'Missing DOM element: '+id);
}
assert.match(html,/<script defer src="\.\/app\.js\?v=2"><\/script>/);
assert.match(html,/<link rel="stylesheet" href="\.\/styles\.css\?v=2">/);
assert.match(html,/<input id="password"[^>]*type="password"/);
assert.match(js,/signInWithPassword/);
assert.match(js,/persistSession:true/);
assert.doesNotMatch(js,/signInWithOtp|signUp\(/,'No email sign-in or open sign-up');
assert.doesNotMatch(js,/\.innerHTML\s*=/,'Do not render user input as HTML');
assert.doesNotMatch(js,/service_role|sb_secret_/,'No secret server keys in client code');
assert.match(sql,/enable row level security/i);
assert.match(sql,/auth\.uid\(\)/);
assert.match(css,/@media\(max-width:600px\)/);
console.log('Momentum static checks passed');
