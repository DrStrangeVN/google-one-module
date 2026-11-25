/* Google One ALL IN ONE_V1 (v2.0 Studio): 5 Profiles, Custom Rules, Web + Native Protobuf, Strict Catalog, Anti-Wipe History & Liquid Glass Overlay. */
"use strict";

(function () {
  var VERSION = "g1-aio-v2.0";
  var SOURCE_PREFIX = "g1.ios.2tb.";
  var DEFAULT_TARGET = "g1.2tb.ai.12months_ip_90p";
  var ULTRA_1M_TARGET = "g1.ai.ultra.1month_eft.acq";
  var SKU_MAP = {
    "g1.ios.20tb.m.v2": "g1.20tb.3months_ip_90p.acq",
    "g1.ios.30tb.ai.pro.m": "g1.ai.ultra.3months_ip_90p.acq"
  };
  var FALLBACK = {
    "g1.20tb.3months_ip_90p.acq": "g1.20tb.3months_ip_75p.acq",
    "g1.ai.ultra.3months_ip_90p.acq": "g1.ai.ultra.3months_ip_75p.acq"
  };
  var PROBE_MAP = {
    "g1.ios.30gb.m": "g1.ai.ultra.3months_eft.acq",
    "g1.ios.100gb.m": "g1.ai.ultra.6months_eft.acq",
    "g1.ios.helium.m": "g1.ai.ultra.12months_eft.acq",
    "g1.ios.2tb.m": "g1.ai.ultra.2months_eft.acq",
    "g1.ios.2tb.ai.m": "g1.20tb.3months_eft.acq",
    "g1.ios.20tb.m.v2": "g1.20tb.12months_eft.acq",
    "g1.ios.2tb.ai.a": "g1.2tb.ai.12months_eft.acq",
    "g1.ios.30gb.a": "g1.20tb.1month_eft.acq",
    "g1.ios.100gb.a": "g1.20tb.6months_eft.acq",
    "g1.ios.helium.a": "g1.ai.ultra.3months_eft",
    "g1.ios.2tb.a": "g1.ai.ultra.12months_eft"
  };
  var CONFIG_KEY = "g1.config.v1";
  var TEST_KEY = "g1.pro.annual.test.v1";
  var SCAN_KEY = "g1.sku.scan.v1";
  var SCAN_LIMIT = 300;
  var RECENT_LIMIT = 10;
  var MAX_CUSTOM_RULES = 12;
  var MAX_EVENT_COUNT = 9007199254740991;
  var MAX_PROTO_BODY = 2 * 1024 * 1024;
  var MAX_PROTO_FIELDS = 50000;
  var MAX_PROTO_DEPTH = 48;
  var OTHER_PATH = "[Đường dẫn one.google.com khác]";
  var LEGACY_OTHER_PATH = "[其他 one.google.com 路径]";
  var NATIVE_PATH = "native:GetDynamicStorefrontInfo";
  var VALID_TOKEN = /^(?:g\d+\.[A-Za-z0-9_-]+\.|com\.google\.one\.)[A-Za-z0-9._-]{1,160}$/;
  var url = typeof $request === "object" && $request ? $request.url : "";

  if (typeof url !== "string") {
    $done({});
    return;
  }

  var isWeb = /^https:\/\/one\.google\.com\//.test(url) &&
    !/^https:\/\/one\.google\.com\/g1-sku-report\/?(?:\?|$)/.test(url);
  var isNative = !isWeb &&
    /^https:\/\/subscriptionsmobile-pa\.googleapis\.com(?::443)?\/(?:[^?#]*\/)?GetDynamicStorefrontInfo(?:\?|$)/.test(url);

  if (!isWeb && !isNative) {
    $done({});
    return;
  }

  var config = loadConfig();
  var rawBody = typeof $response === "object" && $response ? $response.body : undefined;

  if (isNative) {
    handleNative(rawBody, config);
    return;
  }

  handleWeb(rawBody, config);

  function handleWeb(responseBody, cfg) {
    var body = decodeTextBody(responseBody);
    var scanResult = { addedCount: 0, candidateCount: 0 };

    if (cfg.mode !== "rewrite-only") {
      try {
        scanResult = collectFromText(body, safeRoute(url));
      } catch (error) {
        console.log("[g1-aio-v1] web SKU collection unavailable");
      }
    }

    if (cfg.mode === "scan-only") {
      if (cfg.notify && scanResult.addedCount > 0) {
        notifyUser(
          "G1 ALL IN ONE_V1",
          "Phát hiện +" + scanResult.addedCount + " SKU mới (Web)",
          "Mở one.google.com/g1-sku-report để xem"
        );
      }
      $done({});
      return;
    }

    var rewritePattern = cfg.rewriteScope === "extended"
      ? /^https:\/\/one\.google\.com\/(?:ai\?|upsell(?:[/?]|$)|plans(?:[/?]|$)|storage(?:[/?]|$)|_\/[^?#]+\/data\/batchexecute)/
      : /^https:\/\/one\.google\.com\/ai\?/;

    if (!rewritePattern.test(url)) {
      if (cfg.notify && scanResult.addedCount > 0) {
        notifyUser(
          "G1 ALL IN ONE_V1",
          "Phát hiện +" + scanResult.addedCount + " SKU mới (Web)",
          "Mở one.google.com/g1-sku-report để xem"
        );
      }
      $done({});
      return;
    }

    if (typeof body === "string" && cfg.strictCatalog) {
      var promoCatalog = body.match(/g1\.[a-z0-9._]{2,80}(?:acq|_90p|_85p|_83p|_75p|_eft|subs_variant)/g) || [];
      if (!promoCatalog.length) {
        saveTestRecord(cfg, Object.create(null), 0, 0, "skipped-strict-catalog");
        console.log("[g1-aio-v1] strictCatalog=on, no promo SKUs in catalog -> passthrough");
        $done({});
        return;
      }
    }

    var mappings = Object.create(null);
    var hits = 0;
    var annualHits = 0;
    var out = body;

    if (typeof body === "string") {
      var observed = body.match(/g1\.[a-z0-9._]{2,80}acq/g) || [];
      out = body.replace(
        /(^|[^A-Za-z0-9._@%-])(g1\.[A-Za-z0-9._-]+)(?=$|[^A-Za-z0-9._-])/g,
        function (match, before, id) {
          var resolved = resolveTarget(id, observed, cfg);
          if (!resolved) return match;
          if (!mappings[id]) {
            mappings[id] = { id: id, to: resolved.to, count: 0, fallback: resolved.fallback };
          }
          mappings[id].count += 1;
          hits += 1;
          if (resolved.is2tb) annualHits += 1;
          return before + resolved.to;
        }
      );

      if (hits > 0 && cfg.overlayPanel) {
        out = injectOverlayPanel(out, cfg, mappings, hits);
      }
    }

    saveTestRecord(cfg, mappings, hits, annualHits, typeof body !== "string" ? "non-text" : hits ? "rewritten" : "no-match");
    logRewrite(cfg, "web", mappings, hits, annualHits);
    notifyOutcome(cfg, mappings, hits, annualHits, scanResult, "Web");
    $done(hits ? { body: out } : {});
  }

  function handleNative(responseBody, cfg) {
    if (cfg.nativeMode === "off") {
      $done({});
      return;
    }

    var bytes = toUint8Array(responseBody);
    if (!bytes) {
      if (cfg.mode !== "rewrite-only") {
        try {
          recordScan([], NATIVE_PATH, false);
        } catch (error) {
          console.log("[g1-aio-v1] native non-text diagnostic failed");
        }
      }
      $done({});
      return;
    }

    var contentType = getResponseContentType();
    var isGrpc = /^application\/grpc(?:[;+\-]|$)/.test(contentType);
    var isGrpcWeb = contentType.indexOf("grpc-web") !== -1;

    if (bytes.length > MAX_PROTO_BODY || contentType.indexOf("grpc-web-text") !== -1) {
      console.log("[g1-aio-v1] native payload skipped (size or grpc-web-text)");
      $done({});
      return;
    }

    var extracted = [];
    try {
      extracted = extractProtobufTokens(bytes, isGrpc, isGrpcWeb);
    } catch (error) {
      console.log("[g1-aio-v1] native protobuf inspect failed: " + (error && error.message ? error.message : "error"));
      $done({});
      return;
    }

    var scanResult = { addedCount: 0, candidateCount: 0 };
    if (cfg.mode !== "rewrite-only") {
      try {
        scanResult = recordScan(extracted, NATIVE_PATH, true);
      } catch (error) {
        console.log("[g1-aio-v1] native scan save unavailable");
      }
    }

    if (cfg.nativeMode !== "rewrite" || cfg.mode === "scan-only") {
      if (cfg.notify && scanResult.addedCount > 0) {
        notifyUser(
          "G1 ALL IN ONE_V1",
          "Phát hiện +" + scanResult.addedCount + " SKU mới (Native App)",
          "Mở one.google.com/g1-sku-report để xem"
        );
      }
      $done({});
      return;
    }

    if (cfg.strictCatalog) {
      var hasPromo = extracted.some(function (id) {
        return /(?:acq|_90p|_85p|_83p|_75p|_eft|subs_variant)$/.test(id);
      });
      if (!hasPromo) {
        saveTestRecord(cfg, Object.create(null), 0, 0, "skipped-strict-catalog");
        console.log("[g1-aio-v1] native strictCatalog=on, no promo SKUs -> passthrough");
        $done({});
        return;
      }
    }

    var mappings = Object.create(null);
    var hits = 0;
    var annualHits = 0;
    var rewrittenBytes = null;

    try {
      rewrittenBytes = rewriteProtobufPayload(bytes, isGrpc, isGrpcWeb, function (id) {
        var resolved = resolveTarget(id, extracted, cfg);
        if (!resolved) return null;
        if (!mappings[id]) {
          mappings[id] = { id: id, to: resolved.to, count: 0, fallback: resolved.fallback };
        }
        mappings[id].count += 1;
        hits += 1;
        if (resolved.is2tb) annualHits += 1;
        return resolved.to;
      });
    } catch (error) {
      console.log("[g1-aio-v1] native protobuf rewrite aborted: " + (error && error.message ? error.message : "error"));
      $done({});
      return;
    }

    saveTestRecord(cfg, mappings, hits, annualHits, hits ? "rewritten" : "no-match");
    logRewrite(cfg, "native", mappings, hits, annualHits);
    notifyOutcome(cfg, mappings, hits, annualHits, scanResult, "Native");
    $done(hits && rewrittenBytes ? { body: rewrittenBytes } : {});
  }

  function resolveTarget(id, observedList, cfg) {
    var is2tb = id.indexOf(SOURCE_PREFIX) === 0 && id.length > SOURCE_PREFIX.length;

    // Priority 1: User-defined custom rules override any profile mapping.
    for (var i = 0; i < cfg.customRules.length; i++) {
      if (cfg.customRules[i].from === id) {
        return { to: cfg.customRules[i].to, fallback: false, is2tb: is2tb };
      }
    }

    if (cfg.profile === "custom-only") {
      return null;
    }

    if (cfg.profile === "ultra-1m-free") {
      if (id.indexOf("g1.ios.") === 0 && id.length > 7) {
        return { to: ULTRA_1M_TARGET, fallback: false, is2tb: is2tb };
      }
      return null;
    }

    if (cfg.profile === "ultra-free-probe") {
      if (Object.prototype.hasOwnProperty.call(PROBE_MAP, id)) {
        return { to: PROBE_MAP[id], fallback: false, is2tb: is2tb };
      }
      return null;
    }

    // Both "hybrid-combo" and "promo-90p" share 20TB/30TB 90p/75p fallback; hybrid maps 2TB -> Ultra 1M Free.
    var to;
    var fallback = false;
    if (is2tb) {
      if (!cfg.enable2tb) return null;
      to = cfg.profile === "hybrid-combo" ? ULTRA_1M_TARGET : cfg.target2tb;
    } else if (id === "g1.ios.20tb.m.v2") {
      if (!cfg.enable20tb) return null;
      to = SKU_MAP[id];
      if (observedList.indexOf(to) === -1 && FALLBACK[to] && observedList.indexOf(FALLBACK[to]) !== -1) {
        to = FALLBACK[to];
        fallback = true;
      }
    } else if (id === "g1.ios.30tb.ai.pro.m") {
      if (!cfg.enable30tb) return null;
      to = SKU_MAP[id];
      if (observedList.indexOf(to) === -1 && FALLBACK[to] && observedList.indexOf(FALLBACK[to]) !== -1) {
        to = FALLBACK[to];
        fallback = true;
      }
    } else {
      return null;
    }
    return { to: to, fallback: fallback, is2tb: is2tb };
  }

  function describeSku(id) {
    var tier = /ultra|30tb/i.test(id) ? "Ultra 30TB" :
      /20tb/i.test(id) ? "Ultra 20TB" :
      /5tb/i.test(id) ? "AI Pro 5TB" :
      /2tb/i.test(id) ? "AI Pro 2TB" :
      /helium/i.test(id) ? "AI Plus 400GB" :
      /200gb/i.test(id) ? "200GB" :
      /100gb/i.test(id) ? "100GB" :
      /30gb/i.test(id) ? "30GB" : "Google One";
    if (/subs_variant/i.test(id)) return tier + " · Stacking";
    var mMatch = id.match(/(\d+)\s*months?/i);
    var dur = mMatch ? mMatch[1] + "T" : /\.a$|annual/i.test(id) ? "12T" : /\.m(?:\.v2)?$/i.test(id) ? "1T" : "";
    var discMatch = id.match(/_ip_(\d+)p/i);
    if (/_eft/i.test(id)) return tier + (dur ? " · " + dur : "") + " Free 0đ";
    if (discMatch) return tier + (dur ? " · " + dur : "") + " Giảm " + discMatch[1] + "%";
    if (/annual/i.test(id)) return tier + " · Gói Năm";
    if (/ios\./i.test(id)) return tier + (dur ? " · " + dur : "") + " Gốc iOS";
    return tier + (dur ? " · " + dur : "");
  }

  function injectOverlayPanel(html, cfg, mappings, hits) {
    var lower = html.toLowerCase();
    var closeIdx = lower.lastIndexOf("</body>");
    if (closeIdx === -1) return html;
    var trimmed = html.replace(/^\s+/, "");
    if (trimmed.charAt(0) === "{" || trimmed.charAt(0) === "[" || trimmed.indexOf(")]}'") === 0) {
      return html;
    }
    var keys = Object.keys(mappings).sort();
    var rows = keys.map(function (id) {
      var m = mappings[id];
      return '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:7px 9px;margin:4px 0;background:rgba(255,255,255,0.045);border:1px solid rgba(255,255,255,0.085);border-radius:10px;">' +
        '<div style="min-width:0;word-break:break-all;"><span style="color:#7DD3FC;font-size:11px;">' + escHtml(m.id) +
        '</span><br><span style="color:#34D399;font-weight:600;">→ ' + escHtml(m.to) +
        '</span><span style="color:#A7B0C5;font-size:11px;margin-left:6px;">(' + escHtml(describeSku(m.to)) + ')</span></div>' +
        '<span style="flex:0 0 auto;background:rgba(52,211,153,0.14);color:#34D399;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700;">x' + m.count +
        (m.fallback ? ' · 75p' : '') + '</span></div>';
    });
    var sparkIcon = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:0 0 auto;"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    var panel =
      '<details style="position:fixed;top:8px;left:10px;right:10px;z-index:2147483647;' +
      'background:rgba(22,25,35,0.94);-webkit-backdrop-filter:blur(28px) saturate(160%);backdrop-filter:blur(28px) saturate(160%);' +
      'color:#F3F5F9;font-family:-apple-system,BlinkMacSystemFont,&quot;SF Pro Text&quot;,sans-serif;font-size:12px;' +
      'line-height:1.45;padding:9px 12px;border-radius:14px;border:1px solid rgba(255,255,255,0.12);' +
      'max-height:60vh;overflow-y:auto;box-shadow:inset 0 1px 0 rgba(255,255,255,0.16),0 16px 40px rgba(0,0,0,0.45);">' +
      '<summary style="font-weight:600;font-size:12px;color:#F3F5F9;cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
      '<span style="display:flex;align-items:center;gap:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + sparkIcon +
      '<span>' + escHtml('ALL IN ONE_V1 (' + cfg.profile + ') · ' + keys.length + ' mã (' + hits + 'x)') + '</span>' +
      '</span><span style="flex:0 0 auto;background:rgba(52,211,153,0.14);color:#34D399;padding:2px 9px;border-radius:99px;font-size:11px;font-weight:700;">Chi tiết</span>' +
      '</summary><div style="margin-top:8px;">' + rows.join("") +
      '<div style="margin-top:9px;display:flex;gap:8px;flex-wrap:wrap;">' +
      '<a href="https://one.google.com/g1-sku-report" style="display:inline-flex;align-items:center;background:#2563EB;color:#FFFFFF;text-decoration:none;padding:6px 12px;border-radius:99px;font-weight:600;font-size:12px;">Mở Studio &amp; Báo cáo</a>' +
      '<a href="https://one.google.com/g1-sku-report?action=toggle-overlay" style="display:inline-flex;align-items:center;background:rgba(255,255,255,0.08);color:#F3F5F9;border:1px solid rgba(255,255,255,0.12);text-decoration:none;padding:6px 12px;border-radius:99px;font-weight:600;font-size:12px;">Ẩn thanh nổi</a>' +
      '</div></div></details>';
    return html.slice(0, closeIdx) + panel + html.slice(closeIdx);
  }

  function escHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function sanitizeMatchedRows(value) {
    if (!Array.isArray(value)) return [];
    return value.slice(0, 64).filter(function (row) {
      return row && typeof row.id === "string" && VALID_TOKEN.test(row.id) &&
        typeof row.to === "string" && VALID_TOKEN.test(row.to);
    }).map(function (row) {
      var c = Number(row.count);
      return {
        id: row.id,
        to: row.to,
        count: isFinite(c) && c > 0 ? Math.floor(c) : 0,
        fallback: row.fallback === true
      };
    });
  }

  function sanitizeRecentRewrites(value) {
    if (!Array.isArray(value)) return [];
    return value.slice(-9).filter(function (row) {
      return row && typeof row === "object" && !Array.isArray(row) &&
        typeof row.at === "string" && /^\d{4}-\d{2}-\d{2}T/.test(row.at) &&
        typeof row.status === "string";
    }).map(function (row) {
      var hc = Number(row.hitCount);
      var ahc = Number(row.annualHitCount);
      return {
        at: row.at.slice(0, 32),
        profile: typeof row.profile === "string" ? row.profile.slice(0, 32) : "promo-90p",
        status: row.status.slice(0, 32),
        hitCount: isFinite(hc) && hc >= 0 ? Math.floor(hc) : 0,
        annualHitCount: isFinite(ahc) && ahc >= 0 ? Math.floor(ahc) : 0
      };
    });
  }

  function sanitizeLastSuccess(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    var hc = Number(raw.hitCount);
    if (!isFinite(hc) || hc <= 0 || typeof raw.at !== "string") return null;
    var ahc = Number(raw.annualHitCount);
    return {
      at: raw.at.slice(0, 32),
      version: typeof raw.version === "string" ? raw.version.slice(0, 32) : "",
      profile: typeof raw.profile === "string" ? raw.profile.slice(0, 32) : "promo-90p",
      target: typeof raw.target === "string" ? raw.target.slice(0, 160) : "",
      hitCount: Math.floor(hc),
      annualHitCount: isFinite(ahc) && ahc >= 0 ? Math.floor(ahc) : 0,
      matchedFrom: sanitizeMatchedRows(raw.matchedFrom)
    };
  }

  function saveTestRecord(cfg, mappings, hits, annualHits, status) {
    var now = new Date().toISOString();
    var savedTest = {};
    try {
      if (typeof $persistentStore !== "undefined" && typeof $persistentStore.read === "function") {
        savedTest = JSON.parse($persistentStore.read(TEST_KEY) || "{}");
      }
    } catch (error) {
      savedTest = {};
    }
    if (!savedTest || savedTest.schemaVersion !== 1) savedTest = {};

    var sources = Object.keys(mappings).sort().map(function (id) {
      return mappings[id];
    });
    var effectiveTarget = cfg.profile === "ultra-1m-free" || cfg.profile === "hybrid-combo" ? ULTRA_1M_TARGET :
      cfg.profile === "ultra-free-probe" ? "probe-11-eft" :
      cfg.profile === "custom-only" ? "custom-rules" : cfg.target2tb;

    var recentRewrites = sanitizeRecentRewrites(savedTest.recentRewrites);
    recentRewrites.push({
      at: now,
      profile: cfg.profile,
      status: status,
      hitCount: hits,
      annualHitCount: annualHits
    });

    var lastSuccess = hits > 0 ? {
      at: now,
      version: VERSION,
      profile: cfg.profile,
      target: effectiveTarget,
      hitCount: hits,
      annualHitCount: annualHits,
      matchedFrom: sources
    } : sanitizeLastSuccess(savedTest.lastSuccess);

    var record = {
      schemaVersion: 1,
      version: VERSION,
      updatedAt: now,
      sourcePrefix: SOURCE_PREFIX,
      target: effectiveTarget,
      targetOrigin: cfg.profile !== "promo-90p" ? "profile:" + cfg.profile :
        cfg.target2tb === DEFAULT_TARGET ? "user-specified" : "custom",
      hitCount: hits,
      annualHitCount: annualHits,
      matchedFrom: sources,
      status: status,
      lastSuccess: lastSuccess,
      recentRewrites: recentRewrites.slice(-RECENT_LIMIT)
    };
    try {
      if (typeof $persistentStore !== "undefined" && typeof $persistentStore.write === "function") {
        if (!$persistentStore.write(JSON.stringify(record), TEST_KEY)) {
          console.log("[g1-aio-v1] local record write failed");
        }
      }
    } catch (error) {
      console.log("[g1-aio-v1] local record unavailable");
    }
  }

  function logRewrite(cfg, channel, mappings, hits, annualHits) {
    console.log("[g1-aio-v1] " + VERSION + " channel=" + channel + " profile=" + cfg.profile +
      " mode=" + cfg.mode + " strict=" + (cfg.strictCatalog ? "1" : "0") +
      " hits=" + hits + " annualHits=" + annualHits);
    Object.keys(mappings).sort().forEach(function (id) {
      var source = mappings[id];
      console.log("[g1-aio-v1] " + source.id + " -> " + source.to + " x" + source.count +
        (source.fallback ? " fallback=75p" : ""));
    });
  }

  function notifyOutcome(cfg, mappings, hits, annualHits, scanResult, channelLabel) {
    if (!cfg.notify) return;
    if (hits > 0) {
      var summary = Object.keys(mappings).sort().map(function (id) {
        var source = mappings[id];
        return source.id + " -> " + source.to + " (x" + source.count + ")";
      }).join("; ");
      notifyUser(
        "G1 ALL IN ONE_V1 (" + channelLabel + " · " + cfg.profile + ")",
        "Đã ghi đè " + hits + " SKU (2TB: " + annualHits + ")",
        summary
      );
    } else if (scanResult.addedCount > 0) {
      notifyUser(
        "G1 ALL IN ONE_V1 (" + channelLabel + ")",
        "Phát hiện +" + scanResult.addedCount + " SKU mới",
        "Mở one.google.com/g1-sku-report để xem"
      );
    }
  }

  function decodeTextBody(body) {
    if (typeof body === "string" || body == null) return body;
    var bytes = toUint8Array(body);
    if (!bytes) return body;
    if (typeof TextDecoder !== "undefined") {
      try {
        return new TextDecoder("utf-8").decode(bytes);
      } catch (error) {
        return body;
      }
    }
    return bytesToAsciiIfPrintable(bytes) || body;
  }

  function bytesToAsciiIfPrintable(bytes) {
    var out = "";
    for (var i = 0; i < bytes.length; i++) {
      var b = bytes[i];
      if (b === 9 || b === 10 || b === 13 || (b >= 32 && b <= 126)) {
        out += String.fromCharCode(b);
      } else {
        return null;
      }
    }
    return out;
  }

  function toUint8Array(value) {
    if (!value) return null;
    if (value instanceof Uint8Array) return value;
    if (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) {
      return new Uint8Array(value);
    }
    if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView && ArrayBuffer.isView(value)) {
      return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    }
    return null;
  }

  function getResponseContentType() {
    if (typeof $response !== "object" || !$response || !$response.headers) return "";
    var headers = $response.headers;
    if (typeof headers.get === "function") {
      return String(headers.get("content-type") || "").toLowerCase();
    }
    var keys = Object.keys(headers);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].toLowerCase() === "content-type") {
        return String(headers[keys[i]] || "").toLowerCase();
      }
    }
    return "";
  }

  function collectFromText(originalBody, routeLabel) {
    var isText = typeof originalBody === "string";
    var tokens = [];
    if (isText) {
      var text = originalBody.replace(/\\u002e|\\x2e|&#0*46;|&#x0*2e;|&period;/gi, ".");
      var tokenRx = /(^|[^A-Za-z0-9._@%-])((?:g1\.|com\.google\.one\.)[A-Za-z0-9._-]+)(?=$|[^A-Za-z0-9._-])/g;
      var match;
      while ((match = tokenRx.exec(text)) !== null) {
        tokens.push(match[2]);
      }
    }
    return recordScan(tokens, routeLabel, isText);
  }

  function recordScan(tokens, routeLabel, isScannable) {
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
    var oldRows = Array.isArray(saved.skus) ? saved.skus : [];
    oldRows.slice(0, SCAN_LIMIT).forEach(function (row) {
      if (!row || typeof row.id !== "string" || !VALID_TOKEN.test(row.id) || byId[row.id]) return;
      var count = Number(row.count);
      byId[row.id] = {
        id: row.id,
        count: isFinite(count) && count > 0 ? Math.floor(count) : 0,
        lastSeen: typeof row.lastSeen === "string" ? row.lastSeen.slice(0, 32) : ""
      };
      ids.push(row.id);
    });

    var found = Object.create(null);
    var hitCount = 0;
    var addedCount = 0;
    var omittedCount = 0;
    var truncated = saved.truncated === true;

    if (isScannable) {
      for (var i = 0; i < tokens.length; i++) {
        var id = tokens[i];
        if (!VALID_TOKEN.test(id)) continue;
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
    var bodyType = isScannable ? "text" : "non-text";
    var status = responseStatus(bodyType, candidateCount, addedCount, omittedCount);
    var recentResponses = [];
    var oldResponses = Array.isArray(saved.recentResponses) ? saved.recentResponses : [];
    oldResponses.slice(-RECENT_LIMIT).forEach(function (row) {
      var event = priorResponse(row);
      if (event) recentResponses.push(event);
    });
    recentResponses.push({
      at: now,
      path: routeLabel,
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
      scannedResponses: priorCount(saved.scannedResponses) + (isScannable ? 1 : 0),
      matchedResponses: priorCount(saved.matchedResponses) + (hitCount > 0 ? 1 : 0),
      nonTextResponses: priorCount(saved.nonTextResponses) + (isScannable ? 0 : 1),
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

    console.log("[g1-aio-v1] " + VERSION + " route=" + routeLabel + " status=" + status +
      " addedCount=" + addedCount + " candidates=" + candidateCount + " omittedCount=" + omittedCount +
      " occurrences=" + hitCount + " saved=" + (stored ? "yes" : "no"));
    return { addedCount: addedCount, candidateCount: candidateCount };
  }

  /* ---------- Protobuf & gRPC binary inspection + length-safe rewriting ---------- */

  function extractProtobufTokens(bytes, isGrpc, isGrpcWeb) {
    var tokens = [];
    var state = { fields: 0 };
    if (!isGrpc) {
      inspectProtoMessage(bytes, 0, state, tokens);
      return tokens;
    }
    var offset = 0;
    while (offset < bytes.length) {
      if (offset + 5 > bytes.length) throw new Error("truncated grpc header");
      var flag = bytes[offset];
      var len = readUint32BE(bytes, offset + 1);
      var end = offset + 5 + len;
      if (end > bytes.length) throw new Error("truncated grpc frame");
      if (flag === 128 && isGrpcWeb) {
        // Skip gRPC-web trailer frame.
      } else {
        if (flag !== 0) throw new Error("compressed grpc unsupported");
        inspectProtoMessage(bytes.subarray(offset + 5, end), 0, state, tokens);
      }
      offset = end;
    }
    return tokens;
  }

  function inspectProtoMessage(data, depth, state, tokens) {
    if (depth > MAX_PROTO_DEPTH) throw new Error("nesting limit");
    var offset = 0;
    while (offset < data.length) {
      if (++state.fields > MAX_PROTO_FIELDS) throw new Error("field limit");
      var tag = readVarint(data, offset);
      offset = tag.offset;
      var wire = tag.value % 8;
      var fieldNum = Math.floor(tag.value / 8);
      if (!fieldNum) throw new Error("zero field number");
      if (wire === 0) {
        offset = skipVarint(data, offset);
      } else if (wire === 1) {
        offset += 8;
      } else if (wire === 5) {
        offset += 4;
      } else if (wire === 2) {
        var size = readVarint(data, offset);
        var end = size.offset + size.value;
        if (end > data.length) throw new Error("truncated length field");
        var payload = data.subarray(size.offset, end);
        var tok = parseProductAscii(payload);
        if (tok) {
          tokens.push(tok);
        } else if (payload.length) {
          try {
            inspectProtoMessage(payload, depth + 1, state, tokens);
          } catch (nestedError) {
            if (nestedError && (nestedError.message === "nesting limit" || nestedError.message === "field limit")) {
              throw nestedError;
            }
          }
        }
        offset = end;
      } else {
        throw new Error("unsupported wire type");
      }
      if (offset > data.length) throw new Error("truncated fixed field");
    }
  }

  function rewriteProtobufPayload(bytes, isGrpc, isGrpcWeb, replacer) {
    var state = { fields: 0 };
    if (!isGrpc) {
      var res = rewriteProtoMessage(bytes, 0, state, replacer);
      return res.changed ? res.bytes : null;
    }
    var frames = [];
    var totalLength = 0;
    var anyChanged = false;
    var offset = 0;
    while (offset < bytes.length) {
      if (offset + 5 > bytes.length) throw new Error("truncated grpc header");
      var flag = bytes[offset];
      var len = readUint32BE(bytes, offset + 1);
      var end = offset + 5 + len;
      if (end > bytes.length) throw new Error("truncated grpc frame");
      if (flag === 128 && isGrpcWeb) {
        var trailer = bytes.subarray(offset, end);
        frames.push(trailer);
        totalLength += trailer.length;
      } else {
        if (flag !== 0) throw new Error("compressed grpc unsupported");
        var frameMsg = rewriteProtoMessage(bytes.subarray(offset + 5, end), 0, state, replacer);
        if (frameMsg.changed) anyChanged = true;
        var outFrame = new Uint8Array(5 + frameMsg.bytes.length);
        outFrame[0] = flag;
        writeUint32BE(outFrame, 1, frameMsg.bytes.length);
        outFrame.set(frameMsg.bytes, 5);
        frames.push(outFrame);
        totalLength += outFrame.length;
      }
      offset = end;
    }
    if (!anyChanged) return null;
    return concatBytes(frames, totalLength);
  }

  function rewriteProtoMessage(data, depth, state, replacer) {
    if (depth > MAX_PROTO_DEPTH) throw new Error("nesting limit");
    var chunks = [];
    var totalLen = 0;
    var changed = false;
    var offset = 0;

    while (offset < data.length) {
      if (++state.fields > MAX_PROTO_FIELDS) throw new Error("field limit");
      var fieldStart = offset;
      var tag = readVarint(data, offset);
      offset = tag.offset;
      var wire = tag.value % 8;
      var fieldNum = Math.floor(tag.value / 8);
      if (!fieldNum) throw new Error("zero field number");

      if (wire === 0) {
        offset = skipVarint(data, offset);
        var rawV = data.subarray(fieldStart, offset);
        chunks.push(rawV);
        totalLen += rawV.length;
      } else if (wire === 1) {
        offset += 8;
        if (offset > data.length) throw new Error("truncated fixed64");
        var raw64 = data.subarray(fieldStart, offset);
        chunks.push(raw64);
        totalLen += raw64.length;
      } else if (wire === 5) {
        offset += 4;
        if (offset > data.length) throw new Error("truncated fixed32");
        var raw32 = data.subarray(fieldStart, offset);
        chunks.push(raw32);
        totalLen += raw32.length;
      } else if (wire === 2) {
        var tagBytes = data.subarray(fieldStart, offset);
        var size = readVarint(data, offset);
        var end = size.offset + size.value;
        if (end > data.length) throw new Error("truncated length field");
        var payload = data.subarray(size.offset, end);
        var tok = parseProductAscii(payload);

        if (tok) {
          var replacement = replacer(tok);
          if (replacement) {
            var repBytes = asciiToBytes(replacement);
            var lenBytes = encodeVarint(repBytes.length);
            chunks.push(tagBytes, lenBytes, repBytes);
            totalLen += tagBytes.length + lenBytes.length + repBytes.length;
            changed = true;
          } else {
            var rawTokField = data.subarray(fieldStart, end);
            chunks.push(rawTokField);
            totalLen += rawTokField.length;
          }
        } else if (payload.length) {
          var nestedChanged = false;
          var nestedBytes = payload;
          try {
            var nested = rewriteProtoMessage(payload, depth + 1, state, replacer);
            if (nested.changed) {
              nestedChanged = true;
              nestedBytes = nested.bytes;
            }
          } catch (nestedError) {
            if (nestedError && (nestedError.message === "nesting limit" || nestedError.message === "field limit")) {
              throw nestedError;
            }
            nestedChanged = false;
          }
          if (nestedChanged) {
            var newLenBytes = encodeVarint(nestedBytes.length);
            chunks.push(tagBytes, newLenBytes, nestedBytes);
            totalLen += tagBytes.length + newLenBytes.length + nestedBytes.length;
            changed = true;
          } else {
            var rawNested = data.subarray(fieldStart, end);
            chunks.push(rawNested);
            totalLen += rawNested.length;
          }
        } else {
          var rawEmpty = data.subarray(fieldStart, end);
          chunks.push(rawEmpty);
          totalLen += rawEmpty.length;
        }
        offset = end;
      } else {
        throw new Error("unsupported wire type");
      }
    }

    if (!changed) return { changed: false, bytes: data };
    return { changed: true, bytes: concatBytes(chunks, totalLen) };
  }

  function parseProductAscii(bytes) {
    if (bytes.length < 8 || bytes.length > 160) return null;
    var value = "";
    for (var i = 0; i < bytes.length; i++) {
      var b = bytes[i];
      if (!((b >= 48 && b <= 57) || (b >= 65 && b <= 90) || (b >= 97 && b <= 122) || b === 45 || b === 46 || b === 95)) {
        return null;
      }
      value += String.fromCharCode(b);
    }
    return VALID_TOKEN.test(value) ? value : null;
  }

  function asciiToBytes(str) {
    var out = new Uint8Array(str.length);
    for (var i = 0; i < str.length; i++) {
      out[i] = str.charCodeAt(i) & 0xff;
    }
    return out;
  }

  function encodeVarint(n) {
    var out = [];
    var v = n >>> 0;
    while (v >= 128) {
      out.push((v & 0x7f) | 0x80);
      v = v >>> 7;
    }
    out.push(v);
    return new Uint8Array(out);
  }

  function readVarint(data, offset) {
    var value = 0;
    var power = 1;
    for (var i = 0; i < 5; i++) {
      if (offset >= data.length) throw new Error("truncated varint");
      var byte = data[offset++];
      if (i === 4 && byte > 15) throw new Error("uint32 overflow");
      value += (byte & 127) * power;
      if (!(byte & 128)) return { value: value, offset: offset };
      power *= 128;
    }
    throw new Error("overlong varint");
  }

  function skipVarint(data, offset) {
    for (var i = 0; i < 10; i++) {
      if (offset >= data.length) throw new Error("truncated scalar");
      var byte = data[offset++];
      if (i === 9 && byte > 1) throw new Error("uint64 overflow");
      if (!(byte & 128)) return offset;
    }
    throw new Error("overlong scalar");
  }

  function readUint32BE(bytes, offset) {
    return ((bytes[offset] << 24) >>> 0) + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3];
  }

  function writeUint32BE(bytes, offset, value) {
    bytes[offset] = (value >>> 24) & 0xff;
    bytes[offset + 1] = (value >>> 16) & 0xff;
    bytes[offset + 2] = (value >>> 8) & 0xff;
    bytes[offset + 3] = value & 0xff;
  }

  function concatBytes(chunks, totalLen) {
    var out = new Uint8Array(totalLen);
    var pos = 0;
    for (var i = 0; i < chunks.length; i++) {
      out.set(chunks[i], pos);
      pos += chunks[i].length;
    }
    return out;
  }

  /* ---------- Config, notifications & shared diagnostics helpers ---------- */

  function sanitizeCustomRules(rawRules) {
    if (!Array.isArray(rawRules)) return [];
    var seen = Object.create(null);
    var out = [];
    for (var i = 0; i < rawRules.length && out.length < MAX_CUSTOM_RULES; i++) {
      var item = rawRules[i];
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      var from = typeof item.from === "string" ? item.from.trim() : "";
      var to = typeof item.to === "string" ? item.to.trim() : "";
      if (!VALID_TOKEN.test(from) || !VALID_TOKEN.test(to) || from === to || seen[from]) continue;
      seen[from] = true;
      out.push({ from: from, to: to });
    }
    return out;
  }

  function loadConfig() {
    var defaults = {
      schemaVersion: 1,
      profile: "promo-90p",
      mode: "auto",
      target2tb: DEFAULT_TARGET,
      enable2tb: true,
      enable20tb: true,
      enable30tb: true,
      rewriteScope: "ai",
      nativeMode: "scan",
      strictCatalog: false,
      overlayPanel: true,
      notify: true,
      theme: "auto",
      customRules: []
    };
    try {
      if (typeof $persistentStore === "undefined" || typeof $persistentStore.read !== "function") {
        return defaults;
      }
      var raw = $persistentStore.read(CONFIG_KEY);
      if (!raw) return defaults;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return defaults;
      if (parsed.profile === "promo-90p" || parsed.profile === "hybrid-combo" ||
          parsed.profile === "ultra-1m-free" || parsed.profile === "ultra-free-probe" ||
          parsed.profile === "custom-only") {
        defaults.profile = parsed.profile;
      }
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
      if (parsed.nativeMode === "scan" || parsed.nativeMode === "rewrite" || parsed.nativeMode === "off") {
        defaults.nativeMode = parsed.nativeMode;
      }
      if (parsed.strictCatalog === true) defaults.strictCatalog = true;
      if (parsed.overlayPanel === false) defaults.overlayPanel = false;
      if (parsed.notify === false) defaults.notify = false;
      if (parsed.theme === "dark" || parsed.theme === "light" || parsed.theme === "auto") {
        defaults.theme = parsed.theme;
      }
      defaults.customRules = sanitizeCustomRules(parsed.customRules);
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
      console.log("[g1-aio-v1] notification failed");
    }
  }

  function safeRoute(requestUrl) {
    var path = requestUrl.replace(/^https:\/\/one\.google\.com/, "").split(/[?#]/)[0];
    path = path.replace(/\/+$/, "") || "/";
    if (path === "/" || path === "/ai" || path === "/plans" || path === "/upsell" || path === "/storage") return path;
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
    if (path !== "/" && path !== "/ai" && path !== "/plans" && path !== "/upsell" && path !== "/storage" &&
        path !== "/_/…/data/batchexecute" && path !== OTHER_PATH && path !== NATIVE_PATH) return null;
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
