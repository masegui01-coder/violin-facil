// «Tu nombre» en banda, grupo y escuela: el nombre de la cuenta sin escapar, escapado una sola vez al meterlo en HTML.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { nicknameOf, accountName } from '../js/account.js';
import { esc } from '../js/ui.js';

test('nicknameOf devuelve el texto tal cual (sin entidades), recortado y sin correo', () => {
  assert.equal(nicknameOf({ displayName: "D'Angelo <3" }), "D'Angelo <3");
  assert.equal(nicknameOf({ displayName: '', email: 'ana@x.es' }), '');
  assert.equal(nicknameOf(null), '');
  assert.equal(nicknameOf({ displayName: 'x'.repeat(40) }).length, 30);
  assert.equal(accountName(), ''); // sin sesión
});

test('escapado exactamente una vez en el value del campo', () => {
  assert.equal(esc(nicknameOf({ displayName: "D'Angelo" })), 'D&#39;Angelo');
  for (const f of ['band', 'groups', 'school']) {
    const src = readFileSync(new URL(`../js/screens/${f}.js`, import.meta.url), 'utf8');
    assert.match(src, /import \{[^}]*\baccountName\b[^}]*\} from '\.\.\/account\.js'/, f);
    assert.ok(!/const accountName =/.test(src), `${f}: sin copia local`);
    for (const m of src.matchAll(/[^\n]*accountName\(\)[^\n]*/g)) {
      assert.ok(!/esc\(esc\(/.test(m[0]), m[0]);
      if (m[0].includes('value="')) assert.match(m[0], /value="\$\{esc\(accountName\(\)\)\}"/, m[0]);
    }
  }
  assert.ok(!/accountName/.test(readFileSync(new URL('../js/screens/account.js', import.meta.url), 'utf8')));
});
