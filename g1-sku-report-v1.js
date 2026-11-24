/* Local-only Vietnamese report & Control Panel for ALL IN ONE_V1 (Shadowrocket / Loon / Surge). */
"use strict";

(function () {
  var ROOT = "https://one.google.com/g1-sku-report";
  var VERSION = "aio-v1.0";
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
    { id: "g1.2tb.ai.annual", label: "2TB Năm (g1.2tb.ai.annual)" },
    { id: "g1.2tb.ai.annual_ip_90p.acq", label: "Năm 90p ACQ" },
    { id: "g1.2tb.ai.3months_ip_90p.acq", label: "3 tháng 90p ACQ" }
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
      mode: "auto",
      target2tb: DEFAULT_TARGET,
      enable2tb: true,
      enable20tb: true,
      enable30tb: true,
      rewriteScope: "ai",
      nativeMode: "scan",
      strictCatalog: false,
      notify: true
    };
    var saved = load(CONFIG_KEY);
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
      if (query.mode === "auto" || query.mode === "scan-only" || query.mode === "rewrite-only") {
        cfg.mode = query.mode;
      }
      cfg.rewriteScope = query.scope === "extended" ? "extended" : "ai";
      if (query.native === "scan" || query.native === "rewrite" || query.native === "off") {
        cfg.nativeMode = query.native;
      }
      cfg.strictCatalog = query.strict === "1";
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
    return /(?:acq|_90p|_75p|12months|annual|3months)/i.test(id);
  }
  function rows(value, withTime, defaultTarget) {
    if (!Array.isArray(value)) return [];
    return value.slice(0, 300).filter(function (row) {
      return row && typeof row.id === "string" &&
        /^(?:g\d+\.(?:ios|ai)\.|g1\.|com\.google\.one\.)[A-Za-z0-9._-]{1,160}$/.test(row.id);
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
    "known-skus": "Đã nhận response, SKU trùng bản ghi cũ",
    "no-skus": "Response không chứa mã SKU",
    "limit-reached": "Có SKU mới nhưng đã đạt giới hạn 300 mã",
    "non-text": "Response không phải văn bản / nhị phân hợp lệ"
  };
  var scanPaths = ["/", "/ai", "/plans", "/_/…/data/batchexecute", NATIVE_PATH, OTHER_PATH];
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
  var targetOrigin = recordedTarget && /^(?:user-specified|pattern-derived|legacy|custom)$/.test(storedOrigin) ?
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
      target: recordedTarget,
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
  function table(items, withTime) {
    if (!items.length) return "<p>Chưa có bản ghi.</p>";
    return "<div class=scroll><table><thead><tr><th>Mã SKU đầy đủ</th><th>Số lần</th>" +
      (withTime ? "<th>Lần thấy gần nhất (UTC)</th><th>Thao tác nhanh</th>" : "<th>SKU đích thực tế</th><th>Dự phòng</th>") + "</tr></thead><tbody>" +
      items.map(function (row) {
        if (withTime) {
          var promoBadge = isPromoSku(row.id) ? " <span class=tag-promo>PROMO</span>" : "";
          var useBtn = VALID_SKU.test(row.id)
            ? "<a class=mini-btn href=\"" + ROOT + "?action=preset&target2tb=" + encodeURIComponent(row.id) + "\">Dùng làm đích 2TB</a>"
            : "";
          return "<tr><td><code>" + escape(row.id) + "</code>" + promoBadge + "</td><td>" + row.count + "</td><td>" +
            escape(row.lastSeen) + "</td><td>" + useBtn + "</td></tr>";
        }
        return "<tr><td><code>" + escape(row.id) + "</code></td><td>" + row.count + "</td><td><code>" +
          escape(row.to || "Chưa ghi nhận") + "</code></td><td>" + (row.fallback ? "75p" : "Không") + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }
  function recentTable(events) {
    if (!events.length) return "<p>Chưa có lịch sử từng response.</p>";
    return "<div class=scroll><table><thead><tr><th>Thời gian (UTC)</th><th>Kênh / Đường dẫn</th><th>Kết quả</th><th>Nhận diện</th><th>Thêm mới</th><th>Ngoài giới hạn</th></tr></thead><tbody>" +
      events.slice().reverse().map(function (event) {
        var pathLabel = event.path === NATIVE_PATH ? "App Google One (Native Protobuf)" : event.path;
        return "<tr><td>" + escape(event.at) + "</td><td>" + escape(pathLabel) +
          "</td><td>" + scanStatuses[event.status] + "</td><td>" + event.candidateCount +
          "</td><td>" + event.addedCount + "</td><td>" + event.omittedCount + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }

  var latestScan = report.scan.recentResponses.length ?
    report.scan.recentResponses[report.scan.recentResponses.length - 1] : null;
  var statuses = {
    "rewritten": "Đã thực hiện ghi đè chuỗi / Protobuf",
    "no-match": "Response lần này không khớp SKU nguồn nào trong 3 mức",
    "non-text": "Response lần này không có nội dung văn bản để xử lý",
    "skipped-strict-catalog": "Đã bỏ qua (Strict Catalog bật, tài khoản chưa có mã .acq / 90p / 75p)"
  };
  var status = Object.prototype.hasOwnProperty.call(statuses, report.test.status) ?
    statuses[report.test.status] : "Chưa có bản ghi chạy test";

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

  var html = [
    "<!doctype html><html lang=vi><meta charset=utf-8>",
    "<meta name=viewport content=\"width=device-width,initial-scale=1\"><title>ALL IN ONE_V1 · Báo cáo Google One SKU</title>",
    "<style>body{font:15px/1.55 -apple-system,BlinkMacSystemFont,sans-serif;max-width:980px;margin:20px auto;padding:0 16px;color:#1c2737;background:#f5f7fa}section{background:white;border:1px solid #dde3ec;border-radius:12px;padding:18px;margin:16px 0}h1{font-size:23px;margin-bottom:8px}h2{font-size:19px;margin-top:0}h3{font-size:16px;margin-bottom:8px}code{overflow-wrap:anywhere;background:#f0f4f9;padding:2px 5px;border-radius:4px}a{color:#1259be}table{border-collapse:collapse;width:100%;font-size:14px}td,th{padding:8px;border-bottom:1px solid #e3e8f0;text-align:left;vertical-align:top}.scroll{overflow:auto}.note{color:#4b5b70;font-size:14px}.badge{display:inline-block;background:#e0f4e8;color:#176238;padding:4px 10px;border-radius:8px;font-weight:600}.tag-promo{display:inline-block;background:#dcfce7;color:#166534;font-size:11px;font-weight:700;padding:1px 6px;border-radius:5px;margin-left:4px}.mini-btn{display:inline-block;background:#eef3fb;color:#1259be;padding:4px 8px;border-radius:6px;text-decoration:none;font-size:12px;font-weight:600;white-space:nowrap}.alert{padding:10px 14px;border-radius:8px;margin:12px 0;font-weight:500}.alert-ok{background:#e3f6eb;color:#135d34;border:1px solid #b8e6ca}.alert-err{background:#fdecea;color:#9b2219;border:1px solid #f5c2be}.actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:16px 0}.actions form{margin:0}button,.actions a,.pill{font:inherit;padding:8px 14px;border:0;border-radius:8px;cursor:pointer;text-decoration:none;display:inline-block}.actions a,.pill{background:#e8eef6;color:#1c2737}.actions button,.btn-primary{background:#1259be;color:white}.pill-row{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 14px}.pill.active{background:#1259be;color:white;font-weight:600}.grid{display:grid;gap:10px;margin:12px 0}.field label{display:block;font-weight:600;margin-bottom:4px}.field input[type=text],.field select{width:100%;box-sizing:border-box;font:inherit;padding:8px 10px;border:1px solid #c7d1df;border-radius:8px}.checks{display:flex;gap:14px;flex-wrap:wrap;margin:10px 0}.checks label{display:flex;align-items:center;gap:6px;cursor:pointer}.danger{background:#fbe9e7;color:#a5281b}.clear-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}</style>",
    "<h1>ALL IN ONE_V1 · Báo cáo Google One SKU</h1>",
    "<p class=badge>Script nội bộ đang hoạt động · " + VERSION + "</p>",
    "<nav class=actions aria-label=\"Thao tác báo cáo\"><form method=get action=\"" + ROOT + "\"><button type=submit name=format value=json>Xuất JSON</button></form><a href=\"" + ROOT + "\">Làm mới báo cáo</a></nav>",
    "<p class=note>Hỗ trợ cả WebView (<code>one.google.com</code>) &amp; App Google One riêng (Native Protobuf).</p>",
    actionMessage ? "<p class=\"alert alert-ok\">" + escape(actionMessage) + "</p>" : "",
    errorMessage ? "<p class=\"alert alert-err\">" + escape(errorMessage) + "</p>" : "",
    storageAvailable ? "" : "<p class=\"alert alert-err\">Giao diện lưu trữ cục bộ chưa sẵn sàng; chưa thể đọc hoặc ghi dữ liệu.</p>",

    "<section><h2>Bảng điều khiển ALL IN ONE_V1</h2>",
    "<p class=note>Thay đổi áp dụng ngay lập tức cho <strong>G1 ALL IN ONE_V1</strong> mà không cần tắt/bật VPN.</p>",
    "<h3>Chế độ hoạt động nhanh</h3><div class=pill-row>" + modeButtons + "</div>",
    "<h3>Chọn nhanh mã đích 2TB</h3><div class=pill-row>" + presetButtons + "</div>",
    "<form method=get action=\"" + ROOT + "\"><input type=hidden name=action value=save>",
    "<div class=grid>",
    "<div class=field><label for=target2tb>Mã SKU đích 2TB tùy chỉnh</label><input id=target2tb type=text name=target2tb value=\"" + escape(currentConfig.target2tb) + "\" placeholder=\"g1.2tb.ai.12months_ip_90p\"></div>",
    "<div class=field><label for=mode>Chế độ</label><select id=mode name=mode>" +
      modeOptions.map(function (item) {
        return "<option value=\"" + item.id + "\"" + (currentConfig.mode === item.id ? " selected" : "") + ">" + item.label + "</option>";
      }).join("") + "</select></div>",
    "<div class=field><label for=scope>Phạm vi URL Web</label><select id=scope name=scope>" +
      "<option value=ai" + (currentConfig.rewriteScope === "ai" ? " selected" : "") + ">Chỉ /ai? (Chuẩn & an toàn)</option>" +
      "<option value=extended" + (currentConfig.rewriteScope === "extended" ? " selected" : "") + ">Mở rộng (/ai?, /plans, batchexecute)</option>" +
      "</select></div>",
    "<div class=field><label for=native>App Google One riêng (Native Protobuf)</label><select id=native name=native>" +
      "<option value=scan" + (currentConfig.nativeMode === "scan" ? " selected" : "") + ">Chỉ quét SKU (An toàn)</option>" +
      "<option value=rewrite" + (currentConfig.nativeMode === "rewrite" ? " selected" : "") + ">Quét + Ghi đè Protobuf (Thử nghiệm)</option>" +
      "<option value=off" + (currentConfig.nativeMode === "off" ? " selected" : "") + ">Tắt xử lý Native</option>" +
      "</select></div>",
    "</div>",
    "<div class=checks>",
    "<label><input type=checkbox name=e2tb value=1" + (currentConfig.enable2tb ? " checked" : "") + "> Bật 2TB</label>",
    "<label><input type=checkbox name=e20tb value=1" + (currentConfig.enable20tb ? " checked" : "") + "> Bật 20TB</label>",
    "<label><input type=checkbox name=e30tb value=1" + (currentConfig.enable30tb ? " checked" : "") + "> Bật 30TB</label>",
    "<label><input type=checkbox name=strict value=1" + (currentConfig.strictCatalog ? " checked" : "") + "> Strict Catalog (Chỉ sửa khi có .acq)</label>",
    "<label><input type=checkbox name=notify value=1" + (currentConfig.notify ? " checked" : "") + "> Thông báo iOS</label>",
    "</div>",
    "<button class=btn-primary type=submit>Lưu cấu hình</button></form></section>",

    "<section><h2>Chẩn đoán hoạt động quét</h2>",
    "<p>Script quét thực tế: <code>" + escape(report.scan.version || "Chưa có bản ghi") + "</code></p>",
    "<p>Response đã quét: " + report.scan.scannedResponses + "; Phi văn bản: " + report.scan.nonTextResponses +
      "; Có SKU: " + report.scan.matchedResponses + "; Tổng mã tích lũy: " + report.scan.skus.length + "</p>",
    "<p>Lưu gần nhất (UTC): " + escape(report.scan.updatedAt || "Chưa có") + "</p>",
    latestScan ? "<p><strong>Response gần nhất: " + scanStatuses[latestScan.status] + "</strong><br>Nhận diện " +
      latestScan.candidateCount + " mã khác nhau, thêm mới " + latestScan.addedCount + " mã, bỏ qua do đầy " + latestScan.omittedCount + " mã.</p>" : "",
    "<h3>10 response gần nhất</h3>", recentTable(report.scan.recentResponses), "</section>",

    "<section><h2>Lần chạy mapping 3 mức gần nhất</h2>",
    "<p>Mã đích 2TB đang cấu hình: <code>" + escape(CONFIGURED_TARGET) + "</code></p>",
    "<p>Phiên bản script: " + escape(report.test.version || "Chưa có") + "<br>Trạng thái: " + escape(status) +
      "; Tổng số lần thay thế: " + report.test.hitCount + "; Trong đó 2TB: " + report.test.annualHitCount + "</p>",
    "<p>Mã 2TB ghi nhận: <code>" + escape(report.test.target || "Chưa ghi nhận") +
      "</code> | Thời gian (UTC): " + escape(report.test.updatedAt || "Chưa có") + "</p>",
    table(report.test.matchedFrom, false), "</section>",

    "<section><h2>Danh sách SKU thu thập được (Ưu tiên PROMO lên đầu)</h2>",
    "<p>Tổng mã tích lũy: " + report.scan.skus.length + " / 300 (trích xuất trước khi ghi đè; bấm <em>Dùng làm đích 2TB</em> để gán nhanh).</p>",
    report.scan.truncated ? "<p class=\"alert alert-err\">Đã đạt giới hạn 300 mã; hãy xuất JSON rồi xóa danh sách quét trước khi thu thập đợt mới.</p>" : "",
    table(report.scan.skus, true),
    "<p>Cập nhật (UTC): " + escape(report.scan.updatedAt || "Chưa có") + "</p></section>",

    "<section><h2>Dọn dữ liệu</h2>",
    "<div class=clear-row>",
    "<form method=get action=\"" + ROOT + "\"><button class=danger name=clear value=1>Xóa dữ liệu quét &amp; test</button></form>",
    "<form method=get action=\"" + ROOT + "\"><button name=clear value=scan>Chỉ xóa danh sách quét</button></form>",
    "<form method=get action=\"" + ROOT + "\"><button name=clear value=test>Chỉ xóa kết quả test</button></form>",
    "<form method=get action=\"" + ROOT + "\"><button name=clear value=config>Đặt lại cấu hình ALL IN ONE_V1</button></form>",
    "</div></section></html>"
  ].join("");
  $done({ response: { status: 200, headers: headers, body: html } });
})();
