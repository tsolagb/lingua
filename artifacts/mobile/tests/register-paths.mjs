import { registerHooks } from 'node:module';
import { existsSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

// Resolve the Expo tsconfig alias and extensionless TS imports for Node-only tests.
const root = fileURLToPath(new URL('../', import.meta.url));
registerHooks({
  resolve(specifier, context, nextResolve) {
    let base;
    if (specifier.startsWith('@/')) base = path.join(root, specifier.slice(2));
    else if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
      base = fileURLToPath(new URL(specifier, context.parentURL));
    }
    if (base) {
      for (const candidate of [base, `${base}.ts`, `${base}.mjs`, path.join(base, 'index.ts')]) {
        if (existsSync(candidate) && statSync(candidate).isFile()) {
          return nextResolve(pathToFileURL(candidate).href, context);
        }
      }
    }
    return nextResolve(specifier, context);
  },
});
