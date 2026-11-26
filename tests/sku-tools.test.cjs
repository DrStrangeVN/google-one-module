"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const root = path.resolve(__dirname, "..");
const TARGET = "g1.2tb.ai.12months_ip_90p";
const LEGACY_TARGET = "g1.2tb.ai.annual";
const SCAN_KEY = "g1.sku.scan.v1";
const TEST_KEY = "g1.pro.annual.test.v1";
const CONFIG_KEY = "g1.config.v1";
const REPORT = "https://one.google.com/g1-sku-report";
const REPORT_VERSION = "v7.5.0-vi";
// Fixture source IDs test the matching contract; they are not store catalog evidence.
const SOURCE = "g1.ios.2tb.fixture_monthly";
const OTHER_SOURCE = "g1.ios.2tb.fixture_annual";
const TWENTY = "g1.ios.20tb.m.v2";
const THIRTY = "g1.ios.30tb.ai.pro.m";
const TWENTY_TARGET = "g1.20tb.3months_ip_90p.acq";
const THIRTY_TARGET = "g1.ai.ultra.3months_ip_90p.acq";
const TWENTY_FALLBACK = "g1.20tb.3months_ip_75p.acq";
const THIRTY_FALLBACK = "g1.ai.ultra.3months_ip_75p.acq";
const V76_TWENTY_TARGET = "g1.20tb.1month_eft.acq";
const V76_THIRTY_TARGET = "g1.ai.ultra.1month_eft.acq";
const source = Object.fromEntries(
  [
    "g1-acq.js", "g1-all-in-one.js", "g1-all-in-one-v1.js",
    "tests/fixtures/g1-acq-v6.js", "g1-sku-scan.js",
    "g1-sku-report.js", "g1-sku-report-v1.js"
  ].map(name => [name, fs.readFileSync(path.join(root, name), "utf8")])
);

function run(name, options = {}) {
  const storage = options.storage || new Map();
  const calls = [];
  const binaryBodies = [];
  const logs = [];
  const reads = [];
  const writes = [];
  const notifications = [];
  const context = {
    $request: {
      url: options.url || "https://one.google.com/ai?fixture=1",
      headers: { Cookie: "cookie-secret", Authorization: "auth-secret" }
    },
    $response: {
      body: options.body,
      headers: options.responseHeaders || { "x-private": "response-secret" },
      ...(options.responseStatus !== undefined ? { status: options.responseStatus } : {})
    },
    $done: payload => {
      if (payload && ArrayBuffer.isView(payload.body)) {
        binaryBodies.push(Uint8Array.from(payload.body));
      } else {
        binaryBodies.push(null);
      }
      calls.push(JSON.parse(JSON.stringify(payload)));
    },
    console: { log: value => logs.push(String(value)) }
  };
  if (options.notificationAvailable !== false) {
    context.$notification = {
      post(title, subtitle, message) {
        if (options.notificationThrows) throw new Error("notification failure");
        notifications.push({ title, subtitle, message });
      }
    };
  }
  if (options.storageAvailable !== false) {
    context.$persistentStore = {
      read(key) {
        if (options.storageThrows) throw new Error("fixture storage failure");
        reads.push(key);
        return storage.get(key) || null;
      },
      write(value, key) {
        if (options.storageThrows) throw new Error("fixture storage failure");
        writes.push(key);
        if (options.storageWriteFails) return false;
        storage.set(key, value);
        return true;
      }
    };
  }
  vm.runInNewContext(source[name], context, { timeout: 2000, filename: name });
  assert.equal(calls.length, 1, "$done must be called once");
  return { payload: calls[0], binaryBody: binaryBodies[0], storage, logs, reads, writes, notifications };
}

function get(storage, key) {
  return JSON.parse(storage.get(key));
}

test("combined module maps 2TB, 20TB and 30TB while preserving unrelated full tokens", () => {
  const untouched = [
    "g1.ios.12tb.fixture", TWENTY + ".extra", THIRTY + ".extra",
    "g1.ios.2tbx.fixture", "prefix" + SOURCE, "x." + SOURCE,
    "person@" + SOURCE, "g1.2tb", TARGET
  ];
  const values = [SOURCE, OTHER_SOURCE, SOURCE, TWENTY, THIRTY, ...untouched];
  const result = run("g1-acq.js", { body: JSON.stringify(values) });
  assert.deepEqual(JSON.parse(result.payload.body), [TARGET, TARGET, TARGET, TWENTY_FALLBACK, THIRTY_FALLBACK, ...untouched]);
  const record = get(result.storage, TEST_KEY);
  assert.equal(record.hitCount, 5);
  assert.equal(record.annualHitCount, 3);
  assert.equal(record.status, "rewritten");
  assert.equal(record.version, "g1-acq-v7.8");
  assert.deepEqual(record.matchedFrom, [
    { id: TWENTY, to: TWENTY_FALLBACK, count: 1, fallback: false },
    { id: OTHER_SOURCE, to: TARGET, count: 1, fallback: false },
    { id: SOURCE, to: TARGET, count: 2, fallback: false },
    { id: THIRTY, to: THIRTY_FALLBACK, count: 1, fallback: false }
  ]);
});

test("empty responses or responses with no configured sources pass through", () => {
  for (const body of ["", "g1.ios.100gb.m", "g1.ios.20tb.other", "g1.ios.30tb.other"]) {
    const result = run("g1-acq.js", { body });
    assert.deepEqual(result.payload, {});
    assert.equal(get(result.storage, TEST_KEY).status, "no-match");
  }
  for (const body of [undefined, null, 123, {}]) {
    const result = run("g1-acq.js", { body });
    assert.deepEqual(result.payload, {});
    assert.equal(get(result.storage, TEST_KEY).status, "non-text");
  }
});

test("20TB and 30TB use fixed 75p offers across all offer combinations (v7.8)", () => {
  const cases = (target, other) => [
    [],
    [target],
    [other],
    [target, other]
  ];
  for (const twentyOffers of cases(TWENTY_FALLBACK, TWENTY_TARGET)) {
    for (const thirtyOffers of cases(THIRTY_FALLBACK, THIRTY_TARGET)) {
      const observed = [...twentyOffers, ...thirtyOffers];
      const body = JSON.stringify([TWENTY, THIRTY, TWENTY, ...observed]);
      const result = run("g1-acq.js", { body });
      assert.deepEqual(JSON.parse(result.payload.body), [TWENTY_FALLBACK, THIRTY_FALLBACK, TWENTY_FALLBACK, ...observed]);
      const record = get(result.storage, TEST_KEY);
      assert.equal(record.hitCount, 3);
      assert.equal(record.annualHitCount, 0);
      assert.equal(record.status, "rewritten");
    }
  }
});

test("fixed 75p mapping ignores backup tokens and keeps 2TB target fixed (v7.8)", () => {
  const body = JSON.stringify([SOURCE, TWENTY, THIRTY, V76_TWENTY_TARGET, TWENTY_TARGET, THIRTY_TARGET, THIRTY_FALLBACK]);
  const result = run("g1-acq.js", { body });
  assert.deepEqual(JSON.parse(result.payload.body).slice(0, 3), [TARGET, TWENTY_FALLBACK, THIRTY_FALLBACK]);
  const rows = get(result.storage, TEST_KEY).matchedFrom;
  assert.deepEqual(rows.find(row => row.id === SOURCE), { id: SOURCE, to: TARGET, count: 1, fallback: false });
  assert.deepEqual(rows.find(row => row.id === TWENTY), { id: TWENTY, to: TWENTY_FALLBACK, count: 1, fallback: false });
  assert.deepEqual(rows.find(row => row.id === THIRTY), { id: THIRTY, to: THIRTY_FALLBACK, count: 1, fallback: false });
});

test("single module collects other Google pages without changing the last mapping record", () => {
  for (const url of [
    "https://one.google.com/ai", "https://one.google.com/ai/other?x=1",
    "https://one.google.com/plans?x=1"
  ]) {
    const previous = JSON.stringify({ schemaVersion: 1, version: "previous-record", hitCount: 2 });
    const storage = new Map([[TEST_KEY, previous]]);
    const result = run("g1-acq.js", { url, body: SOURCE, storage });
    assert.deepEqual(result.payload, {});
    assert.equal(storage.get(TEST_KEY), previous);
    assert.equal(get(storage, SCAN_KEY).skus[0].id, SOURCE);
  }
  for (const url of [
    "https://one.google.com.evil/ai?x=1", "http://one.google.com/ai?x=1",
    REPORT, REPORT + "?format=json", REPORT + "/", REPORT + "/?format=json"
  ]) {
    const result = run("g1-acq.js", { url, body: SOURCE });
    assert.deepEqual(result.payload, {});
    assert.equal(result.storage.size, 0);
  }
});

test("single module saves original candidates before rewriting without recording generated targets", () => {
  const body = JSON.stringify([SOURCE, SOURCE, TWENTY, THIRTY, "com.google.one.fixture"]);
  const result = run("g1-acq.js", { body });
  assert.deepEqual(JSON.parse(result.payload.body), [TARGET, TARGET, TWENTY_FALLBACK, THIRTY_FALLBACK, "com.google.one.fixture"]);
  const scan = get(result.storage, SCAN_KEY);
  assert.equal(scan.version, "g1-acq-v7.8");
  assert.deepEqual(scan.skus.map(row => row.id), ["com.google.one.fixture", TWENTY, SOURCE, THIRTY]);
  assert.equal(scan.skus.find(row => row.id === SOURCE).count, 2);
  assert.deepEqual(result.writes, [SCAN_KEY, TEST_KEY]);
});

test("single-module collection decodes discovery copies and continues mapping when the list is full", () => {
  const escaped = String.raw`g1\u002eios\u002e2tb\u002eescaped`;
  const decoded = run("g1-acq.js", { body: escaped });
  assert.deepEqual(decoded.payload, {});
  assert.equal(get(decoded.storage, SCAN_KEY).skus[0].id, "g1.ios.2tb.escaped");
  const storage = new Map();
  const full = Array.from({ length: 305 }, (_, index) => "g1.fixture." + index).join(" ");
  run("g1-acq.js", { url: "https://one.google.com/plans", body: full, storage });
  const fullEvent = get(storage, SCAN_KEY).recentResponses.at(-1);
  assert.equal(fullEvent.status, "new-skus");
  assert.equal(fullEvent.candidateCount, 305);
  assert.equal(fullEvent.addedCount, 300);
  assert.equal(fullEvent.omittedCount, 5);
  const next = run("g1-acq.js", { body: SOURCE + " g1.fixture.0", storage });
  assert.equal(next.payload.body, TARGET + " g1.fixture.0");
  const scan = get(storage, SCAN_KEY);
  assert.equal(scan.skus.length, 300);
  assert.equal(scan.truncated, true);
  assert.equal(scan.scannedResponses, 2);
  assert.equal(scan.skus.find(row => row.id === "g1.fixture.0").count, 2);
  assert.equal(scan.recentResponses.at(-1).status, "limit-reached");
  assert.equal(scan.recentResponses.at(-1).candidateCount, 2);
  assert.equal(scan.recentResponses.at(-1).addedCount, 0);
  assert.equal(scan.recentResponses.at(-1).omittedCount, 1);
});

