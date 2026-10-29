import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import test from "node:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

// Resolve the packages through their actual consumers, not a second test-only copy.
const mobile = createRequire(new URL("../../artifacts/mobile/package.json", import.meta.url));
const cli = createRequire(mobile.resolve("@expo/cli/package.json"));
const ngrok = createRequire(mobile.resolve("@expo/ngrok"));
const got = createRequire(ngrok.resolve("got"));
const cacheableRequest = createRequire(got.resolve("cacheable-request"));
const authSession = createRequire(mobile.resolve("expo-auth-session/package.json"));
const queryString = authSession("query-string");
const forge = cli("node-forge");

for (const scenario of ["compressed-body", "async-upload-filter"]) {
  test(`${scenario} cannot crash the API dependency consumer`, async () => {
    await promisify(execFile)(process.execPath, [
      fileURLToPath(new URL("./dependency-request-worker.mjs", import.meta.url)), scenario,
    ], { timeout: 10_000 });
  });
}

test("Zod rejects oversized constrained collections before validating their elements", () => {
  // Cover direct application consumers and the transitive Expo CLI consumer.
  const db = createRequire(new URL("../../lib/db/package.json", import.meta.url));
  const apiZod = createRequire(new URL("../../lib/api-zod/package.json", import.meta.url));
  for (const consumer of [mobile, db, apiZod, cli]) {
    const { z } = consumer("zod");
    let visits = 0;
    const element = z.unknown().transform(() => { visits++; return "ok"; });
    for (const [schema, input] of [
      [z.array(element).max(2), Array(10_000).fill(null)],
      [z.set(element).max(2), new Set(Array.from({ length: 10_000 }, (_, i) => i))],
      [z.map(z.number(), element).max(2), new Map(Array.from({ length: 10_000 }, (_, i) => [i, null]))],
    ]) {
      const result = schema.safeParse(input);
      assert.equal(result.success, false);
      assert.equal(result.error.issues.length, 1);
      assert.equal(result.error.issues[0].code, "too_big");
      assert.equal(visits, 0);
    }
    assert.deepEqual(z.array(z.string()).max(2).parse(["valid"]), ["valid"]);
  }
  const { fromError } = mobile("zod-validation-error");
  const invalid = mobile("zod").z.string().safeParse(42);
  assert.match(fromError(invalid.error).message, /string/);
});

test("Expo plugin schemas remain compatible with the Zod 4 override", () => {
  const { PluginSchema } = cli("./build/src/start/server/DevToolsPlugin.schema.js");
  const plugin = { packageName: "test-plugin", packageRoot: "/tmp/test-plugin" };
  assert.equal(PluginSchema.safeParse(plugin).success, true);
  assert.equal(PluginSchema.safeParse({ ...plugin, packageName: "" }).success, false);
});

test("patched Forge verifies valid signatures but rejects nested DigestAlgorithm garbage", () => {
  const certificates = createRequire(cli.resolve("@expo/code-signing-certificates/package.json"));
  assert.equal(certificates.resolve("node-forge"), cli.resolve("node-forge"));
  const { publicKey, privateKey } = forge.pki.rsa.generateKeyPair({ bits: 1024, e: 3 });
  const digest = () => forge.md.sha256.create().update("dependency security regression");
  const hash = digest().digest().getBytes();
  assert.equal(publicKey.verify(hash, privateKey.sign(digest())), true);

  const asn1 = forge.asn1;
  const node = (type, constructed, value) =>
    asn1.create(asn1.Class.UNIVERSAL, type, constructed, value);
  const oid = () => node(asn1.Type.OID, false, asn1.oidToDer(forge.oids.sha256).getBytes());
  const nullParameter = () => node(asn1.Type.NULL, false, "");
  const garbage = () => node(asn1.Type.OCTETSTRING, false, "unconsumed garbage");
  const signDigestInfo = (algorithmChildren, outerExtra = []) => {
    const info = node(asn1.Type.SEQUENCE, true, [
      node(asn1.Type.SEQUENCE, true, algorithmChildren),
      node(asn1.Type.OCTETSTRING, false, hash),
      ...outerExtra,
    ]);
    // NONE still applies PKCS#1 v1.5 padding, letting us supply the DigestInfo DER.
    return privateKey.sign(asn1.toDer(info).getBytes(), "NONE");
  };

  // The optional NULL remains valid; strictness must not break legitimate signatures.
  for (const children of [[oid()], [oid(), nullParameter()]]) {
    assert.equal(publicKey.verify(hash, signDigestInfo(children)), true);
  }
  for (const children of [
    [oid(), nullParameter(), garbage()],
    [oid(), garbage()],
    [oid(), nullParameter(), nullParameter()],
  ]) {
    assert.throws(
      () => publicKey.verify(hash, signDigestInfo(children)),
      /valid RSASSA-PKCS1-v1_5 DigestInfo/,
    );
  }
  assert.throws(
    () => publicKey.verify(hash, signDigestInfo([oid(), nullParameter()], [garbage()])),
    /valid RSASSA-PKCS1-v1_5 DigestInfo/,
  );
});

