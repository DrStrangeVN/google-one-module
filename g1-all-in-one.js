/* Google One All-in-One: combined passive scanner, configurable 3-tier rewriter & iOS notifier for Shadowrocket & Loon. */
"use strict";

(function () {
  var VERSION = "g1-aio-v7.5";
  var SOURCE_PREFIX = "g1.ios.2tb.";
  var DEFAULT_TARGET = "g1.2tb.ai.12months_ip_90p";
  var SKU_MAP = {
    "g1.ios.20tb.m.v2": "g1.20tb.3months_ip_90p.acq",
    "g1.ios.30tb.ai.pro.m": "g1.ai.ultra.3months_ip_90p.acq"
  };
  var FALLBACK = {
    "g1.20tb.3months_ip_90p.acq": "g1.20tb.3months_ip_75p.acq",
    "g1.ai.ultra.3months_ip_90p.acq": "g1.ai.ultra.3months_ip_75p.acq"
  };
  var CONFIG_KEY = "g1.config.v1";
  var TEST_KEY = "g1.pro.annual.test.v1";
  var SCAN_KEY = "g1.sku.scan.v1";
  var SCAN_LIMIT = 300;
  var RECENT_LIMIT = 10;
  var MAX_EVENT_COUNT = 9007199254740991;
  var OTHER_PATH = "[Đường dẫn one.google.com khác]";
  var LEGACY_OTHER_PATH = "[其他 one.google.com 路径]";
  var url = typeof $request === "object" && $request ? $request.url : "";

  if (typeof url !== "string" || !/^https:\/\/one\.google\.com\//.test(url) ||
      /^https:\/\/one\.google\.com\/g1-sku-report\/?(?:\?|$)/.test(url)) {
    $done({});
    return;
  }

  var config = loadConfig();
  var body = typeof $response === "object" && $response ? $response.body : undefined;
  var scanResult = { addedCount: 0, candidateCount: 0 };

  if (config.mode !== "rewrite-only") {
    try {
      scanResult = collectOriginalSkus(body);
    } catch (error) {
      console.log("[g1-aio] SKU collection unavailable");
    }
  }

  if (config.mode === "scan-only") {
    if (config.notify && scanResult.addedCount > 0) {
      notifyUser(
        "G1 All-in-One",
        "Phát hiện +" + scanResult.addedCount + " SKU mới",
        "Mở one.google.com/g1-sku-report để xem"
      );
    }
    $done({});
    return;
  }

  var rewritePattern = config.rewriteScope === "extended"
    ? /^https:\/\/one\.google\.com\/(?:ai\?|plans(?:[/?]|$)|_\/[^?#]+\/data\/batchexecute)/
    : /^https:\/\/one\.google\.com\/ai\?/;

  if (!rewritePattern.test(url)) {
    if (config.notify && scanResult.addedCount > 0) {
      notifyUser(
        "G1 All-in-One",
        "Phát hiện +" + scanResult.addedCount + " SKU mới",
        "Mở one.google.com/g1-sku-report để xem"
      );
    }
    $done({});
    return;
  }

  var mappings = Object.create(null);
  var hits = 0;
  var annualHits = 0;
  var out = body;

  if (typeof body === "string") {
    var observed = body.match(/g1\.[a-z0-9._]{2,60}acq/g) || [];
    out = body.replace(
      /(^|[^A-Za-z0-9._@%-])(g1\.[A-Za-z0-9._-]+)(?=$|[^A-Za-z0-9._-])/g,
      function (match, before, id) {
        var isAnnual = id.indexOf(SOURCE_PREFIX) === 0 && id.length > SOURCE_PREFIX.length;
        var to;
        var fallback = false;
        if (isAnnual) {
          if (!config.enable2tb) return match;
          to = config.target2tb;
        } else if (id === "g1.ios.20tb.m.v2") {
          if (!config.enable20tb) return match;
          to = SKU_MAP[id];
          if (observed.indexOf(to) === -1 && FALLBACK[to] && observed.indexOf(FALLBACK[to]) !== -1) {
            to = FALLBACK[to];
            fallback = true;
          }
        } else if (id === "g1.ios.30tb.ai.pro.m") {
          if (!config.enable30tb) return match;
          to = SKU_MAP[id];
          if (observed.indexOf(to) === -1 && FALLBACK[to] && observed.indexOf(FALLBACK[to]) !== -1) {
            to = FALLBACK[to];
            fallback = true;
          }
        } else {
          return match;
        }
        if (!mappings[id]) mappings[id] = { id: id, to: to, count: 0, fallback: fallback };
        mappings[id].count += 1;
        hits += 1;
        if (isAnnual) annualHits += 1;
        return before + to;
      }
    );
  }

  var sources = Object.keys(mappings).sort().map(function (id) {
    return mappings[id];
  });
  var record = {
    schemaVersion: 1,
    version: VERSION,
    updatedAt: new Date().toISOString(),
    sourcePrefix: SOURCE_PREFIX,
    target: config.target2tb,
    targetOrigin: config.target2tb === DEFAULT_TARGET ? "user-specified" : "custom",
    hitCount: hits,
    annualHitCount: annualHits,
    matchedFrom: sources,
    status: typeof body !== "string" ? "non-text" : hits ? "rewritten" : "no-match"
  };

  try {
    if (typeof $persistentStore !== "undefined" &&
        typeof $persistentStore.write === "function") {
      if (!$persistentStore.write(JSON.stringify(record), TEST_KEY)) {
        console.log("[g1-aio] local record write failed");
      }
    }
  } catch (error) {
    console.log("[g1-aio] local record unavailable");
  }

  console.log("[g1-aio] " + VERSION + " mode=" + config.mode + " scope=" + config.rewriteScope +
    " hits=" + hits + " annualHits=" + annualHits);
  sources.forEach(function (source) {
    console.log("[g1-aio] " + source.id + " -> " + source.to + " x" + source.count +
      (source.fallback ? " fallback=75p" : ""));
  });

  if (config.notify) {
    if (hits > 0) {
      var summary = sources.map(function (source) {
        return source.id + " -> " + source.to + " (x" + source.count + ")";
      }).join("; ");
      notifyUser(
        "G1 All-in-One",
        "Đã ghi đè " + hits + " SKU (2TB: " + annualHits + ")",
        summary
      );
    } else if (scanResult.addedCount > 0) {
      notifyUser(
        "G1 All-in-One",
        "Phát hiện +" + scanResult.addedCount + " SKU mới",
        "Mở one.google.com/g1-sku-report để xem"
      );
    }
  }

  $done(hits ? { body: out } : {});

  function loadConfig() {
    var defaults = {
      schemaVersion: 1,
      mode: "auto",
      target2tb: DEFAULT_TARGET,
      enable2tb: true,
      enable20tb: true,
      enable30tb: true,
      rewriteScope: "ai",
      notify: true
    };
    try {
      if (typeof $persistentStore === "undefined" || typeof $persistentStore.read !== "function") {
        return defaults;
      }
      var raw = $persistentStore.read(CONFIG_KEY);
      if (!raw) return defaults;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return defaults;
      if (parsed.mode === "auto" || parsed.mode === "scan-only" || parsed.mode === "rewrite-only") {
        defaults.mode = parsed.mode;
      }
      if (typeof parsed.target2tb === "string" && /^g1\.[A-Za-z0-9._-]{1,160}$/.test(parsed.target2tb)) {
        defaults.target2tb = parsed.target2tb;
      }
      if (parsed.enable2tb === false) defaults.enable2tb = false;
      if (parsed.enable20tb === false) defaults.enable20tb = false;
      if (parsed.enable30tb === false) defaults.enable30tb = false;
      if (parsed.rewriteScope === "extended") defaults.rewriteScope = "extended";
      if (parsed.notify === false) defaults.notify = false;
    } catch (error) {
      return defaults;
    }
    return defaults;
  }

  function notifyUser(title, subtitle, message) {
    try {
      if (typeof $notification === "object" && $notification && typeof $notification.post === "function") {
        $notification.post(title, subtitle, message);
      }
    } catch (error) {
      console.log("[g1-aio] notification failed");
    }
  }

  function collectOriginalSkus(originalBody) {
    var now = new Date().toISOString();
    var saved = {};
    try {
      if (typeof $persistentStore !== "undefined" && typeof $persistentStore.read === "function") {
        saved = JSON.parse($persistentStore.read(SCAN_KEY) || "{}");
      }
    } catch (error) {
      saved = {};
    }
    if (!saved || saved.schemaVersion !== 1) saved = {};

    var byId = Object.create(null);
    var ids = [];
    var validId = /^(?:g1\.|com\.google\.one\.)[A-Za-z0-9._-]{1,160}$/;
    var oldRows = Array.isArray(saved.skus) ? saved.skus : [];
    oldRows.slice(0, SCAN_LIMIT).forEach(function (row) {
      if (!row || typeof row.id !== "string" || !validId.test(row.id) || byId[row.id]) return;
      var count = Number(row.count);
      byId[row.id] = {
        id: row.id,
        count: isFinite(count) && count > 0 ? Math.floor(count) : 0,
        lastSeen: typeof row.lastSeen === "string" ? row.lastSeen.slice(0, 32) : ""
      };
      ids.push(row.id);
    });

    var isText = typeof originalBody === "string";
    var found = Object.create(null);
    var hitCount = 0;
    var addedCount = 0;
    var omittedCount = 0;
    var truncated = saved.truncated === true;
    if (isText) {
      var text = originalBody.replace(/\\u002e|\\x2e|&#0*46;|&#x0*2e;|&period;/gi, ".");
      var token = /(^|[^A-Za-z0-9._@%-])((?:g1\.|com\.google\.one\.)[A-Za-z0-9._-]+)(?=$|[^A-Za-z0-9._-])/g;
      var match;
      while ((match = token.exec(text)) !== null) {
        var id = match[2];
        if (!validId.test(id)) continue;
        found[id] = (found[id] || 0) + 1;
        hitCount += 1;
        if (!byId[id]) {
          if (ids.length >= SCAN_LIMIT) {
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
      limit: SCAN_LIMIT,
      truncated: truncated,
      skus: ids.sort().map(function (id) { return byId[id]; })
    };
    var stored = false;
    try {
      if (typeof $persistentStore !== "undefined" && typeof $persistentStore.write === "function") {
        stored = $persistentStore.write(JSON.stringify(state), SCAN_KEY);
      }
    } catch (error) {
      stored = false;
    }

    console.log("[g1-aio] " + VERSION + " status=" + status + " addedCount=" + addedCount +
      " candidates=" + candidateCount + " omittedCount=" + omittedCount +
      " occurrences=" + hitCount + " saved=" + (stored ? "yes" : "no"));
    Object.keys(found).sort().slice(0, SCAN_LIMIT).forEach(function (id) {
      console.log("[g1-aio] " + id + " x" + found[id]);
    });
    return { addedCount: addedCount, candidateCount: candidateCount };
  }

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
    var added = counter(row.addedCount, Math.min(SCAN_LIMIT, candidates));
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