test("activity distinguishes new IDs, repeated IDs, empty text and nontext responses", () => {
  const storage = new Map();
  const url = "https://one.google.com/plans?token=private-token";
  const body = [SOURCE, SOURCE, OTHER_SOURCE].join(" ");
  run("g1-acq.js", { url, body, storage });
  let scan = get(storage, SCAN_KEY);
  assert.equal(scan.recentResponses[0].status, "new-skus");
  assert.equal(scan.recentResponses[0].candidateCount, 2);
  assert.equal(scan.recentResponses[0].addedCount, 2);
  run("g1-acq.js", { url, body, storage });
  scan = get(storage, SCAN_KEY);
  assert.equal(scan.skus.length, 2);
  assert.equal(scan.skus.find(row => row.id === SOURCE).count, 4);
  assert.equal(scan.scannedResponses, 2);
  assert.equal(scan.matchedResponses, 2);
  assert.equal(scan.recentResponses.at(-1).status, "known-skus");
  assert.equal(scan.recentResponses.at(-1).candidateCount, 2);
  assert.equal(scan.recentResponses.at(-1).addedCount, 0);
  run("g1-acq.js", { url, body: "no product in this response", storage });
  run("g1-acq.js", { url, body: undefined, storage });
  scan = get(storage, SCAN_KEY);
  assert.deepEqual(scan.recentResponses.map(event => event.status), ["new-skus", "known-skus", "no-skus", "non-text"]);
  assert.equal(scan.scannedResponses, 3);
  assert.equal(scan.matchedResponses, 2);
  assert.equal(scan.nonTextResponses, 1);
  assert.equal(scan.skus.length, 2);
  assert.equal(scan.recentResponses.at(-1).bodyType, "non-text");
  assert.equal(scan.recentResponses.at(-1).candidateCount, 0);
  assert.equal(storage.has(TEST_KEY), false, "non-rewrite pages preserve the mapping record");
  assert(!storage.get(SCAN_KEY).includes("private-token"));
  const data = JSON.parse(run("g1-sku-report.js", { url: REPORT + "?format=json", storage }).payload.response.body);
  assert.deepEqual(data.scan.recentResponses, scan.recentResponses);
  assert.equal(data.scan.nonTextResponses, 1);
  const html = run("g1-sku-report.js", { url: REPORT, storage }).payload.response.body;
  assert(html.includes("Script quét thực tế: <code>g1-acq-v7.8</code>"));
  assert(html.includes("Đã nhận response, SKU trùng bản ghi cũ"));
  assert(html.includes("Response không phải văn bản để quét"));
});

test("recent activity keeps ten arrivals and redacts URLs, extra fields and malformed events", () => {
  const valid = {
    at: "2099-01-01T00:00:00.000Z", path: "/ai", bodyType: "text", status: "no-skus",
    candidateCount: 0, addedCount: 0, omittedCount: 0, body: "private-history-body"
  };
  const storage = new Map([[SCAN_KEY, JSON.stringify({
    schemaVersion: 1, recentResponses: [valid, { ...valid, path: "/private-secret" }, { ...valid, status: "bad-status" }]
  })]]);
  run("g1-acq.js", { url: "https://one.google.com/plans?secret=1", body: SOURCE, storage });
  let scan = get(storage, SCAN_KEY);
  assert.equal(scan.recentResponses.length, 2);
  assert.equal(scan.recentResponses[0].at, valid.at);
  assert.equal(scan.recentResponses.at(-1).path, "/plans", "last received event stays last even after a clock change");
  const paths = ["/", "/ai/", "/plans/", "/_/GoogleOne/account-secret/data/batchexecute", "/account/private@example.test"];
  const expected = ["/", "/ai", "/plans", "/_/…/data/batchexecute", "[Đường dẫn one.google.com khác]"];
  for (let index = 0; index < 14; index++) {
    run("g1-acq.js", { url: "https://one.google.com" + paths[index % 5] + "?secret=query#private-fragment", body: SOURCE, storage });
  }
  scan = get(storage, SCAN_KEY);
  assert.equal(scan.recentResponses.length, 10);
  assert.deepEqual(scan.recentResponses.map(event => event.path), Array.from({ length: 10 }, (_, index) => expected[(index + 4) % 5]));
  assert(scan.recentResponses.every(event => event.status === "known-skus" && event.addedCount === 0));
  for (const forbidden of ["private-history-body", "private-secret", "account-secret", "private@example.test", "query", "private-fragment", "secret="]) {
    assert(!storage.get(SCAN_KEY).includes(forbidden));
  }
});

test("old scan records remain old until an actual response creates a new diagnostic event", () => {
  const old = {
    schemaVersion: 1, version: "g1-acq-v7.1", updatedAt: "2026-11-23T07:40:18.464Z",
    scannedResponses: 5, matchedResponses: 1,
    skus: [{ id: SOURCE, count: 4, lastSeen: "2026-11-23T07:40:06.325Z" }]
  };
  const storage = new Map([[SCAN_KEY, JSON.stringify(old)]]);
  const before = storage.get(SCAN_KEY);
  let data = JSON.parse(run("g1-sku-report.js", { url: REPORT + "?format=json", storage }).payload.response.body);
  assert.equal(data.scan.version, "g1-acq-v7.1");
  assert.deepEqual(data.scan.recentResponses, []);
  assert.equal(data.scan.scannedResponses, 5);
  assert.equal(storage.get(SCAN_KEY), before);
  const html = run("g1-sku-report.js", { url: REPORT, storage }).payload.response.body;
  assert(html.includes("Bản ghi thu thập bản cũ; chưa lưu lịch sử chẩn đoán v7.5."));
  run("g1-acq.js", { url: "https://one.google.com/plans", body: SOURCE, storage });
  data = JSON.parse(run("g1-sku-report.js", { url: REPORT + "?format=json", storage }).payload.response.body);
  assert.equal(data.scan.version, "g1-acq-v7.8");
  assert.equal(data.scan.scannedResponses, 6);
  assert.equal(data.scan.matchedResponses, 2);
  assert.equal(data.scan.skus.length, 1);
  assert.equal(data.scan.skus[0].count, 5);
  assert.equal(data.scan.recentResponses.length, 1);
  assert.equal(data.scan.recentResponses[0].status, "known-skus");
  assert.equal(data.scan.recentResponses[0].addedCount, 0);
});

test("activity export rejects malformed metadata and excludes untrusted extra fields", () => {
  const event = {
    at: "2026-11-23T07:40:06.325Z", path: "/plans", bodyType: "text", status: "known-skus",
    candidateCount: 2, addedCount: 0, omittedCount: 0, body: "private-body", query: "private-token"
  };
  const storage = new Map([[SCAN_KEY, JSON.stringify({
    schemaVersion: 1, version: "g1-acq-v7.5",
    recentResponses: [event, { ...event, at: "<script>private</script>" }, { ...event, status: "constructor" }, { ...event, bodyType: "unknown" }]
  })]]);
  const result = run("g1-sku-report.js", { url: REPORT + "?format=json", storage });
  const data = JSON.parse(result.payload.response.body);
  assert.deepEqual(data.scan.recentResponses, [{
    at: event.at, path: event.path, bodyType: "text", status: "known-skus", candidateCount: 2, addedCount: 0, omittedCount: 0
  }]);
  assert(!result.payload.response.body.includes("private"));
});

test("storage errors do not prevent a matched response from completing", () => {
  for (const flags of [{ storageAvailable: false }, { storageThrows: true }, { storageWriteFails: true }]) {
    const result = run("g1-acq.js", { body: SOURCE, ...flags });
    assert.equal(result.payload.body, TARGET);
  }
});

test("test records omit cookies, headers and full response data", () => {
  const result = run("g1-acq.js", { body: JSON.stringify({ sku: SOURCE, email: "private@example.test" }) });
  const saved = result.storage.get(TEST_KEY);
  assert(!saved.includes("private@example.test"));
  assert(!saved.includes("secret"));
  assert.deepEqual(result.reads, [SCAN_KEY]);
  assert(!result.storage.get(SCAN_KEY).includes("private@example.test"));
  assert(!result.storage.get(SCAN_KEY).includes("secret"));
});

test("collector discovers IDs and escaped dots while preserving the response", () => {
  const body = JSON.stringify([
    SOURCE, SOURCE, TARGET, "com.google.one.2tb.fixture.iog", "private@example.test"
  ]) + String.raw` "g1\u002eios\u002e2tb\u002eescaped" "g1&#46;2tb&#46;html"`;
  const result = run("g1-sku-scan.js", { body });
  assert.deepEqual(result.payload, {});
  const state = get(result.storage, SCAN_KEY);
  assert.equal(state.version, "g1-sku-scan-v7.5");
  assert.equal(state.scannedResponses, 1);
  assert.equal(state.matchedResponses, 1);
  assert.equal(state.nonTextResponses, 0);
  assert.equal(state.recentResponses[0].status, "new-skus");
  assert.equal(state.skus.length, 5);
  assert.equal(state.skus.find(row => row.id === SOURCE).count, 2);
  assert(state.skus.some(row => row.id === "g1.ios.2tb.escaped"));
  assert(state.skus.some(row => row.id === "g1.2tb.html"));
  assert(!JSON.stringify(state).includes("private@example.test"));
  assert(!JSON.stringify(state).includes("secret"));
});

test("collector accumulates prior records and recovers corrupt storage", () => {
  const storage = new Map([[SCAN_KEY, "corrupt JSON"]]);
  run("g1-sku-scan.js", { body: SOURCE, storage });
  run("g1-sku-scan.js", { url: "https://one.google.com/plans", body: SOURCE + " " + TARGET, storage });
  const state = get(storage, SCAN_KEY);
  assert.equal(state.scannedResponses, 2);
  assert.equal(state.skus.length, 2);
  assert.equal(state.skus.find(row => row.id === SOURCE).count, 2);
});

test("collector bounds stored candidates at 300 and still counts existing IDs", () => {
  const body = Array.from({ length: 305 }, (_, index) => "g1.fixture." + index).join(" ");
  const result = run("g1-sku-scan.js", { body });
  assert.equal(get(result.storage, SCAN_KEY).skus.length, 300);
  assert.equal(get(result.storage, SCAN_KEY).truncated, true);
  run("g1-sku-scan.js", { body: "g1.fixture.0", storage: result.storage });
  assert.equal(get(result.storage, SCAN_KEY).skus.find(row => row.id === "g1.fixture.0").count, 2);
});

