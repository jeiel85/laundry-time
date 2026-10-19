import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS as settings, createState, formatTime, startTimer, pauseTimer, updateTimer, selectMode, restoreState, localDay } from '../src/timer.js';

test('deadline keeps accurate time after a background tab or device sleep', () => {
  const state = createState();
  startTimer(state, 1000);
  updateTimer(state, settings, 61100);
  assert.equal(state.remaining, 1440);
  pauseTimer(state, settings, 121100);
  assert.equal(state.remaining, 1380);
  startTimer(state, 500000);
  assert.equal(state.deadline, 1880000);
});

test('completion is counted once, then waits for the user to start their break', () => {
  const state = createState();
  startTimer(state, 0);
  assert.equal(updateTimer(state, settings, 1500001), 'focus');
  assert.equal(state.sessions, 1);
  assert.equal(state.focusSeconds, 1500);
  assert.equal(state.mode, 'short');
  assert.equal(state.remaining, 300);
  assert.equal(state.running, false);
  assert.equal(updateTimer(state, settings, 2000000), null);
  assert.equal(state.sessions, 1);
});

test('every fourth completed focus session selects the long break', () => {
  const state = createState();
  for (let i = 1; i <= 4; i++) {
    selectMode(state, 'focus', settings);
    startTimer(state, 0);
    updateTimer(state, settings, 1500000);
    assert.equal(state.mode, i === 4 ? 'long' : 'short');
  }
  assert.equal(state.sessions, 4);
  startTimer(state, 0);
  updateTimer(state, settings, 900000);
  assert.equal(state.mode, 'focus');
  assert.equal(state.sessions, 4);
});

test('zen mode never runs a countdown or adds completed sessions', () => {
  const state = createState();
  selectMode(state, 'zen', settings);
  startTimer(state, 1000);
  assert.equal(updateTimer(state, settings, 90000000), null);
  assert.equal(state.running, false);
  assert.equal(state.sessions, 0);
});

test('restore validates settings, keeps a running deadline, and resets old daily stats', () => {
  const restored = restoreState({ settings: { focus: -1, short: 2, long: 'oops' }, state: { mode: 'focus', remaining: 100, running: true, deadline: 101000, day: '2000-1-1', sessions: 8, focusSeconds: 12000 } }, 1000);
  assert.equal(restored.settings.focus, 25);
  assert.equal(restored.settings.short, 2);
  assert.equal(restored.settings.long, 15);
  assert.equal(restored.state.running, true);
  assert.equal(restored.state.sessions, 0);
  assert.equal(restored.state.day, localDay());
  updateTimer(restored.state, restored.settings, 101000);
  assert.equal(restored.state.sessions, 1);
});

test('restoring malformed or missing persisted data is safe', () => {
  for (const raw of [null, {}, 'bad', { state: { mode: '__proto__', remaining: -5 } }, { settings: { motion: 2 }, state: { sessions: Infinity } }]) {
    const restored = restoreState(raw);
    assert.equal(restored.state.mode, 'focus');
    assert.ok(restored.state.remaining >= 0);
    assert.equal(restored.settings.motion, true);
  }
});

test('formatting rounds remaining partial seconds upward and clamps negatives', () => {
  assert.equal(formatTime(1499.2), '25:00');
  assert.equal(formatTime(60), '01:00');
  assert.equal(formatTime(-5), '00:00');
});
