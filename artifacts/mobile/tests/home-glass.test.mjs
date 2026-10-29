import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
import colors from '../constants/colors.ts';

const require = createRequire(import.meta.url);

// Execute the real TS/TSX against small native-module doubles. No device settings
// are changed by these tests; the native acceptance matrix is documented separately.
function load(relativePath, mocks) {
  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  });
  const module = { exports: {} };
  vm.runInNewContext(outputText, {
    module,
    exports: module.exports,
    require: name => name in mocks ? mocks[name] : require(name),
  });
  return module.exports;
}

function hookHarness(os = 'ios') {
  let state;
  let effect;
  let cleanup;
  let writes = 0;
  const requests = [];
  const listeners = new Map();
  const removed = [];
  const subscribe = (event, callback) => {
    listeners.set(event, callback);
    return { remove: () => { removed.push(event); listeners.delete(event); } };
  };
  const { useReduceTransparency } = load('../hooks/useReduceTransparency.ts', {
    react: {
      useState: initial => {
        if (state === undefined) state = initial;
        return [state, value => { state = value; writes++; }];
      },
      useEffect: callback => { effect = callback; },
    },
    'react-native': {
      Platform: { OS: os },
      AccessibilityInfo: {
        isReduceTransparencyEnabled: () => new Promise((resolve, reject) => requests.push({ resolve, reject })),
        addEventListener: subscribe,
      },
      AppState: { addEventListener: subscribe },
    },
  });
  useReduceTransparency();
  cleanup = effect();
  return {
    get state() { return state; },
    get writes() { return writes; },
    requests, listeners, removed,
    unmount: () => cleanup?.(),
  };
}

const flush = () => new Promise(resolve => setImmediate(resolve));

test('iOS starts opaque, loads the setting, and reacts to both live toggle directions', async () => {
  for (const enabled of [false, true]) {
    const h = hookHarness();
    assert.equal(h.state, true);
    h.requests[0].resolve(enabled);
    await flush();
    assert.equal(h.state, enabled);
    h.listeners.get('reduceTransparencyChanged')(true);
    assert.equal(h.state, true);
    h.listeners.get('reduceTransparencyChanged')(false);
    assert.equal(h.state, false);
    h.unmount();
    assert.deepEqual(h.removed.sort(), ['change', 'reduceTransparencyChanged']);
  }
});

test('a stale query cannot undo a newer preference event', async () => {
  const h = hookHarness();
  h.listeners.get('reduceTransparencyChanged')(true);
  h.requests[0].resolve(false);
  await flush();
  assert.equal(h.state, true);
  h.unmount();
});

test('returning from Settings rechecks the preference; older requests cannot win', async () => {
  const h = hookHarness();
  h.listeners.get('change')('background');
  assert.equal(h.requests.length, 1);
  h.listeners.get('change')('active');
  h.requests[1].resolve(false);
  await flush();
  h.requests[0].resolve(true);
  await flush();
  assert.equal(h.state, false);
  h.listeners.get('change')('active');
  h.requests[2].reject(new Error('native query unavailable'));
  await flush();
  assert.equal(h.state, true);
  h.unmount();
});

test('query failure stays opaque and can recover through a live event', async () => {
  const h = hookHarness();
  h.requests[0].reject(new Error('native query unavailable'));
  await flush();
  assert.equal(h.state, true);
  h.listeners.get('reduceTransparencyChanged')(false);
  assert.equal(h.state, false);
  h.unmount();
});

test('unmount removes subscriptions and ignores a pending query', async () => {
  const h = hookHarness();
  h.unmount();
  const writes = h.writes;
  h.requests[0].resolve(false);
  await flush();
  assert.equal(h.writes, writes);
  assert.equal(h.listeners.size, 0);
});

test('web and Android do not query or subscribe to an iOS-only setting', () => {
  for (const os of ['web', 'android']) {
    const h = hookHarness(os);
    assert.equal(h.state, false);
    assert.equal(h.requests.length, 0);
    assert.equal(h.listeners.size, 0);
    h.unmount();
  }
});

test('panels render opaque without BlurView when reduced, retaining normal platform behavior', () => {
  for (const scheme of ['light', 'dark']) {
    for (const os of ['ios', 'web', 'android']) {
      for (const reduced of os === 'ios' ? [false, true] : [false]) {
        const palette = colors[scheme];
        const react = { createElement: (type, props, ...children) => ({ type, props, children }) };
        const { GlassPanel } = load('../components/HomeGlass.tsx', {
          react: react,
          'react-native': {
            Platform: { OS: os }, View: 'View', Pressable: 'Pressable',
            StyleSheet: { create: styles => styles, absoluteFill: {} },
          },
          'expo-blur': { BlurView: 'BlurView' },
          'react-native-reanimated': {},
          'expo-haptics': { selectionAsync: async () => {} },
          '@/hooks/useColors': { useColors: () => ({ ...palette, colorScheme: scheme }) },
          '@/hooks/useReduceTransparency': { useReduceTransparency: () => reduced },
          '@/hooks/useReduceMotion': { useReduceMotion: () => false },
          '@/constants/motion': {
            MOTION: { pressInMs: 90 },
            MOTION_SPRING: { damping: 18, stiffness: 320 },
          },
        });
        const contentStyle = { padding: 12 };
        const tree = GlassPanel({ children: 'learner content', radius: 18, style: contentStyle });
        const panel = tree.children[0];
        const blur = panel.children[0];
        assert.equal(Boolean(blur), os === 'ios' && !reduced);
        assert.equal(panel.props.style[1].backgroundColor,
          reduced ? palette.glassOpaque : os === 'ios' ? palette.glassFill : palette.glassFallback);
        assert.equal(panel.props.style[1].borderRadius, 18);
        assert.equal(panel.children[1].props.style, contentStyle);
        assert.equal(panel.children[1].children[0], 'learner content');
        if (blur) assert.equal(blur.props.tint, scheme);
      }
    }
  }
});

function luminance(hex) {
  assert.match(hex, /^#[\da-f]{6}$/i, 'contrast calculations require opaque colors');
  const [r, g, b] = hex.slice(1).match(/../g).map(part => {
    const channel = parseInt(part, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

test('opaque panels meet WCAG AA for text and blue icons in both appearances', () => {
  for (const scheme of ['light', 'dark']) {
    const palette = colors[scheme];
    const background = luminance(palette.glassOpaque);
    for (const [token, minimum] of [
      ['foreground', 4.5], ['mutedForeground', 4.5], ['homeAccent', 4.5],
      // Blue is used for non-text icons; stat text uses foreground.
      ['homePrimary', 3],
    ]) {
      const foreground = luminance(palette[token]);
      const contrast = (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
      assert.ok(contrast >= minimum, `${scheme} ${token}: ${contrast.toFixed(2)} < ${minimum}`);
    }
  }
});