test("collector skips local report & other domains while recording nontext diagnostics", () => {
  for (const options of [
    { url: REPORT, body: SOURCE },
    { url: REPORT + "?format=json", body: SOURCE },
    { url: REPORT + "/", body: SOURCE },
    { url: REPORT + "/?format=json", body: SOURCE },
    { url: "https://one.google.com.evil/ai?x=1", body: SOURCE }
  ]) {
    const result = run("g1-sku-scan.js", options);
    assert.deepEqual(result.payload, {});
    assert.equal(result.storage.size, 0);
  }
  for (const body of [undefined, new Uint8Array([1, 2])]) {
    const result = run("g1-sku-scan.js", { body });
    assert.deepEqual(result.payload, {});
    const state = get(result.storage, SCAN_KEY);
    assert.equal(state.nonTextResponses, 1);
    assert.equal(state.scannedResponses, 0);
    assert.equal(state.recentResponses[0].status, "non-text");
  }
});

test("collector passes through on storage failure", () => {
  const result = run("g1-sku-scan.js", { body: SOURCE, storageThrows: true });
  assert.deepEqual(result.payload, {});
  assert(result.logs.some(line => line.includes("saved=no")));
});

test("all-in-one auto mode scans original candidates, rewrites and posts iOS notification", () => {
  const body = JSON.stringify([SOURCE, TWENTY, THIRTY]);
  const result = run("g1-all-in-one.js", { body });
  assert.deepEqual(JSON.parse(result.payload.body), [TARGET, TWENTY_TARGET, THIRTY_TARGET]);
  const scan = get(result.storage, SCAN_KEY);
  const testRec = get(result.storage, TEST_KEY);
  assert.equal(scan.version, "g1-aio-v7.5");
  assert.deepEqual(scan.skus.map(r => r.id), [TWENTY, SOURCE, THIRTY]);
  assert.equal(testRec.version, "g1-aio-v7.5");
  assert.equal(testRec.hitCount, 3);
  assert.equal(testRec.annualHitCount, 1);
  assert.equal(result.notifications.length, 1);
  assert.equal(result.notifications[0].title, "G1 All-in-One");
  assert.match(result.notifications[0].subtitle, /Đã ghi đè 3 SKU \(2TB: 1\)/);
});

test("all-in-one scan-only mode scans & notifies without rewriting body or touching TEST_KEY", () => {
  const storage = new Map([[CONFIG_KEY, JSON.stringify({
    schemaVersion: 1, mode: "scan-only", target2tb: TARGET, enable2tb: true, enable20tb: true, enable30tb: true, rewriteScope: "ai", notify: true
  })]]);
  const result = run("g1-all-in-one.js", { body: SOURCE, storage });
  assert.deepEqual(result.payload, {});
  assert.equal(storage.has(TEST_KEY), false);
  assert.equal(get(storage, SCAN_KEY).skus[0].id, SOURCE);
  assert.equal(result.notifications.length, 1);
  assert.match(result.notifications[0].subtitle, /Phát hiện \+1 SKU mới/);
});

test("all-in-one rewrite-only mode rewrites without reading or writing SCAN_KEY", () => {
  const storage = new Map([[CONFIG_KEY, JSON.stringify({
    schemaVersion: 1, mode: "rewrite-only", target2tb: TARGET, enable2tb: true, enable20tb: true, enable30tb: true, rewriteScope: "ai", notify: false
  })]]);
  const result = run("g1-all-in-one.js", { body: SOURCE, storage });
  assert.equal(result.payload.body, TARGET);
  assert.equal(storage.has(SCAN_KEY), false);
  assert.deepEqual(result.reads, [CONFIG_KEY]);
  assert.equal(result.notifications.length, 0);
});

test("all-in-one honors custom target2tb, per-tier disables, extended scope and corrupt config", () => {
  const customCfg = {
    schemaVersion: 1,
    mode: "auto",
    target2tb: "g1.2tb.ai.custom_offer",
    enable2tb: true,
    enable20tb: false,
    enable30tb: false,
    rewriteScope: "extended",
    notify: false
  };
  const storage = new Map([[CONFIG_KEY, JSON.stringify(customCfg)]]);
  const body = JSON.stringify([SOURCE, TWENTY, THIRTY]);
  const plansRes = run("g1-all-in-one.js", { url: "https://one.google.com/plans", body, storage });
  assert.deepEqual(JSON.parse(plansRes.payload.body), ["g1.2tb.ai.custom_offer", TWENTY, THIRTY]);
  const batchRes = run("g1-all-in-one.js", { url: "https://one.google.com/_/GoogleOneUi/data/batchexecute?f.sid=1", body, storage });
  assert.deepEqual(JSON.parse(batchRes.payload.body), ["g1.2tb.ai.custom_offer", TWENTY, THIRTY]);
  assert.equal(get(storage, TEST_KEY).targetOrigin, "custom");
  assert.equal(plansRes.notifications.length, 0);

  const disable2tb = new Map([[CONFIG_KEY, JSON.stringify({
    schemaVersion: 1, mode: "auto", target2tb: "g1.2tb.ai.custom_offer",
    enable2tb: false, enable20tb: true, enable30tb: false, rewriteScope: "ai", notify: true
  })]]);
  const partialRes = run("g1-all-in-one.js", { body, storage: disable2tb });
  assert.deepEqual(JSON.parse(partialRes.payload.body), [SOURCE, TWENTY_TARGET, THIRTY]);

  const corrupt = new Map([[CONFIG_KEY, "{not-json"]]);
  const fallbackRes = run("g1-all-in-one.js", { body: SOURCE, storage: corrupt });
  assert.equal(fallbackRes.payload.body, TARGET);
});

test("report displays captured IDs and test sources without external assets", () => {
  const storage = new Map();
  run("g1-sku-scan.js", { body: SOURCE, storage });
  run("g1-acq.js", { body: SOURCE, storage });
  const { payload } = run("g1-sku-report.js", { url: REPORT, storage });
  assert.equal(payload.response.status, 200);
  assert.match(payload.response.body, /Báo cáo Google One SKU nội bộ/);
  assert(payload.response.body.includes(SOURCE));
  assert(payload.response.body.includes(TARGET));
  assert(payload.response.body.includes("Script nội bộ đang hoạt động · " + REPORT_VERSION));
  assert.match(payload.response.body, /<button\b[^>]*name=format[^>]*value=json[^>]*>Xuất JSON<\/button>/);
  assert(!/<(?:script|img|iframe)\b/i.test(payload.response.body));
  assert.equal(payload.response.headers["Cache-Control"], "no-store");
});

test("report export form resolves to a JSON attachment and supports a trailing slash", () => {
  const storage = new Map();
  run("g1-acq.js", { body: SOURCE, storage });
  const html = run("g1-sku-report.js", { url: REPORT + "/", storage }).payload.response.body;
  const action = html.match(/<form method=get action="([^"]+)"><button type=submit name=format value=json>/);
  assert(action, "the visible export button must submit a GET form");
  const url = new URL(action[1]);
  url.searchParams.set("format", "json");
  assert.equal(url.href, REPORT + "?format=json");
  for (const exportURL of [url.href, REPORT + "/?format=json"]) {
    const result = run("g1-sku-report.js", { url: exportURL, storage });
    assert.equal(result.payload.response.status, 200);
    assert.equal(result.payload.response.headers["Content-Disposition"], 'attachment; filename="g1-sku-report.json"');
    assert.equal(result.payload.response.headers["X-G1-Report-Version"], REPORT_VERSION);
    const data = JSON.parse(result.payload.response.body);
    assert.equal(data.reportVersion, REPORT_VERSION);
    assert.equal(data.configuredTarget, TARGET);
    assert.equal(data.config.mode, "auto");
    assert.equal(data.test.target, TARGET);
    assert.equal(data.test.targetOrigin, "user-specified");
    assert.equal(data.scan.skus[0].id, SOURCE);
    assert.equal(data.test.matchedFrom[0].to, TARGET);
    assert(result.logs.some(line => line.includes("[g1-sku-report] " + REPORT_VERSION + " json")));
  }
});

test("report control panel updates mode, preset, full form and rejects invalid SKUs safely", () => {
  const storage = new Map();
  run("g1-sku-report.js", { url: REPORT + "?action=mode&mode=scan-only", storage });
  assert.equal(get(storage, CONFIG_KEY).mode, "scan-only");

  run("g1-sku-report.js", { url: REPORT + "?action=preset&target2tb=" + LEGACY_TARGET, storage });
  assert.equal(get(storage, CONFIG_KEY).target2tb, LEGACY_TARGET);
  assert.equal(get(storage, CONFIG_KEY).mode, "scan-only");

  const saveUrl = REPORT + "?action=save&mode=rewrite-only&target2tb=g1.2tb.ai.custom&scope=extended&e2tb=1&e30tb=1";
  run("g1-sku-report.js", { url: saveUrl, storage });
  assert.deepEqual(get(storage, CONFIG_KEY), {
    schemaVersion: 1,
    mode: "rewrite-only",
    target2tb: "g1.2tb.ai.custom",
    enable2tb: true,
    enable20tb: false,
    enable30tb: true,
    rewriteScope: "extended",
    notify: false
  });

  const beforeBad = storage.get(CONFIG_KEY);
  const badRes = run("g1-sku-report.js", {
    url: REPORT + "?action=save&target2tb=%3Cscript%3Ebad%3C/script%3E&mode=auto&e2tb=1",
    storage
  });
  assert.equal(storage.get(CONFIG_KEY), beforeBad);
  assert(!badRes.payload.response.body.includes("<script>bad"));
  assert(badRes.payload.response.body.includes("Mã SKU 2TB không hợp lệ"));
});

test("report exports each actual target and separates annual hits from total hits", () => {
  const storage = new Map();
  run("g1-acq.js", {
    body: JSON.stringify([SOURCE, TWENTY, THIRTY, THIRTY_TARGET]), storage
  });
  const result = run("g1-sku-report.js", { url: REPORT + "?format=json", storage });
  const data = JSON.parse(result.payload.response.body).test;
  assert.equal(data.version, "g1-acq-v7.8");
  assert.equal(data.hitCount, 3);
  assert.equal(data.annualHitCount, 1);
  assert.equal(data.matchedFrom.find(row => row.id === TWENTY).to, TWENTY_FALLBACK);
  assert.deepEqual(data.matchedFrom.find(row => row.id === THIRTY), {
    id: THIRTY, count: 1, to: THIRTY_FALLBACK, fallback: false
  });
  const html = run("g1-sku-report.js", { url: REPORT, storage }).payload.response.body;
  assert(html.includes("Lần chạy mapping 3 mức gần nhất"));
  assert(html.includes("Trong đó 2TB: 1"));
  assert(html.includes(TWENTY_FALLBACK));
  assert(html.includes(THIRTY_FALLBACK));
});

