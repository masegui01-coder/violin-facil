// Micrófono: se suelta al salir de la pantalla o al ocultar la app y se vuelve a abrir solo al siguiente uso.
// Dobles de getUserMedia, MediaStreamTrack y AudioContext (audio.js usa el navegador solo cuando se le llama).
import { test } from 'node:test';
import assert from 'node:assert/strict';

class FakeTrack {
  constructor() { this.readyState = 'live'; this.stops = 0; }
  stop() { this.readyState = 'ended'; this.stops += 1; }
}
class FakeStream {
  constructor() { this.tracks = [new FakeTrack()]; }
  getTracks() { return this.tracks; }
  getAudioTracks() { return this.tracks; }
}
class FakeNode {
  constructor() { this.connected = []; this.disconnected = false; }
  connect(n) { this.connected.push(n); return n; }
  disconnect() { this.disconnected = true; }
}
class FakeAnalyser extends FakeNode {
  constructor() { super(); this.fftSize = 2048; }
  get frequencyBinCount() { return this.fftSize / 2; }
  getFloatTimeDomainData(buf) { buf.fill(0); }
  getFloatFrequencyData(buf) { buf.fill(-100); }
}
const contexts = [];
class FakeAudioContext {
  constructor() { this.state = 'running'; this.sampleRate = 48000; this.currentTime = 0; this.nodes = []; this.closed = false; contexts.push(this); }
  resume() { this.state = 'running'; return Promise.resolve(); }
  suspend() { this.state = 'suspended'; return Promise.resolve(); }
  close() { this.closed = true; this.state = 'closed'; return Promise.resolve(); }
  createAnalyser() { const n = new FakeAnalyser(); this.nodes.push(n); return n; }
  createMediaStreamSource(stream) { const n = new FakeNode(); n.stream = stream; this.nodes.push(n); return n; }
}

// getUserMedia controlable: cada llamada devuelve un stream nuevo, o queda pendiente / se deniega si se pide
const gum = { calls: 0, streams: [], deny: false, hold: null };
function getUserMedia() {
  gum.calls += 1;
  if (gum.deny) return Promise.reject(Object.assign(new Error('denied'), { name: 'NotAllowedError' }));
  const stream = new FakeStream();
  gum.streams.push(stream);
  if (gum.hold) return new Promise(resolve => { gum.hold = () => resolve(stream); });
  return Promise.resolve(stream);
}

const listeners = {};
const fakeDocument = { visibilityState: 'visible', addEventListener: (type, fn) => { listeners[type] = fn; } };
globalThis.window = { AudioContext: FakeAudioContext };
globalThis.document = fakeDocument;
Object.defineProperty(globalThis.navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true });

const audio = await import('../js/audio.js');
const { tunerMode, isPermissionError, SIGNAL_HOLD_MS } = await import('../js/tuner-state.js');
const tick = () => new Promise(r => setTimeout(r, 0));
const lastStream = () => gum.streams[gum.streams.length - 1];

test('starting the mic opens one stream even if asked twice at once', async () => {
  const before = gum.calls;
  await Promise.all([audio.startMic(), audio.startMic()]);
  assert.equal(gum.calls - before, 1);
  assert.equal(audio.micStream(), lastStream());
  assert.equal(lastStream().tracks[0].readyState, 'live');
});

test('stopMic stops every track and disconnects the analysers', async () => {
  await audio.startMic();
  const stream = audio.micStream();
  const c = audio.ctx();
  audio.stopMic();
  assert.ok(stream.getTracks().every(t => t.readyState === 'ended'));
  assert.equal(audio.micStream(), null);
  assert.ok(c.nodes.every(n => n.disconnected), 'source and analysers disconnected');
});

test('stopMic keeps the AudioContext so reference notes still play', async () => {
  await audio.startMic();
  const c = audio.ctx();
  audio.stopMic();
  assert.equal(c.closed, false);
  assert.equal(audio.ctx(), c);
  assert.equal(contexts.length, 1);
});

