/* Passive product-ID collection with v7.5 diagnostics for Shadowrocket & Loon; original responses pass through. */
"use strict";

(function () {
  var VERSION = "g1-sku-scan-v7.5";
  var STORE_KEY = "g1.sku.scan.v1";
  var LIMIT = 300;
  var RECENT_LIMIT = 10;
  var MAX_EVENT_COUNT = 9007199254740991;
  var OTHER_PATH = "[Đường dẫn one.google.com khác]";
  var LEGACY_OTHER_PATH = "[其他 one.google.com 路径]";
  var url = typeof $request === "object" && $request ? $request.url : "";
  var body = typeof $response === "object" && $response ? $response.body : undefined;

  if (typeof url !== "string" || !/^https:\/\/one\.google\.com\//.test(url) ||
      /^https:\/\/one\.google\.com\/g1-sku-report\/?(?:\?|$)/.test(url)) {
    $done({});
    return;
  }

  var now = new Date().toISOString();
  var saved = {};
  try {
    if (typeof $persistentStore !== "undefined" && typeof $persistentStore.read === "function") {
      saved = JSON.parse($persistentStore.read(STORE_KEY) || "{}");
    }
  } catch (error) {
    saved = {};
  }
  if (!saved || saved.schemaVersion !== 1) saved = {};

  var byId = Object.create(null);
  var ids = [];
  var validId = /^(?:g1\.|com\.google\.one\.)[A-Za-z0-9._-]{1,160}$/;
  var oldRows = Array.isArray(saved.skus) ? saved.skus : [];
  oldRows.slice(0, LIMIT).forEach(function (row) {
    if (!row || typeof row.id !== "string" || !validId.test(row.id) || byId[row.id]) return;
    var count = Number(row.count);
    byId[row.id] = {
      id: row.id,
      count: isFinite(count) && count > 0 ? Math.floor(count) : 0,
      lastSeen: typeof row.lastSeen === "string" ? row.lastSeen.slice(0, 32) : ""
    };
    ids.push(row.id);
  });

  var isText = typeof body === "string";
  var found = Object.create(null);
  var hitCount = 0;
  var addedCount = 0;
  var omittedCount = 0;
  var truncated = saved.truncated === true;
  if (isText) {
    // Decode escaped dots for discovery only. The response body is kept intact.
    var text = body.replace(/\\u002e|\\x2e|&#0*46;|&#x0*2e;|&period;/gi, ".");
    var token = /(^|[^A-Za-z0-9._@%-])((?:g1\.|com\.google\.one\.)[A-Za-z0-9._-]+)(?=$|[^A-Za-z0-9._-])/g;
    var match;
    while ((match = token.exec(text)) !== null) {
      var id = match[2];
      if (!validId.test(id)) continue;
      found[id] = (found[id] || 0) + 1;
      hitCount += 1;
      if (!byId[id]) {
        if (ids.length >= LIMIT) {
          truncated = true;
          if (found[id] === 1) omittedCount += 1;
          continue;
        }
        byId[id] = { id: id, count: 0, lastSeen: now };
        ids.push(id);
        addedCount += 1;
      }
      byId[id].count += 1;
      byId[id].lastSeen = now;
    }
  }

  var candidateCount = Object.keys(found).length;
  var bodyType = isText ? "text" : "non-text";
  var status = responseStatus(bodyType, candidateCount, addedCount, omittedCount);
  var recentResponses = [];
  var oldResponses = Array.isArray(saved.recentResponses) ? saved.recentResponses : [];
  oldResponses.slice(-RECENT_LIMIT).forEach(function (row) {
    var event = priorResponse(row);
    if (event) recentResponses.push(event);
  });
  recentResponses.push({
    at: now,
    path: safeRoute(url),
    bodyType: bodyType,
    status: status,
    candidateCount: candidateCount,
    addedCount: addedCount,
    omittedCount: omittedCount
  });

  function priorCount(value) {
    var number = Number(value);
    return isFinite(number) && number > 0 ? Math.floor(number) : 0;
  }
  var state = {
    schemaVersion: 1,
    version: VERSION,
    updatedAt: now,
    scannedResponses: priorCount(saved.scannedResponses) + (isText ? 1 : 0),
    matchedResponses: priorCount(saved.matchedResponses) + (hitCount > 0 ? 1 : 0),
    nonTextResponses: priorCount(saved.nonTextResponses) + (isText ? 0 : 1),
    recentResponses: recentResponses.slice(-RECENT_LIMIT),
    limit: LIMIT,
    truncated: truncated,
    skus: ids.sort().map(function (id) { return byId[id]; })
  };
  var stored = false;
  try {
    if (typeof $persistentStore !== "undefined" && typeof $persistentStore.write === "function") {
      stored = $persistentStore.write(JSON.stringify(state), STORE_KEY);
    }
  } catch (error) {
    stored = false;
  }

  console.log("[g1-sku-scan] " + VERSION + " status=" + status + " addedCount=" + addedCount +
    " candidates=" + candidateCount + " omittedCount=" + omittedCount +
    " occurrences=" + hitCount + " saved=" + (stored ? "yes" : "no"));
  Object.keys(found).sort().slice(0, LIMIT).forEach(function (id) {
    console.log("[g1-sku-scan] " + id + " x" + found[id]);
  });
  $done({});

  function safeRoute(requestUrl) {
    var path = requestUrl.replace(/^https:\/\/one\.google\.com/, "").split(/[?#]/)[0];
    path = path.replace(/\/+$/, "") || "/";
    if (path === "/" || path === "/ai" || path === "/plans") return path;
    if (/^\/_\/[^?#]+\/data\/batchexecute$/.test(path)) return "/_/…/data/batchexecute";
    return OTHER_PATH;
  }

  function responseStatus(bodyTypeValue, candidates, added, omitted) {
    if (bodyTypeValue === "non-text") return "non-text";
    if (added > 0) return "new-skus";
    if (omitted > 0) return "limit-reached";
    return candidates > 0 ? "known-skus" : "no-skus";
  }

  function priorResponse(row) {
    if (!row || typeof row !== "object" || Array.isArray(row)) return null;
    if (typeof row.at !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(row.at) ||
        !isFinite(Date.parse(row.at)) || new Date(row.at).toISOString() !== row.at) return null;
    var path = row.path === LEGACY_OTHER_PATH ? OTHER_PATH : row.path;
    if (path !== "/" && path !== "/ai" && path !== "/plans" &&
        path !== "/_/…/data/batchexecute" && path !== OTHER_PATH) return null;
    if (row.bodyType !== "text" && row.bodyType !== "non-text") return null;

    function counter(value, maximum) {
      if (typeof value !== "number" || !isFinite(value)) return null;
      return Math.max(0, Math.min(maximum, Math.floor(value)));
    }
    var candidates = counter(row.candidateCount, MAX_EVENT_COUNT);
    if (candidates === null) return null;
    var added = counter(row.addedCount, Math.min(LIMIT, candidates));
    if (added === null) return null;
    var omitted = counter(row.omittedCount, candidates - added);
    if (omitted === null) return null;
    if (row.bodyType === "non-text" && (candidates || added || omitted)) return null;
    if (row.status !== responseStatus(row.bodyType, candidates, added, omitted)) return null;
    return {
      at: row.at,
      path: path,
      bodyType: row.bodyType,
      status: row.status,
      candidateCount: candidates,
      addedCount: added,
      omittedCount: omitted
    };
  }
})();