test("new report displays existing v1 records with their original 2TB target", () => {
  const storage = new Map([[TEST_KEY, JSON.stringify({
    schemaVersion: 1, version: "pro-annual-test-v1", hitCount: 2, status: "rewritten",
    matchedFrom: [{ id: SOURCE, count: 2 }]
  })]]);
  const result = run("g1-sku-report.js", { url: REPORT + "?format=json", storage });
  const data = JSON.parse(result.payload.response.body).test;
  assert.equal(data.version, "pro-annual-test-v1");
  assert.equal(data.hitCount, 2);
  assert.equal(data.annualHitCount, 2);
  assert.equal(data.target, LEGACY_TARGET);
  assert.equal(data.targetOrigin, "legacy");
  assert.deepEqual(data.matchedFrom, [{ id: SOURCE, count: 2, to: LEGACY_TARGET, fallback: false }]);
  storage.set(TEST_KEY, JSON.stringify({
    schemaVersion: 1, version: "pro-annual-test-v1", hitCount: 0,
    status: "no-match", matchedFrom: []
  }));
  const html = run("g1-sku-report.js", { url: REPORT, storage }).payload.response.body;
  assert(html.includes("Bản ghi v1 cũ: response không khớp tiền tố iOS 2TB"));
});

test("report preserves saved v7.1 through v7.4 targets and origins independently of current configuration", () => {
  for (const prior of [
    { version: "g1-acq-v7.1", target: LEGACY_TARGET, origin: "legacy" },
    { version: "g1-acq-v7.2", target: "g1.2tb.ai.annual.3months_ip_90p.acq", origin: "pattern-derived" },
    { version: "g1-acq-v7.3", target: "g1.2tb.ai.annual_ip_90p.acq", origin: "user-specified" },
    { version: "g1-acq-v7.4", target: "g1.2tb.ai.annual_ip_90p.acq", origin: "user-specified" }
  ]) {
    const record = {
      schemaVersion: 1, version: prior.version, target: prior.target,
      status: "rewritten", hitCount: 9, annualHitCount: 9,
      matchedFrom: [{ id: "g1.ios.2tb.ai.a", to: prior.target, count: 9, fallback: false }]
    };
    if (prior.origin !== "legacy") record.targetOrigin = prior.origin;
    const storage = new Map([[TEST_KEY, JSON.stringify(record)]]);
    const before = storage.get(TEST_KEY);
    const data = JSON.parse(run("g1-sku-report.js", { url: REPORT + "?format=json", storage }).payload.response.body);
    assert.equal(data.configuredTarget, TARGET);
    assert.equal(data.test.version, prior.version);
    assert.equal(data.test.target, prior.target);
    assert.equal(data.test.targetOrigin, prior.origin);
    assert.equal(data.test.matchedFrom[0].to, prior.target);
    assert.equal(storage.get(TEST_KEY), before);
    const html = run("g1-sku-report.js", { url: REPORT, storage }).payload.response.body;
    assert(html.includes("Mã đích 2TB đang cấu hình: <code>" + TARGET + "</code>"));
    assert(html.includes("Mã 2TB đã ghi nhận trong lần chạy này: <code>" + prior.target + "</code>"));
  }
  const empty = JSON.parse(run("g1-sku-report.js", { url: REPORT + "?format=json" }).payload.response.body);
  assert.equal(empty.configuredTarget, TARGET);
  assert.equal(empty.test.target, "");
  assert.equal(empty.test.targetOrigin, "");
  assert.equal(empty.test.status, "");
});

test("JSON export is limited to report fields and escapes untrusted HTML text", () => {
  const storage = new Map([[SCAN_KEY, JSON.stringify({
    schemaVersion: 1, updatedAt: "<script>fixture</script>", scannedResponses: 1,
    secret: "must-not-export", body: "must-not-export",
    skus: [{ id: SOURCE, count: 2, lastSeen: "<img src=x>", secret: "must-not-export" }]
  })]]);
  const jsonResult = run("g1-sku-report.js", { url: REPORT + "?format=json", storage });
  assert.match(jsonResult.payload.response.headers["Content-Type"], /application\/json/);
  const report = JSON.parse(jsonResult.payload.response.body);
  assert.equal(report.scan.skus[0].id, SOURCE);
  assert(!jsonResult.payload.response.body.includes("must-not-export"));
  const htmlResult = run("g1-sku-report.js", { url: REPORT, storage });
  assert(!htmlResult.payload.response.body.includes("<script>fixture"));
  assert(htmlResult.payload.response.body.includes("&lt;img src=x&gt;"));
});

test("clear actions affect only the targeted tool keys", () => {
  const cfg = JSON.stringify({ schemaVersion: 1, mode: "scan-only" });
  const storage = new Map([
    [SCAN_KEY, JSON.stringify({ schemaVersion: 1, skus: [{ id: SOURCE, count: 1 }] })],
    [TEST_KEY, JSON.stringify({ schemaVersion: 1, hitCount: 1 })],
    [CONFIG_KEY, cfg],
    ["other-tool", "untouched"]
  ]);
  run("g1-sku-report.js", { url: REPORT + "?clear=1", storage });
  assert.deepEqual(get(storage, SCAN_KEY), {});
  assert.deepEqual(get(storage, TEST_KEY), {});
  assert.equal(storage.get(CONFIG_KEY), cfg);
  assert.equal(storage.get("other-tool"), "untouched");

  storage.set(SCAN_KEY, JSON.stringify({ schemaVersion: 1, skus: [{ id: SOURCE, count: 1 }] }));
  storage.set(TEST_KEY, JSON.stringify({ schemaVersion: 1, hitCount: 1 }));
  run("g1-sku-report.js", { url: REPORT + "?clear=scan", storage });
  assert.deepEqual(get(storage, SCAN_KEY), {});
  assert.equal(get(storage, TEST_KEY).hitCount, 1);

  run("g1-sku-report.js", { url: REPORT + "?clear=test", storage });
  assert.deepEqual(get(storage, TEST_KEY), {});
  assert.equal(storage.get(CONFIG_KEY), cfg);

  run("g1-sku-report.js", { url: REPORT + "?clear=config", storage });
  assert.deepEqual(get(storage, CONFIG_KEY), {});
  assert.equal(storage.get("other-tool"), "untouched");
});

test("report handles unavailable storage and skips other URL paths", () => {
  const unavailable = run("g1-sku-report.js", { url: REPORT + "?format=json", storageAvailable: false });
  assert.equal(JSON.parse(unavailable.payload.response.body).storageAvailable, false);
  for (const url of ["https://one.google.com/ai?x=1", REPORT + "-other", "https://example.test/g1-sku-report"]) {
    const result = run("g1-sku-report.js", { url });
    assert.deepEqual(result.payload, {});
    assert.deepEqual(result.reads, []);
  }
});

test("all Shadowrocket modules and Loon plugins share DrStrangeVN/google-one-module scripts and valid patterns", () => {
  assert.equal(fs.existsSync(path.join(root, "g1-acq.sgmodule")), false);
  const files = [
    { file: "g1-all-in-one.sgmodule", type: "shadowrocket", responseScript: "g1-all-in-one.js", broad: true },
    { file: "g1-acq-v7.sgmodule", type: "shadowrocket", responseScript: "g1-acq.js", broad: true },
    { file: "g1-pro-annual-test.sgmodule", type: "shadowrocket", responseScript: "g1-acq.js", broad: false },
    { file: "g1-sku-scan.sgmodule", type: "shadowrocket", responseScript: "g1-sku-scan.js", broad: true },
    { file: "loon/g1-all-in-one.plugin", type: "loon", responseScript: "g1-all-in-one.js", broad: true },
    { file: "loon/g1-acq-v7.plugin", type: "loon", responseScript: "g1-acq.js", broad: true },
    { file: "loon/g1-sku-scan.plugin", type: "loon", responseScript: "g1-sku-scan.js", broad: true }
  ];
  const scriptBase = "https://raw.githubusercontent.com/DrStrangeVN/google-one-module/main/";
  for (const entry of files) {
    const content = fs.readFileSync(path.join(root, entry.file), "utf8");
    const scripts = content.split("\n").filter(line => line.includes("script-path="));
    assert.equal(scripts.length, 2, entry.file + " must have 2 script entries");
    for (const script of scripts) {
      const url = script.match(/script-path=([^,\s]+)/)[1];
      assert.match(url, /^https:\/\/raw\.githubusercontent\.com\/DrStrangeVN\/google-one-module\/main\/[a-z0-9.-]+\.js$/);
      assert(fs.existsSync(path.join(root, url.split("/").at(-1))));
    }
    if (entry.type === "shadowrocket") {
      assert.match(content, /hostname = %APPEND% one\.google\.com/);
    } else {
      assert.match(content, /^hostname = one\.google\.com$/m);
    }
    const responseLine = scripts.find(line => line.includes("http-response"));
    const requestLine = scripts.find(line => line.includes("http-request"));
    const respPatternStr = entry.type === "shadowrocket"
      ? responseLine.match(/pattern=([^,]+)/)[1]
      : responseLine.match(/^http-response\s+(\S+)/)[1];
    const reqPatternStr = entry.type === "shadowrocket"
      ? requestLine.match(/pattern=([^,]+)/)[1]
      : requestLine.match(/^http-request\s+(\S+)/)[1];

    assert.equal(responseLine.match(/script-path=([^,\s]+)/)[1], scriptBase + entry.responseScript);
    assert.equal(requestLine.match(/script-path=([^,\s]+)/)[1], scriptBase + "g1-sku-report.js");

    const respPattern = new RegExp(respPatternStr);
    assert(respPattern.test("https://one.google.com/ai?x=1"));
    assert(!respPattern.test("https://one.google.com.evil/ai?x=1"));
    assert.equal(respPattern.test("https://one.google.com/plans"), entry.broad);
    assert.equal(respPattern.test("https://one.google.com/ai"), entry.broad);

    const reqPattern = new RegExp(reqPatternStr);
    for (const url of [REPORT, REPORT + "?format=json", REPORT + "/", REPORT + "/?format=json"]) {
      assert(reqPattern.test(url));
    }
    for (const url of [REPORT + "-other", REPORT + "/other", "https://one.google.com.evil/g1-sku-report"]) {
      assert(!reqPattern.test(url));
    }
  }
});

