import { test } from 'node:test';
import assert from 'node:assert/strict';
import { starsHtml, num, esc } from '../js/ui.js';

test('numbers coming from other users can never inject HTML', () => {
  assert.equal(num('<img src=x onerror=alert(1)>'), 0);
  assert.equal(num('12.6'), 13);
  assert.ok(!starsHtml('"><img src=x onerror=alert(1)>').includes('<img'));
  assert.equal((starsHtml(5).match(/class="on"/g) || []).length, 3);
  assert.equal(esc('"><b>'), '&quot;&gt;&lt;b&gt;');
});