test("shared cache cannot expose security-zeroed Set-Cookie entries with max-stale", () => {
  const CachePolicy = cacheableRequest("http-cache-semantics");
  const request = { url: "https://example.test/account", method: "GET", headers: {} };
  const response = {
    status: 200,
    headers: {
      "set-cookie": "session=test-only",
      "last-modified": new Date(Date.now() - 60_000).toUTCString(),
    },
  };
  const policy = new CachePolicy(request, response, { shared: true });
  assert.equal(policy.maxAge(), 0);
  for (const directive of ["max-stale", "max-stale=999999999"]) {
    assert.equal(
      policy.satisfiesWithoutRevalidation({
        ...request,
        headers: { "cache-control": directive },
      }),
      false,
    );
    for (const restrictedHeaders of [
      { "cache-control": "private, max-age=600" },
      { "cache-control": "no-store, max-age=600" },
      { "cache-control": "no-cache, max-age=600" },
      { "cache-control": "public, max-age=600", vary: "*" },
      { "cache-control": "proxy-revalidate, max-age=600" },
      { "cache-control": "public, max-age=0, stale-while-revalidate=600" },
    ]) {
      const restricted = new CachePolicy(request, { status: 200, headers: restrictedHeaders });
      assert.equal(
        restricted.satisfiesWithoutRevalidation({
          ...request, headers: { "cache-control": directive },
        }),
        false,
        JSON.stringify(restrictedHeaders),
      );
    }
  }
  const publicPolicy = new CachePolicy(request, {
    status: 200, headers: { "cache-control": "public, max-age=600" },
  });
  assert.equal(publicPolicy.satisfiesWithoutRevalidation(request), true);
});

test("UUID consumers retain CommonJS v4 support and reject short v5 output buffers", () => {
  const configPlugins = createRequire(cli.resolve("@expo/config-plugins/package.json"));
  const xcode = createRequire(configPlugins.resolve("xcode"));
  for (const consumer of [ngrok, xcode]) {
    const uuid = consumer("uuid");
    assert.match(uuid.v4(), /^[0-9a-f-]{36}$/);
    assert.throws(
      () => uuid.v5("test", uuid.v5.DNS, new Uint8Array(8), 4),
      RangeError,
    );
  }
  const project = configPlugins("xcode").project("test.pbxproj");
  project.hash = { project: { objects: {} } };
  assert.match(project.generateUuid(), /^[0-9A-F]{24}$/);
});

test("query-string retains Unicode and malformed-percent handling with the patched decoder", () => {
  assert.deepEqual({ ...queryString.parse("name=%D5%A2%D5%A1%D6%80%D5%A5%D6%82&value=a%20b") }, {
    name: "բարեւ", value: "a b",
  });
  assert.equal(queryString.parse("value=%E0%A4%A").value, "%E0%A4%A");
  assert.equal(queryString.parse(`value=${"%".repeat(5000)}`).value, "%".repeat(5000));
});

test("the lockfile retains the Forge patch and excludes the assigned vulnerable versions", () => {
  const lock = readFileSync(new URL("../../pnpm-lock.yaml", import.meta.url), "utf8");
  assert.match(lock, /node-forge@1\.4\.0:[\s\S]*?path: patches\/node-forge@1\.4\.0\.patch/);
  for (const pkg of ["http-cache-semantics@4.3.0", "query-string@7.1.3"]) {
    assert.ok(lock.includes(`path: patches/${pkg}.patch`), `${pkg} patch missing`);
  }
  const oldVersions = {
    "@xmldom/xmldom": ["0.8.13", "0.9.10"],
    "js-yaml": ["4.3.0"], vite: ["7.3.6"], "fast-uri": ["3.1.4"],
    "source-map-js": ["1.2.1"], "brace-expansion": ["5.0.9"],
    "http-cache-semantics": ["4.2.0"], "markdown-it": ["14.3.0"],
    compression: ["1.8.1"], uuid: ["3.4.0", "7.0.3"],
    qs: ["6.15.3"], "fast-copy": ["4.0.4"],
    "decode-uri-component": ["0.2.2"], esbuild: ["0.27.3"],
    "body-parser": ["2.3.0"], multer: ["2.4.0"], zod: ["3.25.76"],
  };
  for (const [name, versions] of Object.entries(oldVersions)) {
    for (const version of versions) {
      assert.equal(lock.includes(`  ${name}@${version}:`), false, `${name}@${version}`);
      assert.equal(lock.includes(`  '${name}@${version}':`), false, `${name}@${version}`);
    }
  }
});