function encodeVarintTest(n) {
  const out = [];
  let v = n >>> 0;
  while (v >= 128) {
    out.push((v & 0x7f) | 0x80);
    v >>>= 7;
  }
  out.push(v);
  return Uint8Array.from(out);
}

function makeProtoField(fieldNum, wireType, payloadBytes) {
  const tag = encodeVarintTest((fieldNum << 3) | wireType);
  if (wireType === 2) {
    const len = encodeVarintTest(payloadBytes.length);
    return Buffer.concat([tag, len, payloadBytes]);
  }
  return Buffer.concat([tag, payloadBytes]);
}

function makeGrpcFrame(flag, msgBytes) {
  const header = Buffer.alloc(5);
  header[0] = flag;
  header.writeUInt32BE(msgBytes.length, 1);
  return Buffer.concat([header, msgBytes]);
}

test("ALL IN ONE_V1 web decodes Uint8Array UTF-8 and honors strictCatalog gate", () => {
  const bytes = new TextEncoder().encode(JSON.stringify([SOURCE, TWENTY]));
  const strictOn = new Map([[CONFIG_KEY, JSON.stringify({
    schemaVersion: 1, mode: "auto", target2tb: TARGET, strictCatalog: true,
    enable2tb: true, enable20tb: true, enable30tb: true, rewriteScope: "ai", notify: false
  })]]);
  const skipped = run("g1-all-in-one-v1.js", { body: bytes, storage: strictOn });
  assert.deepEqual(skipped.payload, {});
  assert.equal(get(strictOn, TEST_KEY).status, "skipped-strict-catalog");
  assert.equal(get(strictOn, SCAN_KEY).skus.length, 2);

  const withPromo = new TextEncoder().encode(JSON.stringify([TWENTY, TWENTY_TARGET]));
  const rewritten = run("g1-all-in-one-v1.js", { body: withPromo, storage: strictOn });
  assert.deepEqual(JSON.parse(rewritten.payload.body), [TWENTY_TARGET, TWENTY_TARGET]);
  assert.equal(get(strictOn, TEST_KEY).status, "rewritten");
});

test("ALL IN ONE_V1 native Protobuf scans gRPC frames and rewrites across varint length boundaries", () => {
  const NATIVE_URL = "https://subscriptionsmobile-pa.googleapis.com/$rpc/google.internal.subscriptions.mobile.v1.SubscriptionsApiMobileService/GetDynamicStorefrontInfo?";
  const skuField = makeProtoField(1, 2, Buffer.from(TWENTY, "ascii"));
  const paddingField = makeProtoField(2, 2, Buffer.alloc(104, 0x61)); // 104+2 = 106; + 18 (skuField) = 124 (<128)
  const innerMsg = Buffer.concat([skuField, paddingField]);
  assert(innerMsg.length < 128);
  const outerMsg = makeProtoField(3, 2, innerMsg);
  const grpcTrailer = makeGrpcFrame(0x80, Buffer.from("grpc-status: 0\r\n", "ascii"));
  const fullPayload = new Uint8Array(Buffer.concat([makeGrpcFrame(0, outerMsg), grpcTrailer]));

  // Default nativeMode is "scan": collects SKU without modifying binary response.
  const scanOnly = run("g1-all-in-one-v1.js", {
    url: NATIVE_URL,
    body: fullPayload,
    responseHeaders: { "content-type": "application/grpc-web+proto" }
  });
  assert.deepEqual(scanOnly.payload, {});
  assert.equal(scanOnly.binaryBody, null);
  const scan = get(scanOnly.storage, SCAN_KEY);
  assert.equal(scan.version, "g1-aio-v2.8");
  assert.equal(scan.skus[0].id, TWENTY);
  assert.equal(scan.recentResponses[0].path, "native:GetDynamicStorefrontInfo");

  // Enable nativeMode: "rewrite": 16-byte TWENTY -> 25-byte TWENTY_TARGET crosses 127 -> 128 varint boundary!
  const storage = new Map([[CONFIG_KEY, JSON.stringify({
    schemaVersion: 1, mode: "auto", target2tb: TARGET,
    nativeMode: "rewrite", strictCatalog: false,
    enable2tb: true, enable20tb: true, enable30tb: true, notify: true
  })]]);
  const rw = run("g1-all-in-one-v1.js", {
    url: NATIVE_URL,
    body: fullPayload,
    responseHeaders: { "content-type": "application/grpc-web+proto" },
    storage
  });
  assert(rw.binaryBody instanceof Uint8Array);
  assert.equal(get(storage, TEST_KEY).hitCount, 1);
  assert.equal(get(storage, TEST_KEY).matchedFrom[0].to, TWENTY_TARGET);
  assert.match(rw.notifications[0].title, /Native/);

  // Re-inspect the rewritten Protobuf payload to prove lengths and gRPC frames are 100% valid!
  const verifyStorage = new Map();
  const verified = run("g1-all-in-one-v1.js", {
    url: NATIVE_URL,
    body: rw.binaryBody,
    responseHeaders: { "content-type": "application/grpc-web+proto" },
    storage: verifyStorage
  });
  assert.deepEqual(verified.payload, {});
  assert.equal(get(verifyStorage, SCAN_KEY).skus[0].id, TWENTY_TARGET);
});

test("ALL IN ONE_V1 report saves profile, overlayPanel, strictCatalog & nativeMode, highlights PROMO SKUs, and keeps strict CSP", () => {
  const storage = new Map();
  run("g1-sku-report-v1.js", {
    url: REPORT + "?action=profile&profile=ultra-1m-free",
    storage
  });
  assert.equal(get(storage, CONFIG_KEY).profile, "ultra-1m-free");

  run("g1-sku-report-v1.js", {
    url: REPORT + "?action=save&profile=promo-90p&mode=auto&target2tb=" + TARGET + "&scope=extended&native=rewrite&strict=1&overlay=1&e2tb=1&e20tb=1&e30tb=1&notify=1",
    storage
  });
  assert.deepEqual(get(storage, CONFIG_KEY), {
    schemaVersion: 1,
    profile: "promo-90p",
    mode: "auto",
    target2tb: TARGET,
    enable2tb: true,
    enable20tb: true,
    enable30tb: true,
    rewriteScope: "extended",
    nativeMode: "rewrite",
    strictCatalog: true,
    overlayPanel: true,
    notify: true,
    theme: "auto",
    customRules: [],
    customRulesOverride: false
  });

  // Note: e30tb & overlay omitted in query -> false
  run("g1-sku-report-v1.js", {
    url: REPORT + "?action=save&profile=promo-90p&mode=auto&target2tb=" + TARGET + "&scope=ai&native=scan&e2tb=1&e20tb=1",
    storage
  });
  assert.equal(get(storage, CONFIG_KEY).enable30tb, false);
  assert.equal(get(storage, CONFIG_KEY).strictCatalog, false);
  assert.equal(get(storage, CONFIG_KEY).overlayPanel, false);
  assert.equal(get(storage, CONFIG_KEY).nativeMode, "scan");

  run("g1-all-in-one-v1.js", { body: JSON.stringify(["g1.ios.2tb.m", TWENTY_TARGET]), storage });
  const html = run("g1-sku-report-v1.js", { url: REPORT, storage }).payload.response.body;
  assert(html.includes("ALL IN ONE_V1"));
  assert(html.includes("tag-promo"));
  assert(html.includes("Dùng làm đích 2TB"));
  assert(!/<(?:script|img|iframe)\b/i.test(html));
  const skuSection = html.slice(html.indexOf("Danh sách SKU thu thập được"));
  assert(skuSection.indexOf(TWENTY_TARGET) < skuSection.indexOf("g1.ios.2tb.m"));
});

test("ALL IN ONE_V1 supports ultra-1m-free and ultra-free-probe profiles, extended upsell/storage routes, and HTML overlay injection", () => {
  const ultra1mStorage = new Map([[CONFIG_KEY, JSON.stringify({
    schemaVersion: 1, profile: "ultra-1m-free", mode: "auto", rewriteScope: "extended", overlayPanel: true, notify: false
  })]]);
  const upsellRes = run("g1-all-in-one-v1.js", {
    url: "https://one.google.com/upsell?x=1",
    body: JSON.stringify(["g1.ios.30gb.m", "g1.ios.helium.a", TWENTY]),
    storage: ultra1mStorage
  });
  assert.deepEqual(JSON.parse(upsellRes.payload.body), [
    "g1.ai.ultra.1month_eft.acq",
    "g1.ai.ultra.1month_eft.acq",
    "g1.ai.ultra.1month_eft.acq"
  ]);

  const probeStorage = new Map([[CONFIG_KEY, JSON.stringify({
    schemaVersion: 1, profile: "ultra-free-probe", mode: "auto", rewriteScope: "extended", overlayPanel: true, notify: false
  })]]);
  const probeInputs = [
    "g1.ios.30gb.m", "g1.ios.100gb.m", "g1.ios.helium.m", "g1.ios.2tb.m",
    "g1.ios.2tb.ai.m", "g1.ios.20tb.m.v2", "g1.ios.2tb.ai.a", "g1.ios.30gb.a",
    "g1.ios.100gb.a", "g1.ios.helium.a", "g1.ios.2tb.a"
  ];
  const probeExpected = [
    "g1.ai.ultra.3months_eft.acq", "g1.ai.ultra.6months_eft.acq", "g1.ai.ultra.12months_eft.acq", "g1.ai.ultra.2months_eft.acq",
    "g1.20tb.3months_eft.acq", "g1.20tb.12months_eft.acq", "g1.2tb.ai.12months_eft.acq", "g1.20tb.1month_eft.acq",
    "g1.20tb.6months_eft.acq", "g1.ai.ultra.3months_eft", "g1.ai.ultra.12months_eft"
  ];
  const storageRes = run("g1-all-in-one-v1.js", {
    url: "https://one.google.com/storage",
    body: JSON.stringify(probeInputs),
    storage: probeStorage
  });
  assert.deepEqual(JSON.parse(storageRes.payload.body), probeExpected);

  // Verify overlayPanel injects pure HTML <details> on HTML pages and leaves JSON with "</body>" untouched
  const htmlRes = run("g1-all-in-one-v1.js", {
    url: "https://one.google.com/ai?x=1",
    body: "<html><body><button data-sku=\"g1.ios.2tb.ai.a\">Sub</button></body></html>",
    storage: probeStorage
  });
  assert(htmlRes.payload.body.includes("g1.2tb.ai.12months_eft.acq"));
  assert(htmlRes.payload.body.includes("<details "));
  assert(htmlRes.payload.body.includes("ALL IN ONE_V1 (ultra-free-probe)"));
  assert(!/<script\b/i.test(htmlRes.payload.body));

  const jsonWithBodyTag = run("g1-all-in-one-v1.js", {
    url: "https://one.google.com/ai?x=1",
    body: JSON.stringify({ sku: "g1.ios.2tb.ai.a", snippet: "</body>" }),
    storage: probeStorage
  });
  assert.deepEqual(JSON.parse(jsonWithBodyTag.payload.body), {
    sku: "g1.2tb.ai.12months_eft.acq",
    snippet: "</body>"
  });
});

