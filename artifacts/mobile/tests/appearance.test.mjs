import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import vm from 'node:vm';
import React from 'react';
import { act, create } from 'react-test-renderer';
import ts from 'typescript';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const THEME_KEY = '@linguamatch_theme_preference';

// Execute the production TSX modules with real React hooks. Only device and
// storage boundaries are replaced; no theme resolution logic is copied here.
function loadModule(relativePath, mocks = {}) {
  const filename = fileURLToPath(new URL(relativePath, import.meta.url));
  const require = createRequire(filename);
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
    },
    fileName: filename,
  });
  const module = { exports: {} };
  const execute = vm.runInThisContext(
    `(function(require, module, exports) { ${outputText}\n})`,
    { filename },
  );
  execute(
    (id) => Object.hasOwn(mocks, id) ? mocks[id] : require(id),
    module,
    module.exports,
  );
  return module.exports;
}

const colors = loadModule('../constants/colors.ts').default;

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function createHarness(t, {
  saved = null, system = 'light', platform = 'web',
  nativeOverrideAvailable = true, read, write,
} = {}) {
  // This Map is private to this test; real AsyncStorage and learner data are
  // never loaded. Unrelated keys must survive every preference change.
  const learnerData = ['learner-progress-fixture', '{"stars":17,"language":"french"}'];
  const storage = new Map([learnerData]);
  if (saved !== null) storage.set(THEME_KEY, saved);
  const reads = [];
  const writes = [];
  const overrides = [];
  let deviceScheme = system;
  const theme = loadModule('../context/ThemeContext.tsx', {
    'react-native': {
      Platform: { OS: platform },
      Appearance: nativeOverrideAvailable
        ? { setColorScheme: (value) => overrides.push(value) }
        : {},
      useColorScheme: () => deviceScheme,
    },
    '@react-native-async-storage/async-storage': {
      getItem: async (key) => {
        reads.push(key);
        return read ? read(key) : storage.get(key) ?? null;
      },
      setItem: async (key, value) => {
        writes.push([key, value]);
        if (write) await write(key, value);
        storage.set(key, value);
      },
    },
  });
  const { useColors } = loadModule('../hooks/useColors.ts', {
    '@/constants/colors': { default: colors, __esModule: true },
    '@/context/ThemeContext': theme,
  });
  let renderer;
  let current;
  let palette;
  function Probe() {
    current = theme.useThemeSettings();
    palette = useColors();
    return null;
  }
  const tree = () => React.createElement(theme.ThemeProvider, null, React.createElement(Probe));
  const unmount = async () => {
    if (renderer) {
      await act(async () => renderer.unmount());
      renderer = undefined;
    }
  };
  t.after(async () => {
    await unmount();
    assert.equal(storage.get(learnerData[0]), learnerData[1]);
    assert.ok(reads.every(key => key === THEME_KEY));
    assert.ok(writes.every(([key]) => key === THEME_KEY));
    assert.equal(storage.size, saved === null && writes.length === 0 ? 1 : 2);
  });
  return {
    storage, writes, overrides,
    get current() { return current; },
    async mount() { await act(async () => { renderer = create(tree()); }); },
    unmount,
    async select(value) { await act(async () => current.setPreference(value)); },
    async setSystem(value) {
      deviceScheme = value;
      await act(async () => renderer.update(tree()));
    },
    assertTheme(preference, scheme) {
      assert.equal(current.preference, preference);
      assert.equal(current.colorScheme, scheme);
      assert.equal(current.isLoaded, true);
      assert.deepEqual(palette, { ...colors[scheme], radius: colors.radius, colorScheme: scheme });
    },
  };
}

for (const preference of ['light', 'dark']) {
  test(`explicit ${preference} overrides the device and survives a restart`, async (t) => {
    const opposite = preference === 'light' ? 'dark' : 'light';
    const h = createHarness(t, { system: opposite });
    await h.mount();
    await h.select(preference);
    h.assertTheme(preference, preference);
    assert.deepEqual(h.writes, [[THEME_KEY, preference]]);
    assert.equal(h.storage.get(THEME_KEY), preference);
    await h.setSystem(preference);
    await h.setSystem(opposite);
    h.assertTheme(preference, preference);
    await h.unmount();
    await h.mount();
    h.assertTheme(preference, preference);
    assert.equal(h.writes.length, 1, 'restoration must not write a default preference');
    assert.deepEqual(h.overrides, [], 'web must not call the native appearance override');
  });
}

