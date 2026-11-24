/* Local-only Vietnamese report & polished Control Panel for ALL IN ONE_V1 (Shadowrocket / Loon / Surge). */
"use strict";

(function () {
  var ROOT = "https://one.google.com/g1-sku-report";
  var VERSION = "aio-v1.1";
  var DEFAULT_TARGET = "g1.2tb.ai.12months_ip_90p";
  var LEGACY_TARGET = "g1.2tb.ai.annual";
  var SCAN_KEY = "g1.sku.scan.v1";
  var TEST_KEY = "g1.pro.annual.test.v1";
  var CONFIG_KEY = "g1.config.v1";
  var OTHER_PATH = "[Đường dẫn one.google.com khác]";
  var LEGACY_OTHER_PATH = "[其他 one.google.com 路径]";
  var NATIVE_PATH = "native:GetDynamicStorefrontInfo";
  var VALID_SKU = /^g1\.[A-Za-z0-9._-]{1,160}$/;
  var PRESETS = [
    { id: "g1.2tb.ai.12months_ip_90p", label: "12 tháng 90p (v7.5)" },
    { id: "g1.ai.ultra.1month_eft.acq", label: "Ultra 1 tháng Free (eft)" },
    { id: "g1.2tb.ai.12months_eft.acq", label: "Pro 12 tháng Free (eft)" },
    { id: "g1.2tb.ai.annual", label: "2TB Năm (g1.2tb.ai.annual)" }
  ];
  var url = typeof $request === "object" && $request ? $request.url : "";
  if (typeof url !== "string" || !/^https:\/\/one\.google\.com\/g1-sku-report\/?(?:\?|$)/.test(url)) {
    $done({});
    return;
  }

  var storageAvailable = typeof $persistentStore !== "undefined" &&
    typeof $persistentStore.read === "function" &&
    typeof $persistentStore.write === "function";
  var query = parseQuery(url);
  var actionMessage = "";
  var errorMessage = "";

  handleActions();

  function parseQuery(requestUrl) {
    var result = Object.create(null);
    var qIndex = requestUrl.indexOf("?");
    if (qIndex === -1) return result;
    var queryString = requestUrl.slice(qIndex + 1).split("#")[0];
    if (!queryString) return result;
    queryString.split("&").forEach(function (pair) {
      if (!pair) return;
      var eqIndex = pair.indexOf("=");
      var rawKey = eqIndex === -1 ? pair : pair.slice(0, eqIndex);
      var rawVal = eqIndex === -1 ? "" : pair.slice(eqIndex + 1);
      try {
        var key = decodeURIComponent(rawKey.replace(/\+/g, " "));
        var val = decodeURIComponent(rawVal.replace(/\+/g, " "));
        result[key] = val;
      } catch (error) {
        // Ignore malformed percent-encoded query pairs.
      }
    });
    return result;
  }

  function load(key) {
    if (!storageAvailable) return {};
    try {
      var value = JSON.parse($persistentStore.read(key) || "{}");
      return value && value.schemaVersion === 1 ? value : {};
    } catch (error) {
      return {};
    }
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
      notify: true
    };
    var saved = load(CONFIG_KEY);
    if (saved.profile === "promo-90p" || saved.profile === "ultra-1m-free" || saved.profile === "ultra-free-probe") {
      defaults.profile = saved.profile;
    }
    if (saved.mode === "auto" || saved.mode === "scan-only" || saved.mode === "rewrite-only") {
      defaults.mode = saved.mode;
    }
    if (typeof saved.target2tb === "string" && VALID_SKU.test(saved.target2tb)) {
      defaults.target2tb = saved.target2tb;
    }
    if (saved.enable2tb === false) defaults.enable2tb = false;
    if (saved.enable20tb === false) defaults.enable20tb = false;
    if (saved.enable30tb === false) defaults.enable30tb = false;
    if (saved.rewriteScope === "extended") defaults.rewriteScope = "extended";
    if (saved.nativeMode === "scan" || saved.nativeMode === "rewrite" || saved.nativeMode === "off") {
      defaults.nativeMode = saved.nativeMode;
    }
    if (saved.strictCatalog === true) defaults.strictCatalog = true;
    if (saved.overlayPanel === false) defaults.overlayPanel = false;
    if (saved.notify === false) defaults.notify = false;
    return defaults;
  }

  function saveConfig(cfg) {
    if (!storageAvailable) {
      errorMessage = "Giao diện lưu trữ cục bộ chưa sẵn sàng.";
      return false;
    }
    try {
      var ok = $persistentStore.write(JSON.stringify(cfg), CONFIG_KEY);
      if (!ok) errorMessage = "Không thể ghi cấu hình vào $persistentStore.";
      return ok;
    } catch (error) {
      errorMessage = "Lỗi khi lưu cấu hình cục bộ.";
      return false;
    }
  }

  function handleActions() {
    if (query.clear) {
      if (!storageAvailable) {
        errorMessage = "Giao diện lưu trữ cục bộ chưa sẵn sàng.";
        return;
      }
      try {
        if (query.clear === "1") {
          var scanCleared = $persistentStore.write("{}", SCAN_KEY);
          var testCleared = $persistentStore.write("{}", TEST_KEY);
          actionMessage = scanCleared && testCleared
            ? "Đã xóa hai bản ghi quét & test của công cụ (giữ nguyên cấu hình ALL IN ONE_V1)."
            : "Chưa thể xóa hoàn toàn bản ghi cục bộ.";
        } else if (query.clear === "scan") {
          actionMessage = $persistentStore.write("{}", SCAN_KEY)
            ? "Đã xóa danh sách SKU đã quét."
            : "Không thể xóa danh sách SKU.";
        } else if (query.clear === "test") {
          actionMessage = $persistentStore.write("{}", TEST_KEY)
            ? "Đã xóa kết quả ghi đè gần nhất."
            : "Không thể xóa kết quả ghi đè.";
        } else if (query.clear === "config") {
          actionMessage = $persistentStore.write("{}", CONFIG_KEY)
            ? "Đã đặt lại cấu hình ALL IN ONE_V1 về mặc định."
            : "Không thể đặt lại cấu hình.";
        }
      } catch (error) {
        errorMessage = "Giao diện lưu trữ cục bộ chưa sẵn sàng.";
      }
      return;
    }

    if (!query.action) return;

    var cfg = loadConfig();
    if (query.action === "profile") {
      if (query.profile === "promo-90p" || query.profile === "ultra-1m-free" || query.profile === "ultra-free-probe") {
        cfg.profile = query.profile;
        if (saveConfig(cfg)) {
          var pNames = {
            "promo-90p": "Promo 90p / 75p (v7.5)",
            "ultra-1m-free": "Ultra 30TB · 1M Free (Mọi nút)",
            "ultra-free-probe": "Dò 11 nút Free dài hạn (2/3/6/12T)"
          };
          actionMessage = "Đã chuyển Profile mapping sang: " + pNames[cfg.profile] + ".";
        }
      } else {
        errorMessage = "Profile không hợp lệ.";
      }
      return;
    }

    if (query.action === "mode") {
      if (query.mode === "auto" || query.mode === "scan-only" || query.mode === "rewrite-only") {
        cfg.mode = query.mode;
        if (saveConfig(cfg)) {
          var modeNames = {
            "auto": "Tự động (Quét + Ghi đè)",
            "scan-only": "Chỉ quét gốc",
            "rewrite-only": "Chỉ ghi đè"
          };
          actionMessage = "Đã chuyển chế độ sang: " + modeNames[cfg.mode] + ".";
        }
      } else {
        errorMessage = "Chế độ không hợp lệ.";
      }
      return;
    }

    if (query.action === "preset") {
      var presetTarget = typeof query.target2tb === "string" ? query.target2tb.trim() : "";
      if (VALID_SKU.test(presetTarget)) {
        cfg.target2tb = presetTarget;
        if (saveConfig(cfg)) {
          actionMessage = "Đã đặt mã đích 2TB sang: " + presetTarget;
        }
      } else {
        errorMessage = "Mã SKU preset không hợp lệ.";
      }
      return;
    }

    if (query.action === "save") {
      var candidate = typeof query.target2tb === "string" ? query.target2tb.trim() : "";
      if (!VALID_SKU.test(candidate)) {
        errorMessage = "Mã SKU 2TB không hợp lệ (phải bắt đầu bằng g1. và chỉ chứa chữ, số, ., _, -). Đã giữ nguyên cấu hình cũ.";
        return;
      }
      cfg.target2tb = candidate;
      if (query.profile === "promo-90p" || query.profile === "ultra-1m-free" || query.profile === "ultra-free-probe") {
        cfg.profile = query.profile;
      }
      if (query.mode === "auto" || query.mode === "scan-only" || query.mode === "rewrite-only") {
        cfg.mode = query.mode;
      }
      cfg.rewriteScope = query.scope === "extended" ? "extended" : "ai";
      if (query.native === "scan" || query.native === "rewrite" || query.native === "off") {
        cfg.nativeMode = query.native;
      }
      cfg.strictCatalog = query.strict === "1";
      cfg.overlayPanel = query.overlay === "1";
      cfg.enable2tb = query.e2tb === "1";
      cfg.enable20tb = query.e20tb === "1";
      cfg.enable30tb = query.e30tb === "1";
      cfg.notify = query.notify === "1";
      if (saveConfig(cfg)) {
        actionMessage = "Đã lưu cấu hình ALL IN ONE_V1.";
      }
    }
  }

  function text(value, length) {
    return typeof value === "string" ? value.slice(0, length || 180) : "";
  }
  function count(value) {
    var number = Number(value);
    return isFinite(number) && number > 0 ? Math.floor(number) : 0;
  }
  function sku(value) {
    return typeof value === "string" && VALID_SKU.test(value) ? value : "";
  }
  function isPromoSku(id) {
    return /(?:acq|_90p|_75p|_eft|12months|annual|3months|6months|2months|1month)/i.test(id);
  }
  function rows(value, withTime, defaultTarget) {
    if (!Array.isArray(value)) return [];
    return value.slice(0, 300).filter(function (row) {
      return row && typeof row.id === "string" &&
        /^(?:g\d+\.[A-Za-z0-9_-]+\.|com\.google\.one\.)[A-Za-z0-9._-]{1,160}$/.test(row.id);
    }).map(function (row) {
      var out = { id: row.id, count: count(row.count) };
      if (withTime) {
        out.lastSeen = text(row.lastSeen, 32);
      } else {
        out.to = sku(row.to) || (row.id.indexOf("g1.ios.2tb.") === 0 ? defaultTarget || "" : "");
        out.fallback = row.fallback === true;
      }
      return out;
    }).sort(function (a, b) {
      if (withTime) {
        var pa = isPromoSku(a.id) ? 0 : 1;
        var pb = isPromoSku(b.id) ? 0 : 1;
        if (pa !== pb) return pa - pb;
      }
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
  }

  var scanStatuses = {
    "new-skus": "Phát hiện & lưu SKU mới",
    "known-skus": "Trùng bản ghi cũ",
    "no-skus": "Không chứa mã SKU",
    "limit-reached": "Đạt giới hạn 300 mã",
    "non-text": "Không phải văn bản"
  };
  var statusStyles = {
    "new-skus": "st-ok",
    "known-skus": "st-info",
    "no-skus": "st-muted",
    "limit-reached": "st-err",
    "non-text": "st-warn"
  };
  var scanPaths = ["/", "/ai", "/plans", "/upsell", "/storage", "/_/…/data/batchexecute", NATIVE_PATH, OTHER_PATH];
  function recent(value) {
    if (!Array.isArray(value)) return [];
    return value.slice(-10).filter(function (event) {
      return event && typeof event.at === "string" &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(event.at) &&
        (event.bodyType === "text" || event.bodyType === "non-text") &&
        Object.prototype.hasOwnProperty.call(scanStatuses, event.status);
    }).map(function (event) {
      var normalizedPath = event.path === LEGACY_OTHER_PATH ? OTHER_PATH : event.path;
      return {
        at: event.at,
        path: scanPaths.indexOf(normalizedPath) !== -1 ? normalizedPath : OTHER_PATH,
        bodyType: event.bodyType,
        status: event.status,
        candidateCount: count(event.candidateCount),
        addedCount: count(event.addedCount),
        omittedCount: count(event.omittedCount)
      };
    });
  }

  var currentConfig = loadConfig();
  var CONFIGURED_TARGET = currentConfig.target2tb;
  var scanRaw = load(SCAN_KEY);
  var testRaw = load(TEST_KEY);
  var recordedTarget = sku(testRaw.target);
  if (!recordedTarget && /^(?:pro-annual-test-v[12]|g1-acq-v7(?:\.0|\.1)?)$/.test(testRaw.version || "")) {
    recordedTarget = LEGACY_TARGET;
  }
  var matchedFrom = rows(testRaw.matchedFrom, false, recordedTarget);
  if (!recordedTarget) {
    matchedFrom.some(function (row) {
      if (row.id.indexOf("g1.ios.2tb.") === 0 && row.to) {
        recordedTarget = row.to;
        return true;
      }
      return false;
    });
  }
  var annualHitCount = typeof testRaw.annualHitCount === "number" ? count(testRaw.annualHitCount) :
    matchedFrom.reduce(function (total, row) {
      return total + (row.id.indexOf("g1.ios.2tb.") === 0 ? row.count : 0);
    }, 0);
  var storedOrigin = text(testRaw.targetOrigin, 32);
  var targetOrigin = recordedTarget && /^(?:user-specified|pattern-derived|legacy|custom|profile:.+)$/.test(storedOrigin) ?
    storedOrigin : recordedTarget === DEFAULT_TARGET ? "user-specified" :
      recordedTarget === LEGACY_TARGET ? "legacy" : recordedTarget ? "custom" : "";

  var report = {
    schemaVersion: 1,
    reportVersion: VERSION,
    configuredTarget: CONFIGURED_TARGET,
    storageAvailable: storageAvailable,
    config: currentConfig,
    scan: {
      version: text(scanRaw.version, 32),
      updatedAt: text(scanRaw.updatedAt, 32),
      scannedResponses: count(scanRaw.scannedResponses),
      matchedResponses: count(scanRaw.matchedResponses),
      nonTextResponses: count(scanRaw.nonTextResponses),
      recentResponses: recent(scanRaw.recentResponses),
      truncated: scanRaw.truncated === true,
      limit: 300,
      skus: rows(scanRaw.skus, true)
    },
    test: {
      version: text(testRaw.version, 32),
      updatedAt: text(testRaw.updatedAt, 32),
      sourcePrefix: "g1.ios.2tb.",
      target: recordedTarget || text(testRaw.target, 64),
      targetOrigin: targetOrigin,
      status: text(testRaw.status, 32),
      hitCount: count(testRaw.hitCount),
      annualHitCount: annualHitCount,
      matchedFrom: matchedFrom
    }
  };

  var headers = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-G1-Report-Version": VERSION,
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"
  };
  var exportJSON = query.format === "json";
  console.log("[g1-sku-report-v1] " + VERSION + " " + (exportJSON ? "json" : "html") +
    " storage=" + (storageAvailable ? "ready" : "unavailable") + " candidates=" + report.scan.skus.length);
  if (exportJSON) {
    headers["Content-Type"] = "application/json; charset=utf-8";
    headers["Content-Disposition"] = 'attachment; filename="g1-sku-report.json"';
    $done({ response: { status: 200, headers: headers, body: JSON.stringify(report, null, 2) } });
    return;
  }

  function escape(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }
  function shortTime(iso) {
    if (!iso) return "—";
    return iso.replace("T", " ").replace(/\.\d+Z$/, "Z");
  }
  function table(items, withTime) {
    if (!items.length) return "<p class=empty>Chưa có bản ghi.</p>";
    return "<div class=scroll><table><thead><tr><th>Mã SKU đầy đủ</th><th>Lần</th>" +
      (withTime ? "<th>Gần nhất (UTC)</th><th>Thao tác</th>" : "<th>SKU đích thực tế</th><th>Fallback</th>") + "</tr></thead><tbody>" +
      items.map(function (row) {
        if (withTime) {
          var promoBadge = isPromoSku(row.id) ? " <span class=tag-promo>PROMO</span>" : "";
          var useBtn = VALID_SKU.test(row.id)
            ? "<a class=mini-btn href=\"" + ROOT + "?action=preset&target2tb=" + encodeURIComponent(row.id) + "\">Dùng làm đích 2TB</a>"
            : "";
          return "<tr><td><code>" + escape(row.id) + "</code>" + promoBadge + "</td><td><strong>" + row.count + "</strong></td><td class=mono>" +
            escape(shortTime(row.lastSeen)) + "</td><td>" + useBtn + "</td></tr>";
        }
        return "<tr><td><code>" + escape(row.id) + "</code></td><td><strong>" + row.count + "</strong></td><td><code>" +
          escape(row.to || "Chưa ghi nhận") + "</code></td><td>" +
          (row.fallback ? "<span class=\"st-pill st-warn\">75p</span>" : "<span class=\"st-pill st-muted\">Không</span>") + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }
  function recentTable(events) {
    if (!events.length) return "<p class=empty>Chưa có lịch sử từng response.</p>";
    return "<div class=scroll><table><thead><tr><th>Thời gian (UTC)</th><th>Kênh / Đường dẫn</th><th>Trạng thái</th><th>Thấy</th><th>Mới</th><th>Bỏ qua</th></tr></thead><tbody>" +
      events.slice().reverse().map(function (event) {
        var pathLabel = event.path === NATIVE_PATH ? "App Google One (Native)" : event.path;
        var stCls = statusStyles[event.status] || "st-muted";
        return "<tr><td class=mono>" + escape(shortTime(event.at)) + "</td><td><code>" + escape(pathLabel) +
          "</code></td><td><span class=\"st-pill " + stCls + "\">" + scanStatuses[event.status] + "</span></td><td>" +
          event.candidateCount + "</td><td>" + event.addedCount + "</td><td>" + event.omittedCount + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }

  var latestScan = report.scan.recentResponses.length ?
    report.scan.recentResponses[report.scan.recentResponses.length - 1] : null;
  var statuses = {
    "rewritten": "Đã ghi đè thành công",
    "no-match": "Không khớp SKU nguồn",
    "non-text": "Không phải văn bản",
    "skipped-strict-catalog": "Đã bỏ qua (Strict Catalog)"
  };
  var status = Object.prototype.hasOwnProperty.call(statuses, report.test.status) ?
    statuses[report.test.status] : "Chưa chạy test";

  var profileOptions = [
    { id: "promo-90p", label: "Promo 90p / 75p", desc: "2TB (12T 90p / tùy chỉnh) + 20TB / 30TB ưu đãi" },
    { id: "ultra-1m-free", label: "Ultra 30TB · 1M Free", desc: "Mọi nút → g1.ai.ultra.1month_eft.acq (0đ 1 tháng)" },
    { id: "ultra-free-probe", label: "Dò 11 nút Free", desc: "Thử 11 gói dùng thử dài hạn 1 / 2 / 3 / 6 / 12 tháng" }
  ];
  var profileCards = profileOptions.map(function (item) {
    var isOn = currentConfig.profile === item.id;
    return "<a class=\"pcard" + (isOn ? " active" : "") + "\" href=\"" + ROOT + "?action=profile&profile=" + item.id + "\">" +
      "<div class=pcard-top><span>" + item.label + "</span>" + (isOn ? "<span class=pcard-on>Đang bật</span>" : "") + "</div>" +
      "<div class=pcard-desc>" + item.desc + "</div></a>";
  }).join("");

  var modeOptions = [
    { id: "auto", label: "Tự động (Quét + Ghi đè)" },
    { id: "scan-only", label: "Chỉ quét gốc" },
    { id: "rewrite-only", label: "Chỉ ghi đè" }
  ];
  var modeButtons = modeOptions.map(function (item) {
    var active = currentConfig.mode === item.id ? " active" : "";
    return "<a class=\"pill" + active + "\" href=\"" + ROOT + "?action=mode&mode=" + item.id + "\">" + item.label + "</a>";
  }).join("");

  var presetButtons = PRESETS.map(function (preset) {
    var active = currentConfig.target2tb === preset.id ? " active" : "";
    return "<a class=\"pill" + active + "\" href=\"" + ROOT + "?action=preset&target2tb=" + encodeURIComponent(preset.id) + "\">" +
      escape(preset.label) + "</a>";
  }).join("");

  var activeProfileObj = profileOptions.filter(function (p) { return p.id === currentConfig.profile; })[0] || profileOptions[0];
  var css = [
    ":root{--bg:#f2f4f8;--card:#ffffff;--card2:#f7f9fc;--txt:#0f172a;--muted:#526075;--line:#e2e8f0;--pri:#2563eb;--pri-soft:#eff6ff;--ok-bg:#dcfce7;--ok:#166534;--err-bg:#fee2e2;--err:#991b1b;--warn-bg:#fef3c7;--warn:#92400e;--code:#f1f5f9}",
    "@media (prefers-color-scheme:dark){:root{--bg:#0b1120;--card:#111827;--card2:#1e293b;--txt:#f1f5f9;--muted:#94a3b8;--line:#1f2937;--pri:#3b82f6;--pri-soft:rgba(59,130,246,0.16);--ok-bg:rgba(34,197,94,0.16);--ok:#86efac;--err-bg:rgba(239,68,68,0.16);--err:#fca5a5;--warn-bg:rgba(245,158,11,0.16);--warn:#fcd34d;--code:#1e293b}}",
    "*{box-sizing:border-box}body{font:15px/1.5 -apple-system,BlinkMacSystemFont,sans-serif;max-width:860px;margin:0 auto;padding:14px 14px 36px;color:var(--txt);background:var(--bg);-webkit-text-size-adjust:100%}",
    ".topbar{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:14px}",
    "h1{font-size:21px;margin:0 0 6px;letter-spacing:-0.01em}h2{font-size:17px;margin:0 0 10px}h3{font-size:13px;text-transform:uppercase;letter-spacing:0.04em;color:var(--muted);margin:14px 0 8px}",
    ".badge{display:inline-flex;align-items:center;gap:6px;background:var(--ok-bg);color:var(--ok);padding:4px 10px;border-radius:999px;font-size:12px;font-weight:700}",
    ".actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.actions form{margin:0}",
    "button,.btn,.pill{font:inherit;font-size:14px;font-weight:600;min-height:38px;padding:8px 14px;border:1px solid transparent;border-radius:10px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:6px}",
    ".btn-sec,.pill{background:var(--card);border-color:var(--line);color:var(--txt)}.btn-pri,.pill.active{background:var(--pri);border-color:var(--pri);color:#fff}",
    ".stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0 16px}",
    "@media (max-width:560px){.stats{grid-template-columns:1fr}}",
    ".stat{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px}",
    ".stat-k{font-size:12px;color:var(--muted);font-weight:600}.stat-v{font-size:16px;font-weight:700;margin-top:3px;word-break:break-word}",
    "section{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin:14px 0}",
    ".pcard-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:8px}",
    "@media (max-width:680px){.pcard-grid{grid-template-columns:1fr}}",
    ".pcard{display:block;text-decoration:none;color:var(--txt);background:var(--card2);border:1.5px solid var(--line);border-radius:12px;padding:12px}",
    ".pcard.active{border-color:var(--pri);background:var(--pri-soft)}",
    ".pcard-top{display:flex;justify-content:space-between;align-items:center;gap:6px;font-weight:700;font-size:14px}",
    ".pcard-on{font-size:11px;background:var(--pri);color:#fff;padding:2px 8px;border-radius:999px}.pcard-desc{font-size:12px;color:var(--muted);margin-top:4px}",
    ".pill-row{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 10px}",
    ".alert{padding:11px 14px;border-radius:12px;margin:10px 0;font-weight:600;font-size:14px}",
    ".alert-ok{background:var(--ok-bg);color:var(--ok)}.alert-err{background:var(--err-bg);color:var(--err)}",
    ".adv{margin-top:14px;border-top:1px solid var(--line);padding-top:12px}",
    ".adv summary{cursor:pointer;font-weight:700;font-size:14px;color:var(--pri);padding:4px 0}",
    ".grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0}",
    "@media (max-width:640px){.grid{grid-template-columns:1fr}}",
    ".field label{display:block;font-weight:600;font-size:13px;margin-bottom:4px;color:var(--muted)}",
    ".field input[type=text],.field select{width:100%;font:inherit;font-size:14px;padding:9px 11px;border:1px solid var(--line);border-radius:10px;background:var(--card2);color:var(--txt)}",
    ".toggles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:12px 0}",
    "@media (max-width:640px){.toggles{grid-template-columns:1fr}}",
    ".trow{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 12px;background:var(--card2);border:1px solid var(--line);border-radius:10px;font-size:14px;font-weight:500;cursor:pointer}",
    ".trow input{width:18px;height:18px;accent-color:var(--pri)}",
    "code{overflow-wrap:anywhere;background:var(--code);padding:2px 6px;border-radius:6px;font-size:13px}",
    ".scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}table{border-collapse:collapse;width:100%;font-size:13px}",
    "td,th{padding:9px 8px;border-bottom:1px solid var(--line);text-align:left;vertical-align:middle}th{color:var(--muted);font-weight:600;font-size:12px;text-transform:uppercase}",
    ".mono{font-variant-numeric:tabular-nums;color:var(--muted);font-size:12px;white-space:nowrap}",
    ".note,.empty{color:var(--muted);font-size:13px;margin:6px 0}",
    ".tag-promo{display:inline-block;background:var(--ok-bg);color:var(--ok);font-size:11px;font-weight:700;padding:1px 6px;border-radius:5px;margin-left:4px}",
    ".mini-btn{display:inline-flex;align-items:center;min-height:32px;background:var(--pri-soft);color:var(--pri);padding:4px 10px;border-radius:8px;text-decoration:none;font-size:12px;font-weight:700;white-space:nowrap}",
    ".st-pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap}",
    ".st-ok{background:var(--ok-bg);color:var(--ok)}.st-info{background:var(--pri-soft);color:var(--pri)}.st-warn{background:var(--warn-bg);color:var(--warn)}.st-err{background:var(--err-bg);color:var(--err)}.st-muted{background:var(--code);color:var(--muted)}",
    ".clear-row{display:flex;gap:8px;flex-wrap:wrap}.btn-danger{background:var(--err-bg);color:var(--err);border-color:transparent}"
  ].join("");

  var html = [
    "<!doctype html><html lang=vi><meta charset=utf-8>",
    "<meta name=viewport content=\"width=device-width,initial-scale=1\"><title>ALL IN ONE_V1 · Báo cáo Google One SKU</title>",
    "<style>" + css + "</style>",

    "<div class=topbar><div><h1>ALL IN ONE_V1</h1><span class=badge>● Script nội bộ đang hoạt động · " + VERSION + "</span></div>",
    "<nav class=actions aria-label=\"Thao tác báo cáo\"><form method=get action=\"" + ROOT + "\"><button type=submit name=format value=json class=btn-pri>Xuất JSON</button></form><a class=\"btn btn-sec\" href=\"" + ROOT + "\">Làm mới</a></nav></div>",

    actionMessage ? "<p class=\"alert alert-ok\">" + escape(actionMessage) + "</p>" : "",
    errorMessage ? "<p class=\"alert alert-err\">" + escape(errorMessage) + "</p>" : "",
    storageAvailable ? "" : "<p class=\"alert alert-err\">Giao diện lưu trữ cục bộ chưa sẵn sàng; chưa thể đọc hoặc ghi dữ liệu.</p>",

    "<div class=stats>",
    "<div class=stat><div class=stat-k>Profile đang bật</div><div class=stat-v>" + escape(activeProfileObj.label) + "</div></div>",
    "<div class=stat><div class=stat-k>SKU đã thu thập</div><div class=stat-v>" + report.scan.skus.length + " / 300</div></div>",
    "<div class=stat><div class=stat-k>Ghi đè gần nhất</div><div class=stat-v>" + report.test.hitCount + " vị trí · " + escape(status) + "</div></div>",
    "</div>",

    "<section><h2>Bảng điều khiển nhanh</h2>",
    "<p class=note>Chạm để đổi ngay không cần tắt/bật VPN. Sau khi đổi, đóng hẳn rồi mở lại Google App để tải gói mới.</p>",
    "<h3>1. Chọn Profile mapping</h3><div class=pcard-grid>" + profileCards + "</div>",
    "<h3>2. Chế độ hoạt động</h3><div class=pill-row>" + modeButtons + "</div>",
    "<h3>3. Đổi nhanh mã đích 2TB (khi dùng Promo 90p)</h3><div class=pill-row>" + presetButtons + "</div>",

    "<details class=adv><summary>⚙ Cài đặt nâng cao (Native Protobuf, Strict Catalog, Phạm vi URL & Mã tùy chỉnh)</summary>",
    "<form method=get action=\"" + ROOT + "\"><input type=hidden name=action value=save>",
    "<div class=grid>",
    "<div class=field><label for=profile>Profile mapping</label><select id=profile name=profile>" +
      profileOptions.map(function (item) {
        return "<option value=\"" + item.id + "\"" + (currentConfig.profile === item.id ? " selected" : "") + ">" + item.label + "</option>";
      }).join("") + "</select></div>",
    "<div class=field><label for=target2tb>Mã đích 2TB tùy chỉnh</label><input id=target2tb type=text name=target2tb value=\"" + escape(currentConfig.target2tb) + "\" placeholder=\"g1.2tb.ai.12months_ip_90p\"></div>",
    "<div class=field><label for=mode>Chế độ</label><select id=mode name=mode>" +
      modeOptions.map(function (item) {
        return "<option value=\"" + item.id + "\"" + (currentConfig.mode === item.id ? " selected" : "") + ">" + item.label + "</option>";
      }).join("") + "</select></div>",
    "<div class=field><label for=scope>Phạm vi URL Web</label><select id=scope name=scope>" +
      "<option value=ai" + (currentConfig.rewriteScope === "ai" ? " selected" : "") + ">Chỉ /ai? (Chuẩn & an toàn)</option>" +
      "<option value=extended" + (currentConfig.rewriteScope === "extended" ? " selected" : "") + ">Mở rộng (/ai?, /upsell, /plans, /storage, batchexecute)</option>" +
      "</select></div>",
    "<div class=field><label for=native>App Google One riêng (Native Protobuf)</label><select id=native name=native>" +
      "<option value=scan" + (currentConfig.nativeMode === "scan" ? " selected" : "") + ">Chỉ quét SKU (An toàn)</option>" +
      "<option value=rewrite" + (currentConfig.nativeMode === "rewrite" ? " selected" : "") + ">Quét + Ghi đè Protobuf (Thử nghiệm)</option>" +
      "<option value=off" + (currentConfig.nativeMode === "off" ? " selected" : "") + ">Tắt xử lý Native</option>" +
      "</select></div>",
    "</div>",
    "<div class=toggles>",
    "<label class=trow><span>Bật gói 2TB</span><input type=checkbox name=e2tb value=1" + (currentConfig.enable2tb ? " checked" : "") + "></label>",
    "<label class=trow><span>Bật gói 20TB</span><input type=checkbox name=e20tb value=1" + (currentConfig.enable20tb ? " checked" : "") + "></label>",
    "<label class=trow><span>Bật gói 30TB</span><input type=checkbox name=e30tb value=1" + (currentConfig.enable30tb ? " checked" : "") + "></label>",
    "<label class=trow><span>Strict Catalog (Chỉ sửa khi có promo)</span><input type=checkbox name=strict value=1" + (currentConfig.strictCatalog ? " checked" : "") + "></label>",
    "<label class=trow><span>Bảng nổi trên trang Google</span><input type=checkbox name=overlay value=1" + (currentConfig.overlayPanel ? " checked" : "") + "></label>",
    "<label class=trow><span>Thông báo iOS</span><input type=checkbox name=notify value=1" + (currentConfig.notify ? " checked" : "") + "></label>",
    "</div>",
    "<button class=btn-pri type=submit>Lưu cấu hình</button></form></details></section>",

    "<section><h2>Lần chạy mapping gần nhất</h2>",
    "<p class=note>Script: <code>" + escape(report.test.version || "Chưa có") + "</code> · Profile: <code>" + escape(currentConfig.profile) +
      "</code> · Đích: <code>" + escape(report.test.target || CONFIGURED_TARGET) + "</code> · Lúc: " + escape(shortTime(report.test.updatedAt)) + "</p>",
    table(report.test.matchedFrom, false), "</section>",

    "<section><h2>Danh sách SKU thu thập được (Ưu tiên PROMO lên đầu)</h2>",
    "<p class=note>Tổng: <strong>" + report.scan.skus.length + " / 300</strong> mã (trích xuất trước khi ghi đè; bấm <em>Dùng làm đích 2TB</em> để gán nhanh).</p>",
    report.scan.truncated ? "<p class=\"alert alert-err\">Đã đạt giới hạn 300 mã; hãy xuất JSON rồi xóa danh sách quét trước khi thu thập đợt mới.</p>" : "",
    table(report.scan.skus, true), "</section>",

    "<section><h2>Chẩn đoán hoạt động quét</h2>",
    "<p class=note>Script quét: <code>" + escape(report.scan.version || "Chưa có") + "</code> · Văn bản: <strong>" + report.scan.scannedResponses +
      "</strong> · Phi văn bản: <strong>" + report.scan.nonTextResponses + "</strong> · Có SKU: <strong>" + report.scan.matchedResponses +
      "</strong> · Cập nhật: " + escape(shortTime(report.scan.updatedAt)) + "</p>",
    latestScan ? "<p class=note>Response gần nhất: <strong>" + scanStatuses[latestScan.status] + "</strong> (thấy " +
      latestScan.candidateCount + ", mới " + latestScan.addedCount + ", bỏ qua " + latestScan.omittedCount + ").</p>" : "",
    recentTable(report.scan.recentResponses), "</section>",

    "<section><h2>Dọn dữ liệu cục bộ</h2>",
    "<div class=clear-row>",
    "<form method=get action=\"" + ROOT + "\"><button class=btn-danger name=clear value=1>Xóa dữ liệu quét &amp; test</button></form>",
    "<form method=get action=\"" + ROOT + "\"><button class=btn-sec name=clear value=scan>Chỉ xóa danh sách quét</button></form>",
    "<form method=get action=\"" + ROOT + "\"><button class=btn-sec name=clear value=test>Chỉ xóa kết quả test</button></form>",
    "<form method=get action=\"" + ROOT + "\"><button class=btn-sec name=clear value=config>Đặt lại cấu hình ALL IN ONE_V1</button></form>",
    "</div></section></html>"
  ].join("");
  $done({ response: { status: 200, headers: headers, body: html } });
})();