test("ALL IN ONE_V1 Shadowrocket, Loon and Surge modules have valid scoped QUIC rules, headers and 3 script lines", () => {
  const base = "https://raw.githubusercontent.com/DrStrangeVN/google-one-module/main/";
  const v1Files = [
    { file: "g1-all-in-one-v1.sgmodule", type: "shadowrocket" },
    { file: "loon/g1-all-in-one-v1.plugin", type: "loon" },
    { file: "surge/g1-all-in-one-v1.sgmodule", type: "surge" }
  ];
  for (const entry of v1Files) {
    const content = fs.readFileSync(path.join(root, entry.file), "utf8");
    const scripts = content.split("\n").filter(line => line.includes("script-path="));
    assert.equal(scripts.length, 3, entry.file + " must have 3 script entries (web, native, report)");
    for (const script of scripts) {
      const url = script.match(/script-path=([^,\s]+)/)[1];
      assert(url.startsWith(base));
      assert(fs.existsSync(path.join(root, url.slice(base.length))));
    }
    assert.match(content, /one\.google\.com/);
    assert.match(content, /subscriptionsmobile-pa\.googleapis\.com/);
    assert.match(content, /header-del Accept-Encoding/);
    // Ensure global UDP 443 reject is NOT present in any V1 module
    assert(!/^AND,\(\(PROTOCOL,UDP\),\(DEST-PORT,443\)\)/m.test(content));
    if (entry.type === "surge") {
      assert.match(content, /max-size=-1/);
      assert.match(content, /binary-body-mode=false/);
      assert.match(content, /binary-body-mode=true/);
    } else {
      assert.match(content, /DOMAIN,one\.google\.com/);
      assert.match(content, /DOMAIN,subscriptionsmobile-pa\.googleapis\.com/);
      if (entry.type === "loon") {
        assert.match(content, /^AND,\(\(DOMAIN,one\.google\.com\),\(PROTOCOL,UDP\)\),REJECT-DROP$/m);
        assert.match(content, /^AND,\(\(DOMAIN,subscriptionsmobile-pa\.googleapis\.com\),\(PROTOCOL,UDP\)\),REJECT-DROP$/m);
        assert(!content.includes("max-size="));
        assert(content.includes("enable=true"));
      }
    }
  }
});

test("ALL IN ONE_V1 v2.0 hybrid-combo, customRules, custom-only and anti-wipe history", () => {
  // 1. hybrid-combo maps 2TB -> Ultra 1M Free and keeps 20TB/30TB 90p/75p fallback
  const hybridStorage = new Map([[CONFIG_KEY, JSON.stringify({
    schemaVersion: 1, profile: "hybrid-combo", mode: "auto", overlayPanel: false, notify: false
  })]]);
  const hybridRes = run("g1-all-in-one-v1.js", {
    body: JSON.stringify([SOURCE, TWENTY, THIRTY, THIRTY_FALLBACK]),
    storage: hybridStorage
  });
  assert.deepEqual(JSON.parse(hybridRes.payload.body), [
    "g1.ai.ultra.1month_eft.acq",
    TWENTY_TARGET,
    THIRTY_FALLBACK,
    THIRTY_FALLBACK
  ]);

  // 2. Anti-wipe: subsequent no-match on /ai? preserves lastSuccess and appends recentRewrites
  const noMatchRes = run("g1-all-in-one-v1.js", {
    url: "https://one.google.com/ai?empty=1",
    body: "no matching sku on this response",
    storage: hybridStorage
  });
  assert.deepEqual(noMatchRes.payload, {});
  const testRec = get(hybridStorage, TEST_KEY);
  assert.equal(testRec.status, "no-match");
  assert.equal(testRec.hitCount, 0);
  assert.equal(testRec.lastSuccess.hitCount, 3);
  assert.equal(testRec.lastSuccess.profile, "hybrid-combo");
  assert.equal(testRec.lastSuccess.matchedFrom.length, 3);
  assert.equal(testRec.recentRewrites.length, 2);
  assert.deepEqual(testRec.recentRewrites.map(r => r.status), ["rewritten", "no-match"]);

  // 3. customRules override profile & custom-only ignores unlisted SKUs
  const customStorage = new Map([[CONFIG_KEY, JSON.stringify({
    schemaVersion: 1,
    profile: "custom-only",
    mode: "auto",
    overlayPanel: false,
    notify: false,
    customRules: [{ from: "g1.ios.100gb.m", to: "g1.ai.ultra.12months_eft.acq" }]
  })]]);
  const customRes = run("g1-all-in-one-v1.js", {
    body: JSON.stringify(["g1.ios.100gb.m", SOURCE, TWENTY]),
    storage: customStorage
  });
  assert.deepEqual(JSON.parse(customRes.payload.body), [
    "g1.ai.ultra.12months_eft.acq",
    SOURCE,
    TWENTY
  ]);
});

test("ALL IN ONE_V1 v2.0 Studio actions (custom rules, theme, overlay toggle, import-cfg) & Liquid Glass CSP invariants", () => {
  const storage = new Map();
  run("g1-sku-report-v1.js", {
    url: REPORT + "?action=add-rule&from=g1.ios.100gb.m&to=g1.ai.ultra.1month_eft.acq",
    storage
  });
  assert.deepEqual(get(storage, CONFIG_KEY).customRules, [
    { from: "g1.ios.100gb.m", to: "g1.ai.ultra.1month_eft.acq", match: "exact", enabled: true }
  ]);

  const badRule = run("g1-sku-report-v1.js", {
    url: REPORT + "?action=add-rule&from=invalid&to=%3Cscript%3Exss%3C/script%3E",
    storage
  });
  assert.equal(get(storage, CONFIG_KEY).customRules.length, 1);
  assert(!badRule.payload.response.body.includes("<script>xss"));

  run("g1-sku-report-v1.js", {
    url: REPORT + "?action=del-rule&from=g1.ios.100gb.m",
    storage
  });
  assert.deepEqual(get(storage, CONFIG_KEY).customRules, []);

  run("g1-sku-report-v1.js", { url: REPORT + "?action=theme&theme=light", storage });
  assert.equal(get(storage, CONFIG_KEY).theme, "light");

  run("g1-sku-report-v1.js", { url: REPORT + "?action=toggle-overlay", storage });
  assert.equal(get(storage, CONFIG_KEY).overlayPanel, false);

  const importJson = JSON.stringify({
    schemaVersion: 1,
    profile: "hybrid-combo",
    theme: "dark",
    strictCatalog: true,
    untrustedField: "drop-me",
    customRules: [{ from: "g1.ios.30gb.m", to: "g1.2tb.ai.12months_eft.acq" }]
  });
  run("g1-sku-report-v1.js", {
    url: REPORT + "?action=import-cfg&cfg=" + encodeURIComponent(importJson),
    storage
  });
  const importedCfg = get(storage, CONFIG_KEY);
  assert.equal(importedCfg.profile, "hybrid-combo");
  assert.equal(importedCfg.theme, "dark");
  assert.equal(importedCfg.strictCatalog, true);
  assert.equal(importedCfg.untrustedField, undefined);
  assert.equal(importedCfg.customRules.length, 1);

  run("g1-all-in-one-v1.js", { body: JSON.stringify([SOURCE, TWENTY, TWENTY_TARGET]), storage });
  const studioHtml = run("g1-sku-report-v1.js", { url: REPORT, storage }).payload.response.body;
  assert(studioHtml.includes("aio-v2.8"));
  assert(studioHtml.includes("Kho SKU Cộng Đồng (32 mã chuẩn"));
  assert(studioHtml.includes("Top 5 Gói 1 Chạm cho iPhone"));
  assert(studioHtml.includes("g1.2tb.ai.15months_eft"));
  assert(studioHtml.includes("g1.20tb.3months_ip_80p"));
  assert(studioHtml.includes("g1.helium.12months_ip_90p"));
  assert(studioHtml.includes("g1.ai.pro.12months_eft"));
  assert(studioHtml.includes("g1.ios.ai.2tb.m.ip_3mo_75p.acq"));
  assert(studioHtml.includes("g1.10tb.1month_ip_90p"));
  assert(studioHtml.includes("com.google.gemini.2tb.ai.m.3month_ip_99p"));
  assert(studioHtml.includes("g1.ios.30tb.m"));
  assert(studioHtml.includes("Map nút 30TB"));
  assert(studioHtml.includes("Purchase not completed"));
  assert(studioHtml.includes("Ultra 75p cố định (v7.8)"));
  assert(studioHtml.includes("NotebookLM"));
  assert(!studioHtml.includes("linear-gradient"));
  assert(!studioHtml.includes("radial-gradient"));
  assert(!/<(?:script|img|iframe)\b/i.test(studioHtml));

  const jsonOut = JSON.parse(run("g1-sku-report-v1.js", { url: REPORT + "?format=json", storage }).payload.response.body);
  assert.equal(jsonOut.reportVersion, "aio-v2.8");
  assert.equal(jsonOut.test.lastSuccess.hitCount, 2);
  assert.equal(jsonOut.test.recentRewrites.length, 1);
});

test("ALL IN ONE_V1 v2.5 supports com.google.gemini.* namespace, Pro 3M 99p preset, and Longest-Prefix-Wins", () => {
  const GEMINI_SRC = "com.google.gemini.2tb.ai.m";
  const GEMINI_99P = "com.google.gemini.2tb.ai.m.3month_ip_99p";

  // 1. Choosing Pro 3T 99% preset collects and rewrites both com.google.gemini.2tb.* and g1.ios.2tb.*
  const gStorage = new Map();
  run("g1-sku-report-v1.js", {
    url: REPORT + "?action=preset&target2tb=" + encodeURIComponent(GEMINI_99P),
    storage: gStorage
  });
  assert.equal(get(gStorage, CONFIG_KEY).target2tb, GEMINI_99P);
  const gRes = run("g1-all-in-one-v1.js", {
    body: JSON.stringify([GEMINI_SRC, SOURCE]),
    storage: gStorage
  });
  assert.deepEqual(JSON.parse(gRes.payload.body), [GEMINI_99P, GEMINI_99P]);
  const gScan = get(gStorage, SCAN_KEY);
  assert(gScan.skus.some(s => s.id === GEMINI_SRC));

  const gHtml = run("g1-sku-report-v1.js", { url: REPORT + "?tab=scanned", storage: gStorage }).payload.response.body;
  assert(gHtml.includes('<span class="st-pill st-ok">Gemini</span>'));
  assert(!gHtml.includes("linear-gradient"));
  assert(!/<(?:script|img|iframe)\b/i.test(gHtml));

  // 2. Longest-Prefix-Wins: add longer rule first or shorter rule first -> longer prefix always wins
  const lpStorage = new Map();
  run("g1-sku-report-v1.js", {
    url: REPORT + "?action=profile&profile=custom-only",
    storage: lpStorage
  });
  run("g1-sku-report-v1.js", {
    url: REPORT + "?action=add-rule&match=prefix&fromCustom=g1.ios.&to=g1.2tb.ai.annual",
    storage: lpStorage
  });
  run("g1-sku-report-v1.js", {
    url: REPORT + "?action=add-rule&match=prefix&fromCustom=g1.ios.ai.2tb.&to=" + encodeURIComponent(GEMINI_99P),
    storage: lpStorage
  });
  const lpRes = run("g1-all-in-one-v1.js", {
    body: JSON.stringify(["g1.ios.100gb.m", "g1.ios.ai.2tb.m.ip_1mo_90p.acq"]),
    storage: lpStorage
  });
  assert.deepEqual(JSON.parse(lpRes.payload.body), ["g1.2tb.ai.annual", GEMINI_99P]);
});