test('system follows device changes, falls back to light for null, and survives a restart', async (t) => {
  const h = createHarness(t, { system: 'dark' });
  await h.mount();
  await h.select('dark');
  await h.select('system');
  h.assertTheme('system', 'dark');
  await h.setSystem('light');
  h.assertTheme('system', 'light');
  await h.setSystem(null);
  h.assertTheme('system', 'light');
  await h.setSystem('dark');
  h.assertTheme('system', 'dark');
  assert.equal(h.storage.get(THEME_KEY), 'system');
  await h.unmount();
  await h.mount();
  h.assertTheme('system', 'dark');
  assert.deepEqual(h.writes, [[THEME_KEY, 'dark'], [THEME_KEY, 'system']]);
});

for (const saved of ['light', 'dark', 'system']) {
  test(`restores saved ${saved} after asynchronous storage hydration`, async (t) => {
    const pending = deferred();
    const h = createHarness(t, { saved, system: 'dark', read: () => pending.promise });
    await h.mount();
    assert.equal(h.current.isLoaded, false);
    assert.deepEqual(h.writes, []);
    await act(async () => pending.resolve(saved));
    h.assertTheme(saved, saved === 'system' ? 'dark' : saved);
    assert.deepEqual(h.writes, []);
  });
}

for (const saved of [null, 'invalid', '"dark"']) {
  test(`missing or invalid saved preference (${saved}) keeps the light default`, async (t) => {
    const h = createHarness(t, { saved, system: 'dark' });
    await h.mount();
    h.assertTheme('light', 'light');
    assert.deepEqual(h.writes, [], 'loading must not overwrite stored data');
  });
}

test('a failed storage read finishes loading without rewriting data', async (t) => {
  const h = createHarness(t, { read: async () => { throw new Error('read failed'); } });
  await h.mount();
  h.assertTheme('light', 'light');
  assert.deepEqual(h.writes, []);
});

test('selection only changes after saving succeeds', async (t) => {
  const pending = deferred();
  const h = createHarness(t, { write: () => pending.promise });
  await h.mount();
  let selection;
  await act(async () => { selection = h.current.setPreference('dark'); });
  h.assertTheme('light', 'light');
  assert.equal(h.storage.has(THEME_KEY), false);
  await act(async () => { pending.resolve(); await selection; });
  h.assertTheme('dark', 'dark');
  assert.equal(h.storage.get(THEME_KEY), 'dark');
});

test('a failed save rejects and preserves the previous preference', async (t) => {
  const h = createHarness(t, {
    saved: 'dark',
    write: async () => { throw new Error('write failed'); },
  });
  await h.mount();
  await assert.rejects(h.select('light'), /write failed/);
  h.assertTheme('dark', 'dark');
  assert.equal(h.storage.get(THEME_KEY), 'dark');
});

for (const platform of ['ios', 'android']) {
  test(`${platform} applies explicit choices and clears the override for system`, async (t) => {
    const h = createHarness(t, { platform, saved: 'dark' });
    await h.mount();
    h.assertTheme('dark', 'dark');
    assert.equal(h.overrides.at(-1), 'dark');
    await h.select('light');
    assert.equal(h.overrides.at(-1), 'light');
    await h.select('dark');
    assert.equal(h.overrides.at(-1), 'dark');
    await h.select('system');
    assert.equal(h.overrides.at(-1), 'unspecified');
    await h.setSystem('dark');
    h.assertTheme('system', 'dark');
  });
}

test('native runtimes without setColorScheme still resolve explicit dark', async (t) => {
  const h = createHarness(t, {
    platform: 'ios', nativeOverrideAvailable: false, saved: 'dark', system: 'light',
  });
  await h.mount();
  h.assertTheme('dark', 'dark');
  await h.select('system');
  h.assertTheme('system', 'light');
});
