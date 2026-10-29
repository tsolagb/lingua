// Isolate regressions that used to cause uncaught stream errors/process exits.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { request } from "node:http";
import { gzipSync } from "node:zlib";
import { setTimeout as delay } from "node:timers/promises";

const api = createRequire(new URL("../../artifacts/api-server/package.json", import.meta.url));
const express = api("express");
const multer = api("multer");
const app = express();
app.use(express.json());
let resumedFilter = false;
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter(_req, file, done) {
    if (file.originalname === "pending.txt") {
      setTimeout(() => {
        resumedFilter = true;
        done(null, true);
      }, 50);
    } else if (file.originalname === "reject.txt") {
      done(new Error("Rejected file"));
    } else {
      done(null, true);
    }
  },
});
app.post("/json", (req, res) => res.json(req.body));
app.post("/upload", upload.any(), (req, res) => res.json({ files: req.files.length }));
app.get("/health", (_req, res) => res.send("ok"));
app.use((err, _req, res, _next) => res.status(400).json({ error: err.message }));
const server = app.listen(0, "127.0.0.1");
await new Promise(resolve => server.once("listening", resolve));
const port = server.address().port;

function send(path, body, headers = {}, splitAt) {
  return new Promise((resolve, reject) => {
    const req = request({
      host: "127.0.0.1", port, path, method: body ? "POST" : "GET", headers,
    }, res => {
      let text = "";
      res.on("data", chunk => { text += chunk; });
      res.on("end", () => resolve({ status: res.statusCode, text }));
    });
    req.on("error", reject);
    if (splitAt) {
      req.write(body.subarray(0, splitAt));
      setTimeout(() => req.end(body.subarray(splitAt)), 20);
    } else {
      req.end(body);
    }
  });
}

try {
  if (process.argv[2] === "compressed-body") {
    const frame = gzipSync('{"valid":true}');
    const body = Buffer.concat([frame, Buffer.from("invalid trailing gzip bytes")]);
    const headers = { "content-type": "application/json", "content-encoding": "gzip" };
    for (const split of [undefined, frame.length]) {
      const bad = await send("/json", body, headers, split);
      assert.equal(bad.status, 400);
      await delay(50); // Allow any late decompressor error to surface.
    }
    const good = await send("/json", frame, headers);
    assert.equal(good.status, 200);
    assert.deepEqual(JSON.parse(good.text), { valid: true });
  } else if (process.argv[2] === "async-upload-filter") {
    const boundary = "security-regression-boundary";
    const multipart = names => Buffer.from(names.map(name =>
      `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${name}"\r\n` +
      "Content-Type: text/plain\r\n\r\nhello\r\n",
    ).join("") + `--${boundary}--\r\n`);
    const headers = { "content-type": `multipart/form-data; boundary=${boundary}` };
    const bad = await send("/upload", multipart(["pending.txt", "reject.txt"]), headers);
    assert.equal(bad.status, 400);
    await delay(100);
    assert.equal(resumedFilter, true);
    const good = await send("/upload", multipart(["valid.txt"]), headers);
    assert.equal(good.status, 200);
    assert.deepEqual(JSON.parse(good.text), { files: 1 });
  } else {
    throw new Error("Unknown security regression scenario");
  }
  assert.equal((await send("/health")).status, 200);
} finally {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
