import { test } from 'node:test';
import assert from 'node:assert/strict';
import { userMetrics, groupMetrics, weekStart, isAdminEmail, isProTesterEmail, accountEmails } from '../js/metrics.js';

const now = new Date(2026, 9, 26, 12).getTime();
const day = 864e5;
const testers = [
  { lastSeen: now - 1000, createdAt: now - 1000, minutes: 30, lessons: 5, daysPracticed: 3, instrument: 'guitar', platform: 'Android · Chrome', band: 'Banda (músico)' },
  { lastSeen: now - 3 * day, createdAt: now - 20 * day, minutes: 10, lessons: 2, daysPracticed: 1, instrument: 'guitar', platform: 'iOS · Safari' },
  { lastSeen: now - 40 * day, createdAt: now - 50 * day, minutes: 0, lessons: 0, daysPracticed: 0, instrument: 'violin', platform: 'Android · Chrome' },
];

test('cuenta usuarios activos, minutos y retención', () => {
  const m = userMetrics(testers, now);
  assert.equal(m.total, 3);
  assert.equal(m.active1, 1);
  assert.equal(m.active7, 2);
  assert.equal(m.active30, 2);
  assert.equal(m.minutes, 40);
  assert.equal(m.lessons, 7);
  assert.equal(m.inBand, 1);
  assert.deepEqual(m.retention.map(r => r.value), [67, 33, 0]);
  assert.equal(m.instruments[0].label, 'guitar');
  assert.equal(m.instruments[0].value, 2);
});

test('altas por semana: la última columna es esta semana', () => {
  const m = userMetrics(testers, now);
  assert.equal(m.signups.length, 8);
  assert.equal(m.newThisWeek, 1);
  assert.equal(new Date(weekStart(now)).getDay(), 1);
});

test('grupos: canciones, pistas y espacio', () => {
  const g = groupMetrics([{ members: 3, songs: [{ parts: { demo: { bytes: 600000 }, a: { bytes: 400000 } } }] }, { members: 2, songs: [] }]);
  assert.deepEqual(g, { groups: 2, members: 5, songs: 1, tracks: 2, megabytes: 1 });
});

test('administrador por correo', () => {
  assert.equal(isAdminEmail('Masegui01@gmail.com'), true);
  assert.equal(isAdminEmail('otro@gmail.com'), false);
  assert.equal(isAdminEmail(''), false);
});

test('tester pro por correo, que no es administrador', () => {
  assert.equal(isProTesterEmail('Fran-Saxo@hotmail.com'), true);
  assert.equal(isAdminEmail('fran-saxo@hotmail.com'), false);
  assert.equal(isProTesterEmail('otro@hotmail.com'), false);
});

test('accountEmails reúne el correo principal y los de cada proveedor, sin repetir y en minúsculas', () => {
  const acc = { email: null, providerData: [{ email: 'Fran-Saxo@Hotmail.com ' }, { email: 'fran-saxo@hotmail.com' }, null] };
  assert.deepEqual(accountEmails(acc), ['fran-saxo@hotmail.com']);
  assert.ok(accountEmails(acc).some(isProTesterEmail));
  assert.deepEqual(accountEmails(null), []);
});