test("ALL IN ONE_V1 v2.4 supports ultra-75p profile, Prefix/Exact toggleable Custom Rules, prefillFrom & Scanned badges", () => {
  const AI_2TB = "g1.ios.ai.2tb.m.ip_1mo_90p.acq";
  // 1. ultra-75p maps 20TB/30TB directly to 75p (no fallback even when 90p tokens exist)
  const v78Storage = new Map([[CONFIG_KEY, JSON.stringify({
    schemaVersion: 1, profile: "ultra-75p", mode: "auto", overlayPanel: false, notify: false
  })]]);
  const v78Res = run("g1-all-in-one-v1.js", {
    body: JSON.stringify([AI_2TB, TWENTY, THIRTY, TWENTY_TARGET, THIRTY_TARGET]),
    storage: v78Storage
  });
  assert.deepEqual(JSON.parse(v78Res.payload.body).slice(0, 3), [TARGET, TWENTY_FALLBACK, THIRTY_FALLBACK]);
  assert.equal(get(v78Storage, TEST_KEY).matchedFrom.every(row => row.fallback === false), true);

  // 2. Custom Rules: prefix + exact precedence + toggle-rule
  const crStorage = new Map();
  run("g1-sku-report-v1.js", {
    url: REPORT + "?action=profile&profile=custom-only",
    storage: crStorage
  });
  run("g1-sku-report-v1.js", {
    url: REPORT + "?action=add-rule&match=prefix&fromCustom=g1.ios.ai.2tb.&to=g1.2tb.ai.2months_ip_50p",
    storage: crStorage
  });
  run("g1-sku-report-v1.js", {
    url: REPORT + "?action=add-rule&match=exact&fromCustom=" + encodeURIComponent(AI_2TB) + "&to=g1.ai.ultra.3months_ip_75p.acq",
    storage: crStorage
  });
  const crResBoth = run("g1-all-in-one-v1.js", {
    body: JSON.stringify([AI_2TB, "g1.ios.ai.2tb.a.ip_1yr_10p.acq"]),
    storage: crStorage
  });
  assert.deepEqual(JSON.parse(crResBoth.payload.body), [
    "g1.ai.ultra.3months_ip_75p.acq",
    "g1.2tb.ai.2months_ip_50p"
  ]);

  // Toggle exact rule OFF -> falls back to enabled prefix rule
  run("g1-sku-report-v1.js", {
    url: REPORT + "?action=toggle-rule&match=exact&from=" + encodeURIComponent(AI_2TB),
    storage: crStorage
  });
  const toggledRule = get(crStorage, CONFIG_KEY).customRules.find(r => r.from === AI_2TB);
  assert.equal(toggledRule.enabled, false);
  const crResAfterToggle = run("g1-all-in-one-v1.js", {
    body: JSON.stringify([AI_2TB]),
    storage: crStorage
  });
  assert.deepEqual(JSON.parse(crResAfterToggle.payload.body), ["g1.2tb.ai.2months_ip_50p"]);

  // 3. prefillFrom + Scanned badges (AI 2TB badge + Map rule này button)
  const prefillHtml = run("g1-sku-report-v1.js", {
    url: REPORT + "?prefillFrom=" + encodeURIComponent(AI_2TB) + "&tab=studio",
    storage: v78Storage
  }).payload.response.body;
  assert(prefillHtml.includes('value="' + AI_2TB + '"'));
  assert(prefillHtml.includes("AI 2TB"));
  assert(prefillHtml.includes("Map rule này"));
  assert(prefillHtml.includes("prefillFrom=" + encodeURIComponent(AI_2TB)));
});

test("ALL IN ONE_V1 v2.3 supports v7.6-eft profile, g1.ios.ai.2tb.* prefix, safe v2.0 headers, and safe customRules override", () => {
  const AI_2TB = "g1.ios.ai.2tb.m.ip_1mo_90p.acq";
  const storage = new Map([[CONFIG_KEY, JSON.stringify({
    schemaVersion: 1, profile: "v7.6-eft", mode: "auto", overlayPanel: true, notify: false
  })]]);
  const resPrimary = run("g1-all-in-one-v1.js", {
    body: JSON.stringify([AI_2TB, TWENTY, THIRTY]),
    storage
  });
  assert.deepEqual(JSON.parse(resPrimary.payload.body), [TARGET, V76_TWENTY_TARGET, V76_THIRTY_TARGET]);

  const resFallback = run("g1-all-in-one-v1.js", {
    body: "<html><body>" + JSON.stringify([AI_2TB, TWENTY, THIRTY, TWENTY_TARGET, THIRTY_TARGET]) + "</body></html>",
    storage
  });
  assert(resFallback.payload.body.includes("· FB</span>"));
  assert(!resFallback.payload.body.includes("· 75p</span>"));

  // Verify g1.ios.ai.2tb.* also works under hybrid-combo
  storage.set(CONFIG_KEY, JSON.stringify({
    schemaVersion: 1, profile: "hybrid-combo", mode: "auto", overlayPanel: false, notify: false
  }));
  const hybridAi2tb = run("g1-all-in-one-v1.js", {
    body: JSON.stringify([AI_2TB]),
    storage
  });
  assert.deepEqual(JSON.parse(hybridAi2tb.payload.body), [V76_THIRTY_TARGET]);

  // Verify safe v2.0 headers in Shadowrocket, Surge, and Loon V1 modules (no Cache-Control/ETag/Last-Modified or narrowed prefix)
  for (const modFile of ["g1-all-in-one-v1.sgmodule", "surge/g1-all-in-one-v1.sgmodule"]) {
    const content = fs.readFileSync(path.join(root, modFile), "utf8");
    assert(content.includes("http-request ^https:\\/\\/one\\.google\\.com\\/ header-del Accept-Encoding"));
    assert(content.includes("http-response ^https:\\/\\/one\\.google\\.com\\/ header-del Alt-Svc"));
    assert(!content.includes("Cache-Control"));
    assert(!content.includes("ETag"));
    assert(!content.includes("Last-Modified"));
    assert(!content.includes("(?:ai|upsell|plans|storage)"));
  }
  const loonContent = fs.readFileSync(path.join(root, "loon/g1-all-in-one-v1.plugin"), "utf8");
  assert(loonContent.includes("^https:\\/\\/one\\.google\\.com\\/ header-del Accept-Encoding"));
  assert(!loonContent.includes("Cache-Control"));
  assert(!loonContent.includes("(?:ai|upsell|plans|storage)"));

  // Regression: stale customRules must NOT hijack other profiles (like ultra-1m-free) by default
  const ruleStorage = new Map();
  run("g1-sku-report-v1.js", {
    url: REPORT + "?action=profile&profile=ultra-1m-free",
    storage: ruleStorage
  });
  run("g1-sku-report-v1.js", {
    url: REPORT + "?action=add-rule&from=g1.ios.20tb.m.v2&to=g1.ai.ultra.12months_eft.acq",
    storage: ruleStorage
  });
  const withoutOverride = run("g1-all-in-one-v1.js", {
    body: JSON.stringify([TWENTY]),
    storage: ruleStorage
  });
  assert.deepEqual(JSON.parse(withoutOverride.payload.body), ["g1.ai.ultra.1month_eft.acq"]);

  // Studio UI shows Clear All button when rules exist
  const htmlWithRule = run("g1-sku-report-v1.js", { url: REPORT, storage: ruleStorage }).payload.response.body;
  assert(htmlWithRule.includes("action=clear-rules"));

  // Enabling crOverride=1 lets customRules override active profile
  run("g1-sku-report-v1.js", {
    url: REPORT + "?action=save&profile=ultra-1m-free&mode=auto&target2tb=" + TARGET + "&scope=ai&native=scan&e2tb=1&e20tb=1&e30tb=1&crOverride=1",
    storage: ruleStorage
  });
  assert.equal(get(ruleStorage, CONFIG_KEY).customRulesOverride, true);
  const withOverride = run("g1-all-in-one-v1.js", {
    body: JSON.stringify([TWENTY]),
    storage: ruleStorage
  });
  assert.deepEqual(JSON.parse(withOverride.payload.body), ["g1.ai.ultra.12months_eft.acq"]);

  // 1-tap clear-rules wipes stale rules and hides the Clear All button
  run("g1-sku-report-v1.js", {
    url: REPORT + "?action=clear-rules&tab=studio",
    storage: ruleStorage
  });
  assert.deepEqual(get(ruleStorage, CONFIG_KEY).customRules, []);
  const htmlCleared = run("g1-sku-report-v1.js", { url: REPORT, storage: ruleStorage }).payload.response.body;
  assert(!htmlCleared.includes("action=clear-rules"));
});

