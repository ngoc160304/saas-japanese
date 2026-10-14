import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { Script } from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const code = ts.transpileModule(
  readFileSync(new URL('../components/common/stats/CountUp.tsx', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
).outputText;

function load(react, globals = {}) {
  const moduleRecord = { exports: {} };
  new Script(`(function(require,module,exports){${code}\n})`).runInNewContext(globals)(
    (name) => name === 'react' ? react : require(name), moduleRecord, moduleRecord.exports,
  );
  return moduleRecord.exports.CountUp;
}

// Deterministic browser scheduling around the real component; no animation dependency.
function harness({ reduced = false, observerAvailable = true } = {}) {
  const slots = [];
  const frames = new Map();
  let index = 0, now = 0, nextFrame = 0, observer, cleanup, previousDeps, effect;
  let listener;
  const media = {
    matches: reduced,
    addEventListener: (_name, callback) => { listener = callback; },
    removeEventListener: () => { listener = undefined; },
  };
  class Observer {
    constructor(callback) { observer = { callback, connected: false }; }
    observe() { observer.connected = true; }
    disconnect() { observer.connected = false; }
  }
  const component = load({
    useRef: (initial) => { const slot = index++; return slots[slot] ??= { current: initial }; },
    useState: (initial) => {
      const slot = index++;
      slots[slot] ??= initial;
      return [slots[slot], (value) => { slots[slot] = value; }];
    },
    useEffect: (callback, deps) => {
      if (!previousDeps || deps.some((value, i) => value !== previousDeps[i])) {
        cleanup?.(); effect = callback; previousDeps = deps;
      }
    },
  }, {
    window: { matchMedia: () => media, ...(observerAvailable ? { IntersectionObserver: Observer } : {}) },
    IntersectionObserver: Observer,
    performance: { now: () => now },
    requestAnimationFrame: (callback) => { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: (id) => frames.delete(id),
  });
  return {
    render(props) {
      index = 0;
      const tree = component(props);
      tree.props.ref.current = {};
      if (effect) { cleanup = effect(); effect = undefined; }
      return tree;
    },
    visible() { observer.callback([{ isIntersecting: true }]); },
    step(elapsed) {
      now = elapsed;
      const pending = [...frames.values()]; frames.clear();
      pending.forEach((callback) => callback(now));
    },
    reduceMotion() { media.matches = true; listener(); },
    unmount() { cleanup(); },
    get frames() { return frames.size; },
    get connected() { return observer?.connected; },
    get listening() { return Boolean(listener); },
  };
}

const visualText = (tree) => tree.props.children[2].props.children.join('');

test('waits for visibility, eases out, finishes exactly, and does not replay on rerender', () => {
  const h = harness();
  assert.equal(visualText(h.render({ value: 1000 })), '0');
  assert.equal(h.frames, 0);
  h.visible();
  assert.equal(h.connected, false);
  h.step(625);
  assert.equal(visualText(h.render({ value: 1000 })), '875');
  h.step(1250);
  assert.equal(visualText(h.render({ value: 1000 })), '1.000');
  assert.equal(h.frames, 0);
  h.render({ value: 1000 });
  assert.equal(h.frames, 0);
  h.render({ value: 2000 }); h.step(1266);
  assert.equal(visualText(h.render({ value: 2000 })), '2.000', 'new targets update without replaying');
  h.unmount();
});

test('zero, negative decimals, percentages and currency use explicit Intl formatting', () => {
  for (const props of [
    { value: 0 },
    { value: -12.75, formatOptions: { minimumFractionDigits: 2 }, prefix: '− ', suffix: ' điểm' },
    { value: 0.871, formatOptions: { style: 'percent', maximumFractionDigits: 1 } },
    { value: 1250000, formatOptions: { style: 'currency', currency: 'VND' } },
  ]) {
    const h = harness({ observerAvailable: false });
    h.render(props); h.step(1250);
    const tree = h.render(props);
    assert.equal(visualText(tree), tree.props.children[0].props.children);
    h.unmount();
  }
});

test('reduced motion skips interpolation, also when preference changes mid-animation', () => {
  const h = harness({ reduced: true });
  h.render({ value: 42 }); h.step(16);
  assert.equal(visualText(h.render({ value: 42 })), '42');
  assert.equal(h.connected, undefined);
  h.unmount();
  const active = harness();
  active.render({ value: 42 }); active.visible(); active.step(100);
  active.reduceMotion(); active.step(116);
  assert.equal(visualText(active.render({ value: 42 })), '42');
  assert.equal(active.frames, 0);
  active.unmount();
});

test('cleanup cancels frames, disconnects observers and removes preference listener', () => {
  const h = harness();
  h.render({ value: 100 }); h.visible(); h.step(100);
  assert.equal(h.frames, 1);
  h.unmount();
  assert.equal(h.frames, 0);
  assert.equal(h.connected, false);
  assert.equal(h.listening, false);
});

test('server markup exposes only the final value to screen readers and reserves its width', () => {
  const Component = load(React);
  const markup = renderToStaticMarkup(React.createElement(Component, { value: 1250 }));
  assert.match(markup, /class="sr-only">1\.250<\/span>/);
  assert.equal((markup.match(/aria-hidden="true"/g) ?? []).length, 2);
  assert.doesNotMatch(markup, /aria-live/);
  assert.match(markup, /tabular-nums/);
});
