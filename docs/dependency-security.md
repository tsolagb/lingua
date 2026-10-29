# Dependency security remediation

## Assigned advisory coverage

The workspace keeps Expo SDK 57 and React Native 0.86. The lockfile and workspace
configuration, rather than manual changes to installed packages, reproduce the fixes.

| Affected package | Resolution |
| --- | --- |
| `@xmldom/xmldom` | 0.8.15 and 0.9.12, preserving each consumer's compatible release line |
| `js-yaml` | 4.3.2 |
| `vite` | 7.3.7 |
| `fast-uri` | 3.1.9 |
| `source-map-js` | 1.2.2 |
| `brace-expansion` | 5.0.12 |
| `node-forge` | 1.4.0 with a checked-in PKCS#1 verification patch; see below |
| `http-cache-semantics` | 4.3.0 with a checked-in security-zeroed cache reuse guard |
| `markdown-it` | Removed from the resolved graph by upgrading Orval |
| `compression` | 1.8.2 |
| `uuid` | Vulnerable 3.x/7.x removed; the legacy ngrok consumer uses CommonJS-compatible 11.1.1 |
| `qs` | 6.16.1 |
| `fast-copy` | 4.2.0 (a mature fixed release, retaining the workspace's release-age policy) |
| `decode-uri-component` | 0.5.1, with a compatibility patch in its `query-string` consumer |
| `esbuild` | 0.28.2 |
| `braces` | Advisory withdrawn by its publisher; see below |
| `body-parser` | 2.4.0, pinned for Express 5 consumers |
| `multer` | 2.5.0 |
| `zod` | 4.6.7 across direct and transitive consumers; see below |

Direct parent updates include Expo CLI within SDK 57, Express within 5.x,
pino-pretty within 13.x, and Orval within 8.x. Narrow overrides cover dependencies
whose latest compatible parents still resolve an affected release. Undici 7.30.1
prevents the newer Orval dependency graph introducing additional advisories.

## Local patches and regression checks

Run `pnpm run test:dependency-security` from the workspace root. These tests load
the actual dependency instances through their consumers, rather than separate
test-only copies.

### Forge: GHSA-86w9-cpqp-85rv

There is no fixed published Forge release at the time of remediation. The pnpm
patch applies the nested DigestAlgorithm element-count check proposed in
[upstream PR 1152](https://github.com/digitalbazaar/forge/pull/1152).
Both the outer DigestInfo sequence and its nested algorithm sequence must have
exactly the expected children. The regression test verifies valid signatures
with and without the optional NULL, rejects extra nested elements, and retains
the existing outer element-count protection.

Version-only dependency audits still report `node-forge@1.4.0`: they do not inspect
the patched source. This finding is **locally mitigated, not scanner-cleared**.
Do not hide it in an audit ignore list. Replace the patch with an upstream fixed
release once available, retaining the regression tests.

### Cache semantics: GHSA-ch52-4w7c-c8xp

Although 4.3.0 lies outside the advisory's affected version range, a regression
test demonstrated that it still allowed a shared Set-Cookie response whose TTL
was deliberately zeroed to be reused by a client sending `max-stale`.
The local patch rejects reuse of non-storable or zero-TTL responses before the
stale reuse path. This is deliberately conservative: even ordinary `max-age=0`
responses require revalidation instead of accepting client-requested staleness.
Positive-TTL public caching continues to work.

See [upstream security discussion 65](https://github.com/kornelski/http-cache-semantics/issues/65).
Keep the regression test even when replacing this patch with a future upstream
fix; a version-range check alone was insufficient.

### Decoder compatibility

`decode-uri-component` 0.5.x is ESM, whereas `query-string` 7 uses CommonJS.
The consumer patch reads the default export when present and preserves the
callable CommonJS fallback for bundlers. Tests cover Unicode, malformed percent
escapes, and repeated malformed input.

### Withdrawn braces advisory: GHSA-vfj7-8cjw-p6xm

[The publisher withdrew this advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
because it is not a practically exploitable vulnerability. The GitHub advisory
API confirms the withdrawal and no patched release exists beyond 3.0.3.
No package replacement, unnecessary local rewrite, or audit suppression was
introduced for this withdrawn finding.

### Body parser and upload teardown

`body-parser` 2.4.0 fixes GHSA-27r3-jxmh-p828. Express 5.3.0 is still the
latest parent and allows 2.3.0, so a compatible 2.x override enforces the
security floor. `multer` 2.5.0 fixes GHSA-q7qp-rjg7-q26m.

Isolated child-process tests exercise the real API's Express and Multer
instances. They send invalid trailing bytes after a valid gzip frame (including
delayed delivery) and reject an upload while another asynchronous file filter
is pending. Both reject the bad request, survive late stream events, and accept
a subsequent valid request.

### Zod: GHSA-mrhx-c7xc-m3w5

The catalog and override use 4.6.7 (fixed starting in 4.6.6). The override is
necessary because even the latest Expo CLI still requests vulnerable Zod 3;
upgrading the parent alone does not resolve this finding. Application schemas
already use compatible APIs, including two-argument records. The unused
`zod-validation-error` dependency is upgraded to its Zod 4-compatible 5.x line
to avoid leaving an incompatible consumer installed.

Tests resolve Zod through the application libraries, mobile app, and Expo CLI.
Oversized arrays, sets, and maps with a maximum size fail before visiting
elements, producing one size issue rather than per-element failures. Normal
validation, error formatting, and Expo plugin schemas remain functional.
Unconstrained collections still need application-appropriate input limits;
the upstream security fix does not impose a universal collection size cap.

## Verification

- `pnpm install --frozen-lockfile` succeeds with all three local patches.
- `pnpm run typecheck` succeeds across the workspace.
- The API build succeeds and `/api/healthz` responds with HTTP 200.
- All nine dependency security regression tests pass, including the four
  advisories covered by the latest remediation.
- Expo production exports succeed for iOS, Android, and web.
- All three managed development workflows start. The mobile screenshot reached
  its authentication loading indicator without a JavaScript exception; neither
  the signed-out welcome screen nor the signed-in UI was visually verified
  during this remediation.
- The dependency audit now has one high finding: locally mitigated Forge,
  for which no upstream fixed version exists. Body parser, Multer, and Zod
  findings are cleared. No findings were suppressed.

The development environment logs a missing `libglib-2.0.so.0` for the optional
desktop React Native DevTools installer. Metro, the app preview, and production
exports continue to work; changing system libraries was outside this task.