test("ALL IN ONE_V1 v2.6 provides Top 5 1-tap iPhone quick packs and /u/0/* extended Web scope", () => {
  const GEMINI_SRC = "com.google.gemini.2tb.ai.m";
  const GEMINI_99P = "com.google.gemini.2tb.ai.m.3month_ip_99p";
  const storage = new Map([[CONFIG_KEY, JSON.stringify({
    schemaVersion: 1,
    theme: "light",
    customRules: [{ from: "g1.ios.100gb.m", to: "g1.2tb.ai.annual", match: "exact", enabled: true }]
  })]]);

  // 1. 1-tap quick pack #2 (Gemini 99% 3M) configures profile, extended scope, native rewrite & preserves theme/customRules
  const pack2Res = run("g1-sku-report-v1.js", {
    url: REPORT + "?action=quick&pack=iphone-2-gemini-99p&tab=studio",
    storage
  });
  const cfg2 = get(storage, CONFIG_KEY);
  assert.equal(cfg2.profile, "promo-90p");
  assert.equal(cfg2.target2tb, GEMINI_99P);
  assert.equal(cfg2.rewriteScope, "extended");
  assert.equal(cfg2.nativeMode, "rewrite");
  assert.equal(cfg2.customRulesOverride, false);
  assert.equal(cfg2.notify, true);
  assert.equal(cfg2.theme, "light");
  assert.equal(cfg2.customRules.length, 1);

  const htmlPack2 = pack2Res.payload.response.body;
  assert(htmlPack2.includes("Top 5 Gói 1 Chạm cho iPhone"));
  assert(htmlPack2.includes("App Gemini (iOS)"));
  assert(htmlPack2.includes("Google App (chữ G)"));
  assert(!htmlPack2.includes("linear-gradient"));
  assert(!htmlPack2.includes("radial-gradient"));
  assert(!/<(?:script|img|iframe)\b/i.test(htmlPack2));

  // Verify /u/0/ai? works under extended scope enabled by pack #2
  const u0Res = run("g1-all-in-one-v1.js", {
    url: "https://one.google.com/u/0/ai?x=1",
    body: JSON.stringify([GEMINI_SRC]),
    storage
  });
  assert.deepEqual(JSON.parse(u0Res.payload.body), [GEMINI_99P]);

  // 2. Pack #1 & #4 + invalid pack error check
  run("g1-sku-report-v1.js", {
    url: REPORT + "?action=quick&pack=iphone-1-ultra-1m&tab=studio",
    storage
  });
  assert.equal(get(storage, CONFIG_KEY).profile, "ultra-1m-free");
  assert.equal(get(storage, CONFIG_KEY).rewriteScope, "ai");

  run("g1-sku-report-v1.js", {
    url: REPORT + "?action=quick&pack=iphone-4-ultra-75p&tab=studio",
    storage
  });
  assert.equal(get(storage, CONFIG_KEY).profile, "ultra-75p");

  const badPack = run("g1-sku-report-v1.js", {
    url: REPORT + "?action=quick&pack=nonexistent-pack",
    storage
  }).payload.response.body;
  assert(badPack.includes("Gói 1 chạm không hợp lệ"));
  assert.equal(get(storage, CONFIG_KEY).profile, "ultra-75p");
});

test("ALL IN ONE_V1 v2.8 guards HUD strictly to 200 text/html and uses safe meta-refresh reload", () => {
  const storage = new Map();
  const redirectStub = "<HTML><HEAD><TITLE>302 Moved</TITLE></HEAD><BODY><H1>302 Moved</H1></BODY></HTML>";

  // 1. Regression guard: 302/404 redirects and Location headers must NEVER be mutated on any plan route
  for (const redirUrl of [
    "https://one.google.com/ai?x=1",
    "https://one.google.com/u/0/ai?x=1",
    "https://one.google.com/upsell",
    "https://one.google.com/plans"
  ]) {
    const res302 = run("g1-all-in-one-v1.js", {
      url: redirUrl,
      body: redirectStub,
      responseStatus: 302,
      responseHeaders: { "content-type": "text/html; charset=UTF-8", location: "https://accounts.google.com/" },
      storage
    });
    assert.deepEqual(res302.payload, {});
  }
  const resStr302 = run("g1-all-in-one-v1.js", {
    url: "https://one.google.com/ai?x=1",
    body: "<html><body>redirect</body></html>",
    responseStatus: "HTTP/1.1 302 Found",
    responseHeaders: { "content-type": "text/html" },
    storage
  });
  assert.deepEqual(resStr302.payload, {});
  const res404 = run("g1-all-in-one-v1.js", {
    url: "https://one.google.com/plans",
    body: "<html><body>Not Found</body></html>",
    responseStatus: 404,
    responseHeaders: { "content-type": "text/html" },
    storage
  });
  assert.deepEqual(res404.payload, {});

  // 2. Regression guard: non-HTML Content-Type must NEVER be mutated even if body contains <html><body>
  for (const ct of ["application/javascript; charset=utf-8", "application/json", "text/plain"]) {
    const nonHtml = run("g1-all-in-one-v1.js", {
      url: "https://one.google.com/ai?x=1",
      body: "<html><body>fake</body></html>",
      responseStatus: 200,
      responseHeaders: { "content-type": ct },
      storage
    });
    assert.deepEqual(nonHtml.payload, {});
  }

  // 3. Valid 200 text/html plan page injects lightweight 5-pack HUD with clean back URL and &amp; escaped links
  const html0 = "<!doctype html><html><body><div>No SKU here</div></body></html>";
  const res0 = run("g1-all-in-one-v1.js", {
    url: "https://one.google.com/ai?hl=vi",
    body: html0,
    responseStatus: 200,
    responseHeaders: { "content-type": "text/html; charset=utf-8" },
    storage
  });
  assert(res0.payload.body.includes('data-g1-hud="1"'));
  assert(!res0.payload.body.includes("backdrop-filter"));
  assert(!res0.payload.body.includes("linear-gradient"));
  assert(!res0.payload.body.includes("radial-gradient"));
  assert(!/<script\b/i.test(res0.payload.body));
  for (const packId of [
    "iphone-1-ultra-1m",
    "iphone-2-gemini-99p",
    "iphone-3-pro-12m-90p",
    "iphone-4-ultra-75p",
    "iphone-5-hybrid-combo"
  ]) {
    assert(res0.payload.body.includes("action=quick&amp;pack=" + packId));
  }
  assert(res0.payload.body.includes("back=" + encodeURIComponent("https://one.google.com/ai?hl=vi")));
  assert(!res0.payload.body.includes("_g1ts"));

  // scan-only injects HUD on 200 text/html /plans while NOT creating TEST_KEY
  const scanStorage = new Map([[CONFIG_KEY, JSON.stringify({
    schemaVersion: 1, mode: "scan-only", overlayPanel: true, notify: false
  })]]);
  const scanHtmlRes = run("g1-all-in-one-v1.js", {
    url: "https://one.google.com/plans?x=1",
    body: "<html><body><div>Plans</div></body></html>",
    responseStatus: 200,
    responseHeaders: { "content-type": "text/html" },
    storage: scanStorage
  });
  assert(scanHtmlRes.payload.body.includes('data-g1-hud="1"'));
  assert.equal(scanStorage.has(TEST_KEY), false);

  // Non-matching scope 200 text/html plan page (/plans while scope=ai) injects HUD without touching TEST_KEY
  const aiScopeStorage = new Map([[CONFIG_KEY, JSON.stringify({
    schemaVersion: 1, mode: "auto", rewriteScope: "ai", overlayPanel: true, notify: false
  })]]);
  const plansOutOfScope = run("g1-all-in-one-v1.js", {
    url: "https://one.google.com/plans",
    body: "<html><body>Plans</body></html>",
    responseStatus: 200,
    responseHeaders: { "content-type": "text/html" },
    storage: aiScopeStorage
  });
  assert(plansOutOfScope.payload.body.includes('data-g1-hud="1"'));
  assert.equal(aiScopeStorage.has(TEST_KEY), false);

  // 4. Pack #1 returns 200 text/html with <meta http-equiv="refresh" ...> back to clean Google One URL
  const backUrl = "https://one.google.com/ai?hl=vi";
  const bounceRes1 = run("g1-sku-report-v1.js", {
    url: REPORT + "?action=quick&pack=iphone-1-ultra-1m&back=" + encodeURIComponent(backUrl),
    storage
  });
  assert.equal(bounceRes1.payload.response.status, 200);
  assert.equal(bounceRes1.payload.response.headers.Location, undefined);
  assert(bounceRes1.payload.response.body.includes('<meta http-equiv="refresh" content="0;url=https://one.google.com/ai?hl=vi">'));
  assert(!bounceRes1.payload.response.body.includes("_g1ts"));
  assert(!/<script\b/i.test(bounceRes1.payload.response.body));
  assert.equal(get(storage, CONFIG_KEY).profile, "ultra-1m-free");

  // 5. Pack #2 returns 200 confirmation card mentioning App Gemini (iOS) WITHOUT meta-refresh
  const confirmPack2 = run("g1-sku-report-v1.js", {
    url: REPORT + "?action=quick&pack=iphone-2-gemini-99p&back=" + encodeURIComponent(backUrl),
    storage
  });
  assert.equal(confirmPack2.payload.response.status, 200);
  assert(!confirmPack2.payload.response.body.includes("http-equiv=\"refresh\""));
  assert(confirmPack2.payload.response.body.includes("App Gemini (iOS)"));
  assert(confirmPack2.payload.response.body.includes('href="https://one.google.com/ai?hl=vi"'));
  assert.equal(get(storage, CONFIG_KEY).target2tb, "com.google.gemini.2tb.ai.m.3month_ip_99p");
  assert.equal(get(storage, CONFIG_KEY).rewriteScope, "extended");
  assert.equal(get(storage, CONFIG_KEY).nativeMode, "rewrite");

  // When Pack #2 is active, HUD shows App Gemini reminder
  const hudPack2 = run("g1-all-in-one-v1.js", {
    url: "https://one.google.com/ai?hl=vi",
    body: "<html><body><div>AI</div></body></html>",
    responseStatus: 200,
    responseHeaders: { "content-type": "text/html" },
    storage
  });
  assert(hudPack2.payload.body.includes("App Gemini (iOS)"));

  // 6. toggle-overlay with valid back returns 200 meta-refresh and flips overlayPanel
  const togBounce = run("g1-sku-report-v1.js", {
    url: REPORT + "?action=toggle-overlay&back=" + encodeURIComponent("https://one.google.com/plans"),
    storage
  });
  assert.equal(togBounce.payload.response.status, 200);
  assert(togBounce.payload.response.body.includes('<meta http-equiv="refresh" content="0;url=https://one.google.com/plans">'));
  assert.equal(get(storage, CONFIG_KEY).overlayPanel, false);

  // 7. Malicious / off-origin / loop / CRLF back URLs NEVER emit meta-refresh
  for (const badBack of [
    "https://evil.test/",
    "https://one.google.com.evil/ai",
    "javascript:alert(1)",
    "https://one.google.com/g1-sku-report",
    "https://one.google.com/ai\r\nX-Inject: 1"
  ]) {
    const safeRes = run("g1-sku-report-v1.js", {
      url: REPORT + "?action=quick&pack=iphone-1-ultra-1m&back=" + encodeURIComponent(badBack),
      storage
    });
    assert.equal(safeRes.payload.response.status, 200);
    assert.equal(safeRes.payload.response.headers.Location, undefined);
    assert(!safeRes.payload.response.body.includes('http-equiv="refresh"'));
  }
});