test('after stopping, the mic still counts as ready and reopens on the next read', async () => {
  await audio.startMic();
  audio.stopMic();
  assert.equal(audio.micReady(), true, 'no gate: permission was already granted');
  const before = gum.calls;
  assert.equal(audio.readPitch(), null);
  await tick();
  assert.equal(gum.calls - before, 1);
  assert.equal(audio.micStream(), lastStream());
  assert.equal(audio.micStream().tracks[0].readyState, 'live');
  assert.ok(audio.readPitch(), 'reading works again');
});

test('resumeMic reopens only when the mic had been granted', async () => {
  audio.stopMic();
  const before = gum.calls;
  audio.resumeMic();
  await tick();
  assert.equal(gum.calls - before, 1);
  audio.resumeMic();
  await tick();
  assert.equal(gum.calls - before, 1, 'already open: nothing new');
});

test('a stream that arrives after leaving the screen is released at once', async () => {
  audio.stopMic();
  gum.hold = true;
  const opening = audio.startMic();
  audio.stopMic();
  gum.hold();
  gum.hold = null;
  await assert.rejects(opening, { name: 'AbortError' });
  assert.equal(lastStream().tracks[0].readyState, 'ended');
  assert.equal(audio.micStream(), null);
});

test('hiding the app releases the mic and suspends audio', async () => {
  await audio.startMic();
  const stream = audio.micStream();
  fakeDocument.visibilityState = 'hidden';
  listeners.visibilitychange();
  assert.equal(stream.tracks[0].readyState, 'ended');
  assert.equal(contexts[0].state, 'suspended');
  fakeDocument.visibilityState = 'visible';
  listeners.visibilitychange();
  assert.equal(audio.micStream(), null, 'reopens lazily, not on visibility');
});

test('a denied permission brings the gate back', async () => {
  audio.stopMic();
  gum.deny = true;
  await assert.rejects(audio.startMic(), { name: 'NotAllowedError' });
  assert.equal(audio.micReady(), false);
  assert.equal(audio.micDenied(), true);
  assert.equal(audio.readPitch(), null);
  await tick();
  gum.deny = false;
  await audio.startMic();
  assert.equal(audio.micDenied(), false, 'granting it later clears the denied state');
});

test('the tuner needle stays neutral without permission or signal', () => {
  assert.equal(tunerMode({ denied: true, ready: false, pitch: null }), 'denied');
  assert.equal(tunerMode({ denied: true, ready: true, pitch: { freq: 440, midi: 69 }, msSinceSignal: 0 }), 'denied');
  assert.equal(tunerMode({ ready: false, pitch: null }), 'idle', 'no mic yet');
  assert.equal(tunerMode({ ready: true, pitch: { freq: null, midi: null } }), 'idle', 'silence before any note');
  assert.equal(tunerMode({ ready: true, pitch: { freq: 440, midi: 69 }, msSinceSignal: 0 }), 'live');
  assert.equal(tunerMode({ ready: true, pitch: { freq: null }, msSinceSignal: SIGNAL_HOLD_MS - 1 }), 'hold', 'short gap keeps the reading');
  assert.equal(tunerMode({ ready: true, pitch: null, msSinceSignal: SIGNAL_HOLD_MS + 1 }), 'idle', 'long silence goes neutral');
  assert.equal(tunerMode(), 'idle');
});

test('only permission errors count as denied', () => {
  assert.equal(isPermissionError({ name: 'NotAllowedError' }), true);
  assert.equal(isPermissionError({ name: 'SecurityError' }), true);
  assert.equal(isPermissionError({ name: 'NotFoundError' }), false);
  assert.equal(isPermissionError({ name: 'AbortError' }), false);
  assert.equal(isPermissionError(null), false);
});

test('stopMic is safe to call when the mic was never open', () => {
  assert.doesNotThrow(() => { audio.stopMic(); audio.stopMic(); });
});
