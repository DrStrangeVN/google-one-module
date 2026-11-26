/* Local-only Vietnamese Liquid Glass Studio & Control Panel for ALL IN ONE_V1 (v2.8.2). */
"use strict";

(function () {
  var ROOT = "https://one.google.com/g1-sku-report";
  var VERSION = "aio-v2.8.2";
  var DEFAULT_TARGET = "g1.2tb.ai.12months_ip_90p";
  var LEGACY_TARGET = "g1.2tb.ai.annual";
  var SCAN_KEY = "g1.sku.scan.v1";
  var TEST_KEY = "g1.pro.annual.test.v1";
  var CONFIG_KEY = "g1.config.v1";
  var MAX_CUSTOM_RULES = 24;
  var OTHER_PATH = "[Đường dẫn one.google.com khác]";
  var LEGACY_OTHER_PATH = "[其他 one.google.com 路径]";
  var NATIVE_PATH = "native:GetDynamicStorefrontInfo";
  var VALID_SKU = /^(?:g1\.|com\.google\.one\.|com\.google\.gemini\.)[A-Za-z0-9._-]{1,160}$/;
  var VALID_TOKEN = /^(?:g\d+\.[A-Za-z0-9_-]+\.|com\.google\.one\.|com\.google\.gemini\.)[A-Za-z0-9._-]{1,160}$/;
  var VALID_PREFIX = /^(?:g\d+\.|com\.google\.one\.|com\.google\.gemini\.)[A-Za-z0-9._-]{1,159}\.$/;

  var PRESETS = [
    { id: "g1.2tb.ai.12months_ip_90p", label: "12T Giảm 90% (v7.5)" },
    { id: "com.google.gemini.2tb.ai.m.3month_ip_99p", label: "Pro 3T 99% (Gemini)" },
    { id: "g1.ai.ultra.1month_eft.acq", label: "Ultra 30TB · 1T Free" },
    { id: "g1.ai.ultra.3months_ip_75p.acq", label: "Ultra 30TB · 3T 75p" },
    { id: "g1.20tb.1month_eft.acq", label: "Ultra 20TB · 1T Free" },
    { id: "g1.2tb.ai.12months_eft.acq", label: "Pro 12T Free (.acq)" },
    { id: "g1.2tb.ai.18months_eft", label: "Pro 18T Free (Play)" }
  ];

  var IPHONE_PACKS = [
    {
      id: "iphone-1-ultra-1m",
      rank: "HẠNG 1 · 0đ / 1 THÁNG",
      cls: "st-ok",
      title: "Ultra 30TB · 1 tháng 0đ",
      app: "Google App (chữ G) · hoặc Gmail / Photos / NotebookLM",
      guide: "Dùng Gmail phụ sạch → bấm gói bất kỳ (ưu tiên Ultra 30TB) → kiểm tra giá 0đ trên StoreKit → hủy gia hạn ngay trong Apple Subscriptions. Có thanh nổi HUD.",
      cfg: {
        profile: "ultra-1m-free",
        target2tb: "g1.ai.ultra.1month_eft.acq",
        mode: "auto",
        rewriteScope: "ai",
        nativeMode: "scan",
        enable2tb: true,
        enable20tb: true,
        enable30tb: true,
        strictCatalog: false,
        overlayPanel: true,
        notify: true,
        customRulesOverride: false
      }
    },
    {
      id: "iphone-2-gemini-99p",
      rank: "HẠNG 2 · GIẢM 99% / 3T",
      cls: "st-ok",
      title: "AI Pro 2TB · 3 tháng giảm 99%",
      app: "Bắt buộc mở App Gemini (iOS) → Upgrade",
      guide: "Tự bật Phạm vi Mở rộng + Native Rewrite + Thông báo iOS. Bấm gói AI Pro 2TB → xem giá StoreKit (app Gemini dùng giao diện gốc nên không hiện thanh nổi HTML; nhìn banner thông báo iOS hoặc mở Studio; gốc ưu đãi Ấn Độ).",
      cfg: {
        profile: "promo-90p",
        target2tb: "com.google.gemini.2tb.ai.m.3month_ip_99p",
        mode: "auto",
        rewriteScope: "extended",
        nativeMode: "rewrite",
        enable2tb: true,
        enable20tb: true,
        enable30tb: true,
        strictCatalog: false,
        overlayPanel: true,
        notify: true,
        customRulesOverride: false
      }
    },
    {
      id: "iphone-3-pro-12m-90p",
      rank: "HẠNG 3 · BỀN CẢ NĂM",
      cls: "st-info",
      title: "AI Pro 2TB · 12 tháng giảm 90%",
      app: "Google App (chữ G) → Quản lý Google One",
      guide: "Chọn gói 2TB / AI Pro (~10% giá gốc suốt 12 tháng, có trả tiền thật nên ổn định nhất và ít lo rớt quyền). Có thanh nổi HUD.",
      cfg: {
        profile: "promo-90p",
        target2tb: "g1.2tb.ai.12months_ip_90p",
        mode: "auto",
        rewriteScope: "ai",
        nativeMode: "scan",
        enable2tb: true,
        enable20tb: true,
        enable30tb: true,
        strictCatalog: false,
        overlayPanel: true,
        notify: true,
        customRulesOverride: false
      }
    },
    {
      id: "iphone-4-ultra-75p",
      rank: "HẠNG 4 · DỰ PHÒNG v7.8",
      cls: "st-warn",
      title: "Ultra 20TB / 30TB · 3 tháng giảm 75%",
      app: "Google App (chữ G) → Quản lý Google One",
      guide: "Ép thẳng giảm 75% (trả 25% trong 3 tháng) cho nút Ultra 20TB & 30TB — bật ngay khi gói 0đ và 90p báo lỗi. Có thanh nổi HUD.",
      cfg: {
        profile: "ultra-75p",
        target2tb: "g1.2tb.ai.12months_ip_90p",
        mode: "auto",
        rewriteScope: "ai",
        nativeMode: "scan",
        enable2tb: true,
        enable20tb: true,
        enable30tb: true,
        strictCatalog: false,
        overlayPanel: true,
        notify: true,
        customRulesOverride: false
      }
    },
    {
      id: "iphone-5-hybrid-combo",
      rank: "HẠNG 5 · ĐA NĂNG",
      cls: "st-info",
      title: "Combo 2TB Free + Ultra 90p / 75p",
      app: "Google App (chữ G) → Quản lý Google One",
      guide: "Nút 2TB → Ultra 30TB 1 tháng 0đ; nút 20TB / 30TB giữ giảm 90% (tự lùi về 75%). Một lần mở trang thử được cả 2 nhóm ưu đãi. Có thanh nổi HUD.",
      cfg: {
        profile: "hybrid-combo",
        target2tb: "g1.ai.ultra.1month_eft.acq",
        mode: "auto",
        rewriteScope: "ai",
        nativeMode: "scan",
        enable2tb: true,
        enable20tb: true,
        enable30tb: true,
        strictCatalog: false,
        overlayPanel: true,
        notify: true,
        customRulesOverride: false
      }
    }
  ];

  var COMMON_IOS_SOURCES = [
    { id: "g1.ios.30gb.m", label: "30 GB · Tháng (g1.ios.30gb.m)" },
    { id: "g1.ios.100gb.m", label: "100 GB · Tháng (g1.ios.100gb.m)" },
    { id: "g1.ios.helium.m", label: "AI Plus 400GB · Tháng (g1.ios.helium.m)" },
    { id: "g1.ios.helium.m.1month_ip_90p.acq", label: "AI Plus · 1T 90p (g1.ios.helium.m.1month_ip_90p.acq)" },
    { id: "g1.ios.2tb.m", label: "2 TB · Tháng (g1.ios.2tb.m)" },
    { id: "g1.ios.2tb.m.3month_ip_75p", label: "2 TB · 3T 75p (g1.ios.2tb.m.3month_ip_75p)" },
    { id: "g1.ios.2tb.ai.m", label: "AI Pro 5TB · Tháng (g1.ios.2tb.ai.m)" },
    { id: "g1.ios.2tb.ai.a", label: "AI Pro 5TB · Năm (g1.ios.2tb.ai.a)" },
    { id: "com.google.gemini.2tb.ai.m", label: "Gemini AI Pro 2TB · Tháng (com.google.gemini.2tb.ai.m)" },
    { id: "g1.ios.ai.2tb.m.ip_1mo_90p.acq", label: "AI 2TB · 1T 90p (g1.ios.ai.2tb.m.ip_1mo_90p.acq)" },
    { id: "g1.ios.ai.2tb.a.ip_1yr_10p.acq", label: "AI 2TB · 1Y 10p (g1.ios.ai.2tb.a.ip_1yr_10p.acq)" },
    { id: "g1.ios.20tb.m.v2", label: "Ultra 20TB · Tháng (g1.ios.20tb.m.v2)" },
    { id: "g1.ios.30tb.ai.pro.m", label: "Ultra 30TB · Tháng (g1.ios.30tb.ai.pro.m)" }
  ];

  var VAULT_GROUPS = [
    {
      title: "iOS · Google AI Ultra 30TB Dùng thử miễn phí (_eft.acq)",
      items: [
        { id: "g1.ai.ultra.1month_eft.acq", tag: "iOS · FREE 0đ", cls: "st-ok", note: "30TB · 1 tháng miễn phí (chuẩn v7.6 / gg-ultra-1M)" },
        { id: "g1.ai.ultra.2months_eft.acq", tag: "iOS · FREE 0đ", cls: "st-ok", note: "30TB · 2 tháng miễn phí" },
        { id: "g1.ai.ultra.3months_eft.acq", tag: "iOS · FREE 0đ", cls: "st-ok", note: "30TB · 3 tháng miễn phí" },
        { id: "g1.ai.ultra.6months_eft.acq", tag: "iOS · FREE 0đ", cls: "st-ok", note: "30TB · 6 tháng miễn phí" },
        { id: "g1.ai.ultra.12months_eft.acq", tag: "iOS · FREE 0đ", cls: "st-ok", note: "30TB · 12 tháng miễn phí" }
      ]
    },
    {
      title: "iOS & Play · AI Pro & Ultra 20TB Dùng thử (_eft)",
      items: [
        { id: "g1.20tb.1month_eft.acq", tag: "iOS · FREE 0đ", cls: "st-ok", note: "Ultra 20TB · 1 tháng miễn phí (v7.6)" },
        { id: "g1.20tb.3months_eft.acq", tag: "iOS · FREE 0đ", cls: "st-ok", note: "Ultra 20TB · 3 tháng miễn phí" },
        { id: "g1.20tb.12months_eft.acq", tag: "iOS · FREE 0đ", cls: "st-ok", note: "Ultra 20TB · 12 tháng miễn phí" },
        { id: "g1.2tb.ai.12months_eft.acq", tag: "iOS · FREE 0đ", cls: "st-ok", note: "AI Pro · 12 tháng miễn phí" },
        { id: "g1.ai.pro.12months_eft", tag: "THỬ 12T 0đ", cls: "st-ok", note: "AI Pro / Ultra · 12 tháng miễn phí (thử nghiệm xinnyu)" },
        { id: "g1.2tb.ai.18months_eft", tag: "Play ID", cls: "st-warn", note: "AI Pro · 18 tháng (Android Play ID, không có .acq)" },
        { id: "g1.2tb.ai.15months_eft", tag: "Play ID", cls: "st-warn", note: "AI Pro · 15 tháng 0đ (Android Play ID, mới v8.0)" },
        { id: "g1.2tb.ai.12months_eft", tag: "Play ID", cls: "st-warn", note: "AI Pro · 12 tháng 0đ (Android Play ID, không .acq)" },
        { id: "g1.2tb.1year_eft", tag: "Play ID", cls: "st-warn", note: "AI Plus 2TB · 12 tháng 0đ (Android Play ID)" }
      ]
    },
    {
      title: "iOS, Gemini & Play · Intro Price Giảm 50% – 99% (_ip_)",
      items: [
        { id: "com.google.gemini.2tb.ai.m.3month_ip_99p", tag: "Gemini · 99%", cls: "st-ok", note: "AI Pro 2TB · 3 tháng giảm 99% (mở trong app Gemini iOS)" },
        { id: "g1.2tb.ai.12months_ip_90p", tag: "GIẢM 90%", cls: "st-info", note: "AI Pro · 12 tháng giảm 90% (v7.5/v7.6)" },
        { id: "g1.20tb.3months_ip_90p.acq", tag: "iOS · GIẢM 90%", cls: "st-info", note: "Ultra 20TB · 3 tháng giảm 90%" },
        { id: "g1.20tb.3months_ip_80p", tag: "GIẢM 80%", cls: "st-info", note: "Ultra 20TB · 3 tháng giảm 80%" },
        { id: "g1.20tb.3months_ip_75p.acq", tag: "iOS · GIẢM 75%", cls: "st-warn", note: "Ultra 20TB · 3 tháng giảm 75%" },
        { id: "g1.ai.ultra.3months_ip_90p.acq", tag: "iOS · GIẢM 90%", cls: "st-info", note: "Ultra 30TB · 3 tháng giảm 90%" },
        { id: "g1.ai.ultra.3months_ip_75p.acq", tag: "iOS · GIẢM 75%", cls: "st-warn", note: "Ultra 30TB · 3 tháng giảm 75%" },
        { id: "g1.ios.ai.2tb.m.ip_3mo_75p.acq", tag: "iOS · GIẢM 75%", cls: "st-warn", note: "AI 2TB · 3 tháng giảm 75% (sku-atlas thực tế)" },
        { id: "g1.ios.helium.m.3month_ip_75p.acq", tag: "iOS · GIẢM 75%", cls: "st-warn", note: "AI Plus 400GB · 3 tháng giảm 75% (sku-atlas thực tế)" },
        { id: "g1.2tb.ai.2months_ip_50p", tag: "GIẢM 50%", cls: "st-info", note: "AI Pro · 2 tháng giảm 50% (sku-atlas thực tế)" },
        { id: "g1.2tb.ai.1month_ip_95p.acq", tag: "iOS · GIẢM 95%", cls: "st-info", note: "AI Pro · Tháng đầu giảm 95% (khách mới)" },
        { id: "g1.helium.12months_ip_90p", tag: "Play ID", cls: "st-warn", note: "AI Plus 400GB · 12 tháng giảm 90% (Android Play ID)" },
        { id: "g1.10tb.1month_ip_90p", tag: "Play ID · 90%", cls: "st-warn", note: "Pro 10TB · 1 tháng giảm 90% (Android Play)" },
        { id: "g1.10tb.3months_ip_85p", tag: "Play ID · 85%", cls: "st-warn", note: "Pro 10TB · 3 tháng giảm 85% (Android Play)" }
      ]
    },
    {
      title: "Play & Chuẩn · Stacking, Gói Năm & Mã Cũ",
      items: [
        { id: "g1.ios.30tb.m", tag: "iOS · TR CŨ", cls: "st-info", note: "Ultra 30TB · Mã iOS cũ (v7.10 ghi nhận 2.949,99 TRY)" },
        { id: "g1.2tb.ai.subs_variant", tag: "Play ID", cls: "st-warn", note: "AI Pro · Stacking variant (Android Play)" },
        { id: "g1.2tb.ai.annual", tag: "NĂM", cls: "st-muted", note: "AI Pro · Gói năm tiêu chuẩn" },
        { id: "g1.2tb.ai.annual_ip_90p.acq", tag: "iOS · GIẢM 90%", cls: "st-info", note: "AI Pro · Gói năm giảm 90%" }
      ]
    }
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
  var redirectLocation = "";
  var redirectAuto = true;
  var prefillFrom = "";
  if (typeof query.prefillFrom === "string") {
    var candFrom = query.prefillFrom.trim();
    if (VALID_TOKEN.test(candFrom) || VALID_PREFIX.test(candFrom)) {
      prefillFrom = candFrom;
    }
  }
  var activeTab = resolveInitialTab();

  handleActions();
  if (redirectLocation) {
    console.log("[g1-sku-report-v1] " + VERSION + (redirectAuto ? " bounce-back" : " confirm-back"));
    var safeRedirect = escape(redirectLocation);
    var bounceMeta = redirectAuto ? '<meta http-equiv="refresh" content="0;url=' + safeRedirect + '">' : "";
    var bounceHtml =
      "<!doctype html><html lang=vi><meta charset=utf-8>" +
      "<meta name=viewport content=\"width=device-width,initial-scale=1,viewport-fit=cover\">" +
      bounceMeta +
      "<title>ALL IN ONE_V1 · Đang áp dụng</title>" +
      "<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:18px;background:#0C0E14;color:#F3F5F9;font:14px/1.5 -apple-system,BlinkMacSystemFont,\"SF Pro Text\",sans-serif}" +
      ".box{max-width:460px;width:100%;background:#151822;border:1px solid rgba(255,255,255,0.14);border-radius:16px;padding:18px}" +
      "h1{margin:0 0 8px;font-size:16px}p{margin:0 0 14px;color:#A7B0C5;font-size:13px}" +
      ".acts{display:flex;gap:8px;flex-wrap:wrap}.btn{display:inline-flex;align-items:center;justify-content:center;padding:9px 14px;border-radius:99px;font-weight:600;font-size:13px;text-decoration:none}" +
      ".pri{background:#2563EB;color:#fff}.sec{background:rgba(255,255,255,0.08);color:#F3F5F9;border:1px solid rgba(255,255,255,0.14)}</style>" +
      "<div class=box><h1>ALL IN ONE_V1 · " + VERSION + "</h1>" +
      "<p>" + escape(actionMessage || "Đã cập nhật cấu hình.") + (redirectAuto ? " Đang tự quay lại trang Google One..." : "") + "</p>" +
      "<div class=acts><a class=\"btn pri\" href=\"" + safeRedirect + "\">Quay lại trang Google One ngay</a>" +
      "<a class=\"btn sec\" href=\"" + ROOT + "\">Mở Studio &amp; Báo cáo</a></div></div>";
    $done({
      response: {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "X-G1-Report-Version": VERSION,
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"
        },
        body: bounceHtml
      }
    });
    return;
  }
  if (!actionMessage && !errorMessage && prefillFrom) {
    actionMessage = "Đã điền sẵn mã nguồn vào Custom Rule bên dưới: " + prefillFrom;
  }

  function sanitizeBackUrl(raw) {
    if (typeof raw !== "string" || !raw || raw.length > 1500) return "";
    if (/[\r\n\t\s\\\x00-\x1f\x7f]/.test(raw)) return "";
    var noHash = raw.split("#")[0];
    if (!/^https:\/\/one\.google\.com\//.test(noHash)) return "";
    if (/^https:\/\/one\.google\.com\/g1-sku-report(?:\/|\?|$)/.test(noHash)) return "";
    return noHash;
  }

  function resolveInitialTab() {
    var t = query.tab;
    if (t === "studio" || t === "vault" || t === "scanned" || t === "diag" || t === "system") return t;
    if (query.clear === "scan") return "scanned";
    if (query.clear === "config" || query.action === "theme" || query.action === "import-cfg") return "system";
    return "studio";
  }

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

  function sanitizeCustomRules(rawRules) {
    if (!Array.isArray(rawRules)) return [];
    var seen = Object.create(null);
    var out = [];
    for (var i = 0; i < rawRules.length && out.length < MAX_CUSTOM_RULES; i++) {
      var item = rawRules[i];
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      var match = item.match === "prefix" ? "prefix" : "exact";
      var from = typeof item.from === "string" ? item.from.trim() : "";
      var to = typeof item.to === "string" ? item.to.trim() : "";
      var fromValid = match === "prefix" ? VALID_PREFIX.test(from) : VALID_TOKEN.test(from);
      var key = match + ":" + from;
      if (!fromValid || !VALID_TOKEN.test(to) || from === to || seen[key]) continue;
      seen[key] = true;
      out.push({ from: from, to: to, match: match, enabled: item.enabled !== false });
    }
    return out;
  }

  function sanitizeConfig(parsed) {
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
      customRules: [],
      customRulesOverride: false
    };
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return defaults;
    if (parsed.profile === "promo-90p" || parsed.profile === "ultra-75p" ||
        parsed.profile === "v7.6-eft" || parsed.profile === "hybrid-combo" ||
        parsed.profile === "ultra-1m-free" || parsed.profile === "ultra-free-probe" ||
        parsed.profile === "custom-only") {
      defaults.profile = parsed.profile;
    }
    if (parsed.mode === "auto" || parsed.mode === "scan-only" || parsed.mode === "rewrite-only") {
      defaults.mode = parsed.mode;
    }
    if (typeof parsed.target2tb === "string" && VALID_SKU.test(parsed.target2tb)) {
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
    if (parsed.customRulesOverride === true) defaults.customRulesOverride = true;
    return defaults;
  }

  function loadConfig() {
    return sanitizeConfig(load(CONFIG_KEY));
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
      if (query.profile === "promo-90p" || query.profile === "ultra-75p" ||
          query.profile === "v7.6-eft" || query.profile === "hybrid-combo" ||
          query.profile === "ultra-1m-free" || query.profile === "ultra-free-probe" ||
          query.profile === "custom-only") {
        cfg.profile = query.profile;
        if (saveConfig(cfg)) {
          var pNames = {
            "promo-90p": "Promo 90p / 75p (v7.5)",
            "ultra-75p": "Ultra 75p cố định (v7.8)",
            "v7.6-eft": "Ultra 1M Free + Fallback 90p (v7.6)",
            "hybrid-combo": "Combo 2TB Free + 20/30TB 90p",
            "ultra-1m-free": "Ultra 30TB · 1M Free (Mọi nút)",
            "ultra-free-probe": "Dò 11 nút Free dài hạn",
            "custom-only": "Chỉ chạy Custom Rules"
          };
          actionMessage = "Đã chuyển Profile sang: " + pNames[cfg.profile] + ".";
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

    if (query.action === "quick") {
      var packId = typeof query.pack === "string" ? query.pack.trim() : "";
      var pack = null;
      for (var pIdx = 0; pIdx < IPHONE_PACKS.length; pIdx++) {
        if (IPHONE_PACKS[pIdx].id === packId) {
          pack = IPHONE_PACKS[pIdx];
          break;
        }
      }
      if (!pack) {
        errorMessage = "Gói 1 chạm không hợp lệ.";
        return;
      }
      var pc = pack.cfg;
      cfg.profile = pc.profile;
      cfg.target2tb = pc.target2tb;
      cfg.mode = pc.mode;
      cfg.rewriteScope = pc.rewriteScope;
      cfg.nativeMode = pc.nativeMode;
      cfg.enable2tb = pc.enable2tb;
      cfg.enable20tb = pc.enable20tb;
      cfg.enable30tb = pc.enable30tb;
      cfg.strictCatalog = pc.strictCatalog;
      cfg.overlayPanel = pc.overlayPanel;
      cfg.notify = pc.notify;
      cfg.customRulesOverride = pc.customRulesOverride;
      if (saveConfig(cfg)) {
        actionMessage = "Đã bật " + pack.title + " — " + pack.app + ".";
        if (query.back) {
          var quickBack = sanitizeBackUrl(query.back);
          if (quickBack) {
            redirectLocation = quickBack;
            redirectAuto = pack.id !== "iphone-2-gemini-99p";
          }
        }
      }
      return;
    }

    if (query.action === "theme") {
      if (query.theme === "auto" || query.theme === "dark" || query.theme === "light") {
        cfg.theme = query.theme;
        if (saveConfig(cfg)) {
          actionMessage = "Đã đổi giao diện sang chế độ: " + cfg.theme + ".";
        }
      } else {
        errorMessage = "Giao diện không hợp lệ.";
      }
      return;
    }

    if (query.action === "toggle-overlay") {
      cfg.overlayPanel = !cfg.overlayPanel;
      if (saveConfig(cfg)) {
        actionMessage = cfg.overlayPanel ? "Đã bật thanh nổi trên trang Google." : "Đã tắt thanh nổi trên trang Google.";
        if (query.back) {
          var ovBack = sanitizeBackUrl(query.back);
          if (ovBack) redirectLocation = ovBack;
        }
      }
      return;
    }

    if (query.action === "add-rule") {
      var matchType = query.match === "prefix" ? "prefix" : "exact";
      var fromSku = typeof query.fromCustom === "string" && query.fromCustom.trim()
        ? query.fromCustom.trim()
        : typeof query.from === "string" ? query.from.trim() : "";
      var toSku = typeof query.to === "string" ? query.to.trim() : "";
      var fromOk = matchType === "prefix" ? VALID_PREFIX.test(fromSku) : VALID_TOKEN.test(fromSku);
      if (!fromOk || !VALID_TOKEN.test(toSku) || fromSku === toSku) {
        errorMessage = matchType === "prefix"
          ? "Rule tiền tố (Prefix) không hợp lệ: nguồn phải bắt đầu bằng g1. và kết thúc bằng dấu chấm (VD: g1.ios.ai.2tb.), đích phải là mã SKU đầy đủ."
          : "Rule tùy chỉnh không hợp lệ (mã nguồn và mã đích phải là mã SKU hợp lệ và khác nhau).";
        return;
      }
      var updatedRules = cfg.customRules.filter(function (r) {
        return !((r.match || "exact") === matchType && r.from === fromSku);
      });
      if (updatedRules.length >= MAX_CUSTOM_RULES) {
        errorMessage = "Đã đạt tối đa " + MAX_CUSTOM_RULES + " rule tùy chỉnh; hãy xóa bớt trước khi thêm mới.";
        return;
      }
      updatedRules.push({ from: fromSku, to: toSku, match: matchType, enabled: true });
      cfg.customRules = updatedRules;
      if (saveConfig(cfg)) {
        var ruleActive = cfg.profile === "custom-only" || cfg.customRulesOverride;
        actionMessage = "Đã lưu Custom Rule (" + (matchType === "prefix" ? "Prefix" : "Exact") + "): " +
          fromSku + " → " + toSku +
          (ruleActive ? " (đang áp dụng)." : " (chờ: bật 'Ưu tiên Custom Rules đè Profile' trong Cài đặt nâng cao hoặc chọn profile 'Chỉ Custom Rules').");
      }
      return;
    }

    if (query.action === "toggle-rule") {
      var togFrom = typeof query.from === "string" ? query.from.trim() : "";
      var togMatch = query.match === "prefix" ? "prefix" : "exact";
      var toggledState = null;
      cfg.customRules = cfg.customRules.map(function (r) {
        if (r.from === togFrom && (r.match || "exact") === togMatch) {
          toggledState = r.enabled === false;
          return { from: r.from, to: r.to, match: r.match || "exact", enabled: toggledState };
        }
        return r;
      });
      if (toggledState !== null && saveConfig(cfg)) {
        actionMessage = (toggledState ? "Đã bật" : "Đã tắt") + " Custom Rule cho: " + togFrom + ".";
      }
      return;
    }

    if (query.action === "del-rule") {
      var removeFrom = typeof query.from === "string" ? query.from.trim() : "";
      var hasMatch = query.match === "prefix" || query.match === "exact";
      var delMatch = query.match === "prefix" ? "prefix" : "exact";
      var beforeLen = cfg.customRules.length;
      cfg.customRules = cfg.customRules.filter(function (r) {
        return !(r.from === removeFrom && (!hasMatch || (r.match || "exact") === delMatch));
      });
      if (cfg.customRules.length < beforeLen && saveConfig(cfg)) {
        actionMessage = "Đã xóa Custom Rule cho: " + removeFrom + ".";
      }
      return;
    }

    if (query.action === "clear-rules") {
      cfg.customRules = [];
      if (saveConfig(cfg)) {
        actionMessage = "Đã xóa toàn bộ Custom Rules.";
      }
      return;
    }

    if (query.action === "import-cfg") {
      var rawJson = typeof query.cfg === "string" ? query.cfg.trim() : "";
      if (!rawJson) {
        errorMessage = "Vui lòng dán JSON cấu hình trước khi nhập.";
        return;
      }
      try {
        var parsedImport = JSON.parse(rawJson);
        if (!parsedImport || typeof parsedImport !== "object" || Array.isArray(parsedImport)) {
          errorMessage = "JSON cấu hình không hợp lệ.";
          return;
        }
        var sanitized = sanitizeConfig(parsedImport);
        if (saveConfig(sanitized)) {
          actionMessage = "Đã khôi phục cấu hình ALL IN ONE_V1 từ JSON.";
        }
      } catch (error) {
        errorMessage = "Không thể đọc JSON cấu hình (sai cú pháp).";
      }
      return;
    }

    if (query.action === "save") {
      var candidate = typeof query.target2tb === "string" ? query.target2tb.trim() : "";
      if (!VALID_SKU.test(candidate)) {
        errorMessage = "Mã SKU 2TB không hợp lệ (phải bắt đầu bằng g1., com.google.one. hoặc com.google.gemini.). Đã giữ nguyên cấu hình cũ.";
        return;
      }
      cfg.target2tb = candidate;
      if (query.profile === "promo-90p" || query.profile === "ultra-75p" ||
          query.profile === "v7.6-eft" || query.profile === "hybrid-combo" ||
          query.profile === "ultra-1m-free" || query.profile === "ultra-free-probe" ||
          query.profile === "custom-only") {
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
      cfg.customRulesOverride = query.crOverride === "1";
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
    return /(?:acq|_99p|_95p|_90p|_85p|_83p|_80p|_75p|_50p|_25p|_10p|_ip\.|_eft|subs_variant|12months|annual|3months|6months|2months|1month)/i.test(id);
  }
  function describeSku(id) {
    var tier = /ultra|30tb/i.test(id) ? "Ultra 30TB" :
      /20tb/i.test(id) ? "Ultra 20TB" :
      /10tb/i.test(id) ? "Pro 10TB" :
      /5tb/i.test(id) ? "AI Pro 5TB" :
      /2tb/i.test(id) ? "AI Pro 2TB" :
      /ai\.pro/i.test(id) ? "AI Pro" :
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

  function rows(value, withTime, defaultTarget) {
    if (!Array.isArray(value)) return [];
    return value.slice(0, 300).filter(function (row) {
      return row && typeof row.id === "string" && VALID_TOKEN.test(row.id);
    }).map(function (row) {
      var out = { id: row.id, count: count(row.count) };
      if (withTime) {
        out.lastSeen = text(row.lastSeen, 32);
      } else {
        out.to = sku(row.to) || ((row.id.indexOf("g1.ios.2tb.") === 0 || row.id.indexOf("g1.ios.ai.2tb.") === 0) ? defaultTarget || "" : "");
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

  function sanitizeRecentRewrites(value) {
    if (!Array.isArray(value)) return [];
    return value.slice(-10).filter(function (row) {
      return row && typeof row === "object" && !Array.isArray(row) &&
        typeof row.at === "string" && /^\d{4}-\d{2}-\d{2}T/.test(row.at) &&
        typeof row.status === "string";
    }).map(function (row) {
      return {
        at: text(row.at, 32),
        profile: text(row.profile || "promo-90p", 32),
        status: text(row.status, 32),
        hitCount: count(row.hitCount),
        annualHitCount: count(row.annualHitCount)
      };
    });
  }

  function sanitizeLastSuccess(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    var hc = count(raw.hitCount);
    if (!hc || typeof raw.at !== "string") return null;
    return {
      at: text(raw.at, 32),
      version: text(raw.version, 32),
      profile: text(raw.profile || "promo-90p", 32),
      target: text(raw.target, 160),
      hitCount: hc,
      annualHitCount: count(raw.annualHitCount),
      matchedFrom: rows(raw.matchedFrom, false, text(raw.target, 160))
    };
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
      matchedFrom: matchedFrom,
      lastSuccess: sanitizeLastSuccess(testRaw.lastSuccess),
      recentRewrites: sanitizeRecentRewrites(testRaw.recentRewrites)
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

  /* ---------- HTML rendering helpers ---------- */

  function escape(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }
  function shortTime(iso) {
    if (!iso) return "—";
    return iso.replace("T", " ").replace(/\.\d+Z$/, "Z");
  }
  function svg(paths, size) {
    var sz = size || 16;
    return '<svg width="' + sz + '" height="' + sz + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + "</svg>";
  }
  var ICONS = {
    studio: svg('<rect x="3" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="14" width="7" height="7" rx="1.5"></rect><rect x="3" y="14" width="7" height="7" rx="1.5"></rect>'),
    vault: svg('<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>'),
    scanned: svg('<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>'),
    diag: svg('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>'),
    system: svg('<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>'),
    refresh: svg('<polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>', 15),
    download: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>', 15),
    bolt: svg('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>', 18)
  };

  function rewriteTable(items) {
    if (!items.length) return "<p class=empty>Chưa có cặp SKU nào được thay thế.</p>";
    return "<div class=scroll><table><thead><tr><th>SKU nguồn</th><th>Lần</th><th>SKU đích thực tế</th><th>Giải mã</th><th>Fallback</th></tr></thead><tbody>" +
      items.map(function (row) {
        return "<tr><td><code>" + escape(row.id) + "</code></td><td><strong>" + row.count + "</strong></td><td><code>" +
          escape(row.to || "Chưa ghi nhận") + "</code></td><td class=dim>" + escape(describeSku(row.to || "")) + "</td><td>" +
          (row.fallback ? "<span class=\"st-pill st-warn\">Fallback</span>" : "<span class=\"st-pill st-muted\">Không</span>") + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }

  function scannedTable(items) {
    if (!items.length) return "<p class=empty>Chưa có bản ghi SKU nào.</p>";
    return "<div class=\"scroll sku-table-wrap\"><table><thead><tr><th>Mã SKU đầy đủ</th><th>Ý nghĩa</th><th>Lần</th><th>Gần nhất</th><th>Thao tác</th></tr></thead><tbody>" +
      items.map(function (row) {
        var isPromo = isPromoSku(row.id);
        var isIos = row.id.indexOf("g1.ios.") === 0;
        var rowCls = [isPromo ? "row-promo" : "row-other", isIos ? "row-ios" : ""].join(" ").trim();
        var originBadge = row.id.indexOf("com.google.gemini.") === 0
          ? " <span class=\"st-pill st-ok\">Gemini</span>"
          : row.id.indexOf("g1.ios.ai.2tb.") === 0
            ? " <span class=\"st-pill st-info\">AI 2TB</span>"
            : isIos
              ? " <span class=\"st-pill st-muted\">iOS</span>"
              : /^(?:g1\.play\.|g1\.10tb\.|g1\.2tb\.ai\.(?:18|15|12)months_eft$|g1\.2tb\.1year_eft$|g1\.helium\.12months_ip_90p$|.*subs_variant$)/.test(row.id)
                ? " <span class=\"st-pill st-warn\">Play</span>"
                : "";
        var promoBadge = isPromo ? " <span class=tag-promo>PROMO</span>" : "";
        var actionsHtml = [];
        if (VALID_SKU.test(row.id)) {
          actionsHtml.push("<a class=mini-btn href=\"" + ROOT + "?action=preset&target2tb=" + encodeURIComponent(row.id) + "&tab=scanned\">Dùng làm đích 2TB</a>");
        }
        if (VALID_TOKEN.test(row.id)) {
          actionsHtml.push("<a class=mini-btn href=\"" + ROOT + "?prefillFrom=" + encodeURIComponent(row.id) + "&tab=studio#custom-rules\">Map rule này</a>");
        }
        return "<tr class=\"" + rowCls + "\"><td><code>" + escape(row.id) + "</code>" + originBadge + promoBadge + "</td><td class=dim>" +
          escape(describeSku(row.id)) + "</td><td><strong>" + row.count + "</strong></td><td class=mono>" +
          escape(shortTime(row.lastSeen)) + "</td><td><div class=vcard-actions>" + actionsHtml.join("") + "</div></td></tr>";
      }).join("") + "</tbody></table></div>";
  }

  function recentScanTable(events) {
    if (!events.length) return "<p class=empty>Chưa có lịch sử response quét.</p>";
    return "<div class=scroll><table><thead><tr><th>Thời gian (UTC)</th><th>Kênh / Đường dẫn</th><th>Trạng thái</th><th>Thấy</th><th>Mới</th><th>Bỏ qua</th></tr></thead><tbody>" +
      events.slice().reverse().map(function (event) {
        var pathLabel = event.path === NATIVE_PATH ? "App Google One (Native)" : event.path;
        var stCls = statusStyles[event.status] || "st-muted";
        return "<tr><td class=mono>" + escape(shortTime(event.at)) + "</td><td><code>" + escape(pathLabel) +
          "</code></td><td><span class=\"st-pill " + stCls + "\">" + scanStatuses[event.status] + "</span></td><td>" +
          event.candidateCount + "</td><td>" + event.addedCount + "</td><td>" + event.omittedCount + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }

  function recentRewriteTable(events) {
    if (!events.length) return "<p class=empty>Chưa có lịch sử các lần ghi đè gần đây.</p>";
    return "<div class=scroll><table><thead><tr><th>Thời gian (UTC)</th><th>Profile</th><th>Trạng thái</th><th>Tổng vị trí</th><th>2TB</th></tr></thead><tbody>" +
      events.slice().reverse().map(function (ev) {
        var cls = ev.hitCount > 0 ? "st-ok" : ev.status === "skipped-strict-catalog" ? "st-warn" : "st-muted";
        return "<tr><td class=mono>" + escape(shortTime(ev.at)) + "</td><td><code>" + escape(ev.profile) +
          "</code></td><td><span class=\"st-pill " + cls + "\">" + escape(ev.status) + "</span></td><td><strong>" +
          ev.hitCount + "</strong></td><td>" + ev.annualHitCount + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }

  var statuses = {
    "rewritten": "Đã ghi đè",
    "no-match": "Không khớp",
    "non-text": "Phi văn bản",
    "skipped-strict-catalog": "Bỏ qua (Strict)"
  };
  var statusLabel = Object.prototype.hasOwnProperty.call(statuses, report.test.status) ?
    statuses[report.test.status] : "Chưa chạy";

  var profileOptions = [
    { id: "promo-90p", label: "Promo 90p / 75p", desc: "2TB (12T 90p / tùy chỉnh) + 20TB / 30TB ưu đãi" },
    { id: "ultra-75p", label: "Ultra 75p cố định (v7.8)", desc: "20/30TB → 3 tháng giảm 75% (trả 25%), khi 1M Free/90p lỗi" },
    { id: "v7.6-eft", label: "v7.6 Free + FB 90p", desc: "20/30TB → 1 tháng Free (.acq) tự fallback 90p" },
    { id: "hybrid-combo", label: "Combo 2TB Free + 90p", desc: "2TB → Ultra 1M Free; 20TB / 30TB giữ 90p / 75p" },
    { id: "ultra-1m-free", label: "Ultra 30TB · 1M Free", desc: "Mọi nút iOS → g1.ai.ultra.1month_eft.acq" },
    { id: "ultra-free-probe", label: "Dò 11 nút Free", desc: "Thử đồng thời 11 gói dùng thử 1 / 2 / 3 / 6 / 12T" },
    { id: "custom-only", label: "Chỉ Custom Rules", desc: "Chỉ chạy các cặp nút bạn tự định nghĩa bên dưới" }
  ];
  var profileCards = profileOptions.map(function (item) {
    var isOn = currentConfig.profile === item.id;
    return "<a class=\"pcard" + (isOn ? " active" : "") + "\" href=\"" + ROOT + "?action=profile&profile=" + item.id + "&tab=studio\">" +
      "<div class=pcard-top><span>" + item.label + "</span>" + (isOn ? "<span class=pcard-on>Đang bật</span>" : "") + "</div>" +
      "<div class=pcard-desc>" + item.desc + "</div></a>";
  }).join("");

  var modeOptions = [
    { id: "auto", label: "Tự động (Quét + Sửa)" },
    { id: "scan-only", label: "Chỉ quét gốc" },
    { id: "rewrite-only", label: "Chỉ ghi đè" }
  ];
  var modeButtons = modeOptions.map(function (item) {
    var active = currentConfig.mode === item.id ? " active" : "";
    return "<a class=\"seg-item" + active + "\" href=\"" + ROOT + "?action=mode&mode=" + item.id + "&tab=studio\">" + item.label + "</a>";
  }).join("");

  var presetButtons = PRESETS.map(function (preset) {
    var active = currentConfig.target2tb === preset.id ? " active" : "";
    return "<a class=\"pill" + active + "\" href=\"" + ROOT + "?action=preset&target2tb=" + encodeURIComponent(preset.id) + "&tab=studio\">" +
      escape(preset.label) + "</a>";
  }).join("");

  var customRulesHtml = !currentConfig.customRules.length
    ? "<p class=empty>Chưa có Custom Rule nào. Chọn nút nguồn (Exact hoặc Prefix) + nhập mã đích bên dưới để tự map nút bất kỳ.</p>"
    : '<div class=rules-list>' + currentConfig.customRules.map(function (r) {
        var rMatch = r.match === "prefix" ? "prefix" : "exact";
        var isOn = r.enabled !== false;
        return '<div class=rule-item><div class=rule-txt>' +
          '<span class="st-pill ' + (rMatch === "prefix" ? "st-warn" : "st-muted") + '">' + (rMatch === "prefix" ? "PREFIX" : "EXACT") + '</span>' +
          '<code>' + escape(r.from) + '</code><span class=dim> → </span><code>' + escape(r.to) + '</code>' +
          ' <span class="st-pill st-info">' + escape(describeSku(r.to)) + '</span>' +
          ' <span class="st-pill ' + (isOn ? "st-ok" : "st-muted") + '">' + (isOn ? "BẬT" : "TẮT") + '</span></div>' +
          '<div class=vcard-actions>' +
          '<a class=mini-btn href="' + ROOT + '?action=toggle-rule&from=' + encodeURIComponent(r.from) + '&match=' + rMatch + '&tab=studio">' + (isOn ? "Tắt" : "Bật") + '</a>' +
          '<a class="mini-btn btn-danger" href="' + ROOT + '?action=del-rule&from=' + encodeURIComponent(r.from) + '&match=' + rMatch + '&tab=studio">Xóa</a>' +
          '</div></div>';
      }).join("") + '</div>';

  var vaultHtml = VAULT_GROUPS.map(function (grp) {
    return '<div class=vault-grp><h3>' + escape(grp.title) + '</h3><div class=vault-grid>' +
      grp.items.map(function (item) {
        return '<div class=vcard><div class=vcard-top><code>' + escape(item.id) + '</code><span class="st-pill ' + item.cls + '">' +
          escape(item.tag) + '</span></div><div class=vcard-note>' + escape(item.note) + '</div>' +
          '<div class=vcard-actions>' +
          '<a class=mini-btn href="' + ROOT + '?action=preset&target2tb=' + encodeURIComponent(item.id) + '&tab=vault">Đặt đích 2TB</a>' +
          '<a class=mini-btn href="' + ROOT + '?action=add-rule&from=g1.ios.100gb.m&to=' + encodeURIComponent(item.id) + '&tab=vault">Map nút 100GB</a>' +
          '<a class=mini-btn href="' + ROOT + '?action=add-rule&from=g1.ios.20tb.m.v2&to=' + encodeURIComponent(item.id) + '&tab=vault">Map nút 20TB</a>' +
          '<a class=mini-btn href="' + ROOT + '?action=add-rule&from=g1.ios.30tb.ai.pro.m&to=' + encodeURIComponent(item.id) + '&tab=vault">Map nút 30TB</a>' +
          '</div></div>';
      }).join("") + '</div></div>';
  }).join("");

  function isPackActive(pack, cfg) {
    var pc = pack.cfg;
    return cfg.profile === pc.profile &&
      cfg.target2tb === pc.target2tb &&
      cfg.rewriteScope === pc.rewriteScope &&
      cfg.nativeMode === pc.nativeMode &&
      cfg.mode === pc.mode &&
      cfg.customRulesOverride === pc.customRulesOverride;
  }

  var quickPacksHtml = '<div class=pack-grid>' + IPHONE_PACKS.map(function (pack) {
    var isOn = isPackActive(pack, currentConfig);
    return '<a class="pack-card' + (isOn ? ' active' : '') + '" href="' + ROOT + '?action=quick&pack=' + pack.id + '&tab=studio">' +
      '<div class=pack-top><span class="st-pill ' + pack.cls + '">' + escape(pack.rank) + '</span>' +
      (isOn ? '<span class=pcard-on>Đang bật</span>' : '') + '</div>' +
      '<div class=pack-title>' + escape(pack.title) + '</div>' +
      '<div class=pack-app>Mở app: <strong>' + escape(pack.app) + '</strong></div>' +
      '<div class=pack-guide>' + escape(pack.guide) + '</div></a>';
  }).join("") + '</div>';

  var activeProfileObj = profileOptions.filter(function (p) { return p.id === currentConfig.profile; })[0] || profileOptions[0];
  var themeClass = currentConfig.theme === "dark" ? "dark" : currentConfig.theme === "light" ? "light" : "auto";
  var latestScan = report.scan.recentResponses.length ?
    report.scan.recentResponses[report.scan.recentResponses.length - 1] : null;
  var lastSuccess = report.test.lastSuccess;

  var css = [
    ":root{color-scheme:dark;--ease:cubic-bezier(0.16,1,0.3,1);--bg:#0C0E14;--side-bg:rgba(15,17,24,0.78);--panel:rgba(255,255,255,0.038);--panel-solid:#101217;--menu-bg:rgba(22,25,35,0.95);--raised:rgba(255,255,255,0.06);--line:rgba(255,255,255,0.085);--line2:rgba(255,255,255,0.16);--specular:inset 0 0.5px 0 rgba(255,255,255,0.14);--text:#F3F5F9;--muted:#A7B0C5;--dim:#7E879D;--pri:#2563EB;--pri-s:rgba(37,99,235,0.18);--ok:#34D399;--ok-s:rgba(52,211,153,0.13);--warn:#FBBF24;--warn-s:rgba(251,191,36,0.13);--err:#FB7185;--err-s:rgba(251,113,133,0.14);--info:#38BDF8;--info-s:rgba(56,189,248,0.13);--code:rgba(255,255,255,0.07);--blur:blur(22px) saturate(135%)}",
    "body.light{color-scheme:light;--bg:#EFF1F5;--side-bg:rgba(255,255,255,0.78);--panel:#FFFFFF;--panel-solid:#FFFFFF;--menu-bg:rgba(255,255,255,0.96);--raised:rgba(15,23,42,0.045);--line:rgba(15,23,42,0.08);--line2:rgba(15,23,42,0.15);--specular:inset 0 1px 0 rgba(255,255,255,0.96);--text:#141622;--muted:#474D61;--dim:#646B80;--pri:#0071E3;--pri-s:rgba(0,113,227,0.11);--ok:#059669;--ok-s:rgba(5,150,105,0.11);--warn:#B45309;--warn-s:rgba(180,83,9,0.11);--err:#E11D48;--err-s:rgba(225,29,72,0.11);--info:#0284C7;--info-s:rgba(2,132,199,0.10);--code:rgba(15,23,42,0.055)}",
    "@media (prefers-color-scheme:light){body.auto{color-scheme:light;--bg:#EFF1F5;--side-bg:rgba(255,255,255,0.78);--panel:#FFFFFF;--panel-solid:#FFFFFF;--menu-bg:rgba(255,255,255,0.96);--raised:rgba(15,23,42,0.045);--line:rgba(15,23,42,0.08);--line2:rgba(15,23,42,0.15);--specular:inset 0 1px 0 rgba(255,255,255,0.96);--text:#141622;--muted:#474D61;--dim:#646B80;--pri:#0071E3;--pri-s:rgba(0,113,227,0.11);--ok:#059669;--ok-s:rgba(5,150,105,0.11);--warn:#B45309;--warn-s:rgba(180,83,9,0.11);--err:#E11D48;--err-s:rgba(225,29,72,0.11);--info:#0284C7;--info-s:rgba(2,132,199,0.10);--code:rgba(15,23,42,0.055)}}",
    "@media (prefers-reduced-transparency:reduce){:root,body.light,body.auto{--side-bg:var(--panel-solid);--menu-bg:var(--panel-solid);--blur:none}}",
    "*{box-sizing:border-box}html,body{margin:0;padding:0;min-height:100%}body{font:14px/1.5 -apple-system,BlinkMacSystemFont,\"SF Pro Text\",\"Inter\",sans-serif;background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%}",
    ".nav-radio,.flt-radio{position:absolute;opacity:0;pointer-events:none;width:0;height:0}",
    ".app-shell{display:flex;min-height:100vh;max-width:1240px;margin:0 auto;padding:10px;gap:10px}",
    ".side{width:236px;flex:0 0 236px;position:sticky;top:10px;height:calc(100vh - 20px);display:flex;flex-direction:column;justify-content:space-between;background:var(--side-bg);-webkit-backdrop-filter:var(--blur);backdrop-filter:var(--blur);border:1px solid var(--line);box-shadow:var(--specular);border-radius:16px;padding:14px}",
    ".brand{display:flex;align-items:center;gap:10px;margin-bottom:16px}",
    ".brand-ico{width:34px;height:34px;border-radius:10px;background:var(--pri);color:#fff;display:flex;align-items:center;justify-content:center;flex:0 0 auto;box-shadow:inset 0 1px 0 rgba(255,255,255,0.28)}",
    ".brand-title{font-weight:700;font-size:15px;letter-spacing:-0.01em}.brand-ver{font-size:11px;color:var(--muted);font-weight:600}",
    ".nav-list{display:flex;flex-direction:column;gap:4px}",
    ".nav-item{display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:10px;color:var(--muted);font-weight:600;cursor:pointer;transition:background .15s var(--ease),color .15s var(--ease)}",
    ".nav-item:hover{background:var(--raised);color:var(--text)}",
    ".side-foot{border-top:1px solid var(--line);padding-top:12px;display:flex;flex-direction:column;gap:8px}",
    ".main{flex:1;min-width:0;background:var(--panel);border:1px solid var(--line);box-shadow:var(--specular);border-radius:16px;padding:16px 18px 28px}",
    ".topbar{position:sticky;top:0;z-index:40;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;padding:0 0 14px;margin-bottom:14px;border-bottom:1px solid var(--line)}",
    ".top-title{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.top-title h1{margin:0;font-size:18px;letter-spacing:-0.01em}",
    ".badge{display:inline-flex;align-items:center;gap:6px;background:var(--ok-s);color:var(--ok);padding:4px 10px;border-radius:99px;font-size:12px;font-weight:700}",
    ".actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.actions form{margin:0}",
    "button,.btn,.pill,.mini-btn,.seg-item{font:inherit;font-size:13px;font-weight:600;min-height:36px;padding:7px 14px;border:1px solid transparent;border-radius:99px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;transition:transform .12s var(--ease),background .15s var(--ease)}",
    ".btn-sec,.pill,.mini-btn{background:var(--raised);border-color:var(--line);color:var(--text)}.btn-pri,.pill.active,.seg-item.active{background:var(--pri);border-color:var(--pri);color:#fff}",
    ".btn-danger{background:var(--err-s);color:var(--err);border-color:transparent}.mini-btn{min-height:30px;padding:4px 11px;font-size:12px}",
    ".pane{display:none}",
    "#tab-studio:checked ~ .app-shell #pane-studio,#tab-vault:checked ~ .app-shell #pane-vault,#tab-scanned:checked ~ .app-shell #pane-scanned,#tab-diag:checked ~ .app-shell #pane-diag,#tab-system:checked ~ .app-shell #pane-system{display:block}",
    "#tab-studio:checked ~ .app-shell label[for=tab-studio],#tab-vault:checked ~ .app-shell label[for=tab-vault],#tab-scanned:checked ~ .app-shell label[for=tab-scanned],#tab-diag:checked ~ .app-shell label[for=tab-diag],#tab-system:checked ~ .app-shell label[for=tab-system]{background:var(--pri-s);color:var(--pri)}",
    ".kpi-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}",
    ".kpi{background:var(--raised);border:1px solid var(--line);border-radius:12px;padding:11px 13px}",
    ".kpi-k{font-size:11px;text-transform:uppercase;letter-spacing:0.04em;color:var(--muted);font-weight:700}.kpi-v{font-size:15px;font-weight:700;margin-top:4px;font-variant-numeric:tabular-nums;word-break:break-word}",
    ".card{background:var(--raised);border:1px solid var(--line);border-radius:14px;padding:14px;margin:12px 0}",
    ".card h2{margin:0 0 8px;font-size:16px}.card h3{margin:14px 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;color:var(--muted)}",
    ".pcard-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}",
    ".pcard{display:block;text-decoration:none;color:var(--text);background:var(--panel-solid);border:1px solid var(--line);border-radius:12px;padding:11px 12px}",
    ".pcard.active{border-color:var(--pri);background:var(--pri-s)}",
    ".pcard-top{display:flex;justify-content:space-between;align-items:center;gap:6px;font-weight:700;font-size:13px}",
    ".pcard-on{font-size:11px;background:var(--pri);color:#fff;padding:2px 8px;border-radius:99px}.pcard-desc{font-size:12px;color:var(--muted);margin-top:4px}",
    ".pack-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}",
    ".pack-card{display:flex;flex-direction:column;gap:5px;text-decoration:none;color:var(--text);background:var(--panel-solid);border:1px solid var(--line);border-radius:13px;padding:12px}",
    ".pack-card.active{border-color:var(--pri);background:var(--pri-s)}",
    ".pack-top{display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap}",
    ".pack-title{font-weight:700;font-size:14px;margin-top:2px}",
    ".pack-app{font-size:12px;color:var(--info)}",
    ".pack-guide{font-size:12px;color:var(--muted);line-height:1.45}",
    ".seg{display:inline-flex;flex-wrap:wrap;gap:4px;background:var(--panel-solid);border:1px solid var(--line);border-radius:99px;padding:4px}",
    ".seg-item{min-height:32px;padding:5px 13px;color:var(--muted);border:0}",
    ".pill-row{display:flex;gap:7px;flex-wrap:wrap}",
    ".alert{padding:10px 14px;border-radius:12px;margin:10px 0;font-weight:600;font-size:13px;border:1px solid var(--line)}",
    ".alert-ok{background:var(--ok-s);color:var(--ok)}.alert-err{background:var(--err-s);color:var(--err)}",
    ".form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:10px 0}",
    ".field label{display:block;font-size:12px;font-weight:600;color:var(--muted);margin-bottom:4px}",
    ".field input[type=text],.field select,textarea{width:100%;font:inherit;font-size:13px;padding:8px 11px;border:1px solid var(--line2);border-radius:9px;background:var(--panel-solid);color:var(--text)}",
    ".sw-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:12px 0}",
    ".sw-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 12px;background:var(--panel-solid);border:1px solid var(--line);border-radius:11px;cursor:pointer;font-size:13px;font-weight:500}",
    ".sw-input{position:absolute;opacity:0;width:0;height:0}",
    ".sw-track{position:relative;flex:0 0 42px;width:42px;height:24px;border-radius:99px;background:var(--line2);transition:background .18s var(--ease)}",
    ".sw-track::after{content:\"\";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .18s var(--ease)}",
    ".sw-input:checked + .sw-track{background:var(--pri)}.sw-input:checked + .sw-track::after{transform:translateX(18px)}",
    ".rules-list{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}",
    ".rule-item{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 10px;background:var(--panel-solid);border:1px solid var(--line);border-radius:10px;flex-wrap:wrap}",
    ".rule-txt{display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-width:0}",
    ".vault-grp{margin-bottom:16px}.vault-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}",
    ".vcard{background:var(--panel-solid);border:1px solid var(--line);border-radius:12px;padding:11px;display:flex;flex-direction:column;gap:6px}",
    ".vcard-top{display:flex;justify-content:space-between;align-items:center;gap:6px}.vcard-note{font-size:12px;color:var(--muted)}.vcard-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:2px}",
    ".flt-bar{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}",
    "#flt-all:checked ~ .flt-bar label[for=flt-all],#flt-promo:checked ~ .flt-bar label[for=flt-promo],#flt-ios:checked ~ .flt-bar label[for=flt-ios]{background:var(--pri);border-color:var(--pri);color:#fff}",
    "#flt-promo:checked ~ .sku-table-wrap tbody tr:not(.row-promo),#flt-ios:checked ~ .sku-table-wrap tbody tr:not(.row-ios){display:none}",
    "code{overflow-wrap:anywhere;background:var(--code);padding:2px 6px;border-radius:6px;font-size:12px}",
    ".scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}table{border-collapse:collapse;width:100%;font-size:13px}",
    "td,th{padding:9px 8px;border-bottom:1px solid var(--line);text-align:left;vertical-align:middle}th{color:var(--muted);font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.04em}",
    ".mono{font-variant-numeric:tabular-nums;color:var(--muted);font-size:12px;white-space:nowrap}.dim,.empty{color:var(--muted);font-size:13px}",
    ".tag-promo{display:inline-block;background:var(--ok-s);color:var(--ok);font-size:10px;font-weight:700;padding:2px 7px;border-radius:99px;margin-left:4px}",
    ".st-pill{display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700;white-space:nowrap}",
    ".st-ok{background:var(--ok-s);color:var(--ok)}.st-info{background:var(--info-s);color:var(--info)}.st-warn{background:var(--warn-s);color:var(--warn)}.st-err{background:var(--err-s);color:var(--err)}.st-muted{background:var(--code);color:var(--muted)}",
    ".adv summary{cursor:pointer;font-weight:700;font-size:13px;color:var(--info);padding:4px 0}",
    ".dock{display:none}",
    "@media (max-width:899px){.app-shell{padding:8px 8px 86px}.side{display:none}.main{padding:14px 12px 24px}.kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pcard-grid,.pack-grid,.form-grid,.sw-grid,.vault-grid{grid-template-columns:1fr}.dock{position:fixed;left:10px;right:10px;bottom:max(10px,env(safe-area-inset-bottom));z-index:80;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:2px;padding:5px;border-radius:99px;background:var(--menu-bg);-webkit-backdrop-filter:blur(32px) saturate(180%);backdrop-filter:blur(32px) saturate(180%);border:1px solid var(--line2);box-shadow:var(--specular),0 14px 36px rgba(0,0,0,0.42)}.dock-item{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:6px 2px;border-radius:99px;font-size:10px;font-weight:700;color:var(--muted);cursor:pointer;text-align:center}}"
  ].join("");

  function tabChecked(name) {
    return activeTab === name ? " checked" : "";
  }

  var navItems = [
    { id: "studio", label: "Studio", icon: ICONS.studio },
    { id: "vault", label: "Kho SKU", icon: ICONS.vault },
    { id: "scanned", label: "Đã Quét", icon: ICONS.scanned },
    { id: "diag", label: "Chẩn Đoán", icon: ICONS.diag },
    { id: "system", label: "Hệ Thống", icon: ICONS.system }
  ];

  var html = [
    "<!doctype html><html lang=vi><meta charset=utf-8>",
    "<meta name=viewport content=\"width=device-width,initial-scale=1,viewport-fit=cover\"><title>ALL IN ONE_V1 · Studio</title>",
    "<style>" + css + "</style>",
    "<body class=\"" + themeClass + "\">",

    navItems.map(function (item) {
      return '<input class=nav-radio type=radio name=navtab id="tab-' + item.id + '"' + tabChecked(item.id) + ">";
    }).join(""),

    '<div class=app-shell>',
    '<aside class=side><div>',
    '<div class=brand><div class=brand-ico>' + ICONS.bolt + '</div><div><div class=brand-title>ALL IN ONE_V1</div><div class=brand-ver>' + VERSION + ' · Liquid Glass</div></div></div>',
    '<nav class=nav-list aria-label="Điều hướng Studio">' +
      navItems.map(function (item) {
        return '<label class=nav-item for="tab-' + item.id + '">' + item.icon + '<span>' + item.label + '</span></label>';
      }).join("") +
    '</nav></div>',
    '<div class=side-foot><div class=dim>Profile: <strong>' + escape(activeProfileObj.label) + '</strong><br>Native: <code>' + escape(currentConfig.nativeMode) + '</code> · Strict: <code>' + (currentConfig.strictCatalog ? "ON" : "OFF") + '</code></div>',
    '<form method=get action="' + ROOT + '"><button type=submit name=format value=json class="btn btn-pri" style="width:100%">' + ICONS.download + '<span>Xuất JSON</span></button></form>',
    '</div></aside>',

    '<main class=main>',
    '<header class=topbar><div class=top-title><h1>ALL IN ONE_V1</h1><span class=badge>Script nội bộ đang hoạt động · ' + VERSION + '</span></div>',
    '<nav class=actions aria-label="Thao tác nhanh"><form method=get action="' + ROOT + '"><button type=submit name=format value=json class=btn-pri>' + ICONS.download + '<span>Xuất JSON</span></button></form><a class="btn btn-sec" href="' + ROOT + '?tab=' + activeTab + '">' + ICONS.refresh + '<span>Làm mới</span></a></nav></header>',

    actionMessage ? '<p class="alert alert-ok">' + escape(actionMessage) + '</p>' : "",
    errorMessage ? '<p class="alert alert-err">' + escape(errorMessage) + '</p>' : "",
    storageAvailable ? "" : '<p class="alert alert-err">Giao diện lưu trữ cục bộ chưa sẵn sàng; chưa thể đọc hoặc ghi dữ liệu.</p>',

    /* ---------- TAB 1: STUDIO ---------- */
    '<section class=pane id=pane-studio>',
    '<div class=kpi-grid>',
    '<div class=kpi><div class=kpi-k>Profile đang bật</div><div class=kpi-v>' + escape(activeProfileObj.label) + '</div></div>',
    '<div class=kpi><div class=kpi-k>SKU đã thu thập</div><div class=kpi-v>' + report.scan.skus.length + ' / 300</div></div>',
    '<div class=kpi><div class=kpi-k>Lần chạy gần nhất</div><div class=kpi-v>' + report.test.hitCount + ' vị trí · ' + escape(statusLabel) + '</div></div>',
    '<div class=kpi><div class=kpi-k>Khớp thành công gần nhất</div><div class=kpi-v>' + (lastSuccess ? (lastSuccess.hitCount + ' vị trí · ' + escape(lastSuccess.profile)) : 'Chưa có') + '</div></div>',
    '</div>',

    '<div class=card><h2>Top 5 Gói 1 Chạm cho iPhone (Chọn 1 chạm là chạy ngay)</h2>',
    '<p class=dim>Chạm 1 thẻ là tự cấu hình đầy đủ (Profile, Đích 2TB, Phạm vi URL &amp; Native); sau đó mở đúng ứng dụng ghi trên thẻ để kiểm tra StoreKit. Bạn cũng có thể đổi trực tiếp 5 gói này ngay trên thanh nổi trong Google App (tự tải lại tại chỗ).</p>',
    quickPacksHtml, '</div>',

    '<div class=card><h2>Bảng điều khiển nhanh</h2>',
    '<h3>1. Chọn Profile mapping (7 chế độ)</h3><div class=pcard-grid>' + profileCards + '</div>',
    '<h3>2. Chế độ hoạt động</h3><div class=seg>' + modeButtons + '</div>',
    '<h3>3. Đổi nhanh mã đích 2TB (khi dùng Promo 90p)</h3><div class=pill-row>' + presetButtons + '</div>',

    '<details class=adv><summary>Cài đặt nâng cao (Native Protobuf, Strict Catalog, Phạm vi Web &amp; Thanh nổi)</summary>',
    '<form method=get action="' + ROOT + '"><input type=hidden name=action value=save><input type=hidden name=tab value=studio>',
    '<div class=form-grid>',
    '<div class=field><label for=profile>Profile mapping</label><select id=profile name=profile>' +
      profileOptions.map(function (item) {
        return '<option value="' + item.id + '"' + (currentConfig.profile === item.id ? ' selected' : '') + '>' + item.label + '</option>';
      }).join("") + '</select></div>',
    '<div class=field><label for=target2tb>Mã đích 2TB tùy chỉnh</label><input id=target2tb type=text name=target2tb value="' + escape(currentConfig.target2tb) + '" placeholder="g1.2tb.ai.12months_ip_90p"></div>',
    '<div class=field><label for=mode>Chế độ</label><select id=mode name=mode>' +
      modeOptions.map(function (item) {
        return '<option value="' + item.id + '"' + (currentConfig.mode === item.id ? ' selected' : '') + '>' + item.label + '</option>';
      }).join("") + '</select></div>',
    '<div class=field><label for=scope>Phạm vi URL Web</label><select id=scope name=scope>' +
      '<option value=ai' + (currentConfig.rewriteScope === 'ai' ? ' selected' : '') + '>Chỉ /ai? (Chuẩn &amp; an toàn)</option>' +
      '<option value=extended' + (currentConfig.rewriteScope === 'extended' ? ' selected' : '') + '>Mở rộng (/ai?, /upsell, /plans, /storage, batchexecute)</option>' +
      '</select></div>',
    '<div class=field><label for=native>App Google One riêng (Native Protobuf)</label><select id=native name=native>' +
      '<option value=scan' + (currentConfig.nativeMode === 'scan' ? ' selected' : '') + '>Chỉ quét SKU (An toàn)</option>' +
      '<option value=rewrite' + (currentConfig.nativeMode === 'rewrite' ? ' selected' : '') + '>Quét + Ghi đè Protobuf (Thử nghiệm)</option>' +
      '<option value=off' + (currentConfig.nativeMode === 'off' ? ' selected' : '') + '>Tắt xử lý Native</option>' +
      '</select></div>',
    '</div>',
    '<div class=sw-grid>',
    '<label class=sw-row><span>Bật gói 2TB</span><input class=sw-input type=checkbox name=e2tb value=1' + (currentConfig.enable2tb ? ' checked' : '') + '><span class=sw-track></span></label>',
    '<label class=sw-row><span>Bật gói 20TB</span><input class=sw-input type=checkbox name=e20tb value=1' + (currentConfig.enable20tb ? ' checked' : '') + '><span class=sw-track></span></label>',
    '<label class=sw-row><span>Bật gói 30TB</span><input class=sw-input type=checkbox name=e30tb value=1' + (currentConfig.enable30tb ? ' checked' : '') + '><span class=sw-track></span></label>',
    '<label class=sw-row><span>Strict Catalog (Chỉ sửa khi có promo)</span><input class=sw-input type=checkbox name=strict value=1' + (currentConfig.strictCatalog ? ' checked' : '') + '><span class=sw-track></span></label>',
    '<label class=sw-row><span>Thanh nổi trên trang Google</span><input class=sw-input type=checkbox name=overlay value=1' + (currentConfig.overlayPanel ? ' checked' : '') + '><span class=sw-track></span></label>',
    '<label class=sw-row><span>Thông báo iOS</span><input class=sw-input type=checkbox name=notify value=1' + (currentConfig.notify ? ' checked' : '') + '><span class=sw-track></span></label>',
    '<label class=sw-row><span>Ưu tiên Custom Rules đè Profile</span><input class=sw-input type=checkbox name=crOverride value=1' + (currentConfig.customRulesOverride ? ' checked' : '') + '><span class=sw-track></span></label>',
    '</div>',
    '<button class="btn btn-pri" type=submit>Lưu cấu hình</button></form></details></div>',

    '<div class=card id=custom-rules><h2>Tự Map Nút Bất Kỳ (Custom Rules · ' + currentConfig.customRules.length + '/' + MAX_CUSTOM_RULES + ')</h2>',
    '<p class=dim>' +
      (currentConfig.profile === "custom-only" || currentConfig.customRulesOverride
        ? 'Trạng thái: <strong>ĐANG ÁP DỤNG</strong> (gắn trực tiếp hoặc ghi đè Profile hiện tại).'
        : 'Trạng thái: <strong>ĐANG CHỜ</strong> — mặc định chỉ chạy khi chọn profile «Chỉ Custom Rules» hoặc bật «Ưu tiên Custom Rules đè Profile» trong Cài đặt nâng cao.') +
    '</p>',
    customRulesHtml,
    '<form method=get action="' + ROOT + '"><input type=hidden name=action value=add-rule><input type=hidden name=tab value=studio>',
    '<div class=form-grid>',
    '<div class=field><label for=ruleMatch>Kiểu khớp</label><select id=ruleMatch name=match>' +
      '<option value=exact>Khớp chính xác (Exact)</option>' +
      '<option value=prefix>Khớp tiền tố (Prefix, kết thúc bằng dấu .)</option>' +
    '</select></div>',
    '<div class=field><label for=fromSel>Chọn nút iOS nguồn</label><select id=fromSel name=from>' +
      COMMON_IOS_SOURCES.map(function (s) { return '<option value="' + s.id + '">' + escape(s.label) + '</option>'; }).join("") +
    '</select></div>',
    '<div class=field><label for=fromCustom>Hoặc nhập SKU nguồn khác</label><input id=fromCustom type=text name=fromCustom value="' + escape(prefillFrom) + '" placeholder="VD: g1.ios.200gb.m hoặc g1.ios.ai.2tb."></div>',
    '<div class=field><label for=toSku>SKU đích muốn đổi sang</label><input id=toSku type=text name=to value="' + escape(currentConfig.target2tb) + '" placeholder="VD: g1.ai.ultra.3months_ip_75p.acq"></div>',
    '</div><div class=actions><button class="btn btn-pri" type=submit>Thêm Custom Rule</button>' +
      (currentConfig.customRules.length
        ? '<a class="btn btn-danger" href="' + ROOT + '?action=clear-rules&tab=studio">Xóa hết Custom Rules</a>'
        : '') +
    '</div></form></div>',

    '<div class=card><h2>Lần khớp thành công gần nhất (Chống mất log)</h2>',
    lastSuccess
      ? '<p class=dim>Thời gian: <strong>' + escape(shortTime(lastSuccess.at)) + '</strong> · Profile: <code>' + escape(lastSuccess.profile) +
        '</code> · Tổng: <strong>' + lastSuccess.hitCount + '</strong></p>' + rewriteTable(lastSuccess.matchedFrom)
      : '<p class=empty>Chưa có lượt ghi đè nào khớp thành công.</p>',
    '<h3>Lượt kiểm tra gần nhất (' + escape(statusLabel) + ')</h3>',
    rewriteTable(report.test.matchedFrom), '</div>',
    '</section>',

    /* ---------- TAB 2: SKU VAULT ---------- */
    '<section class=pane id=pane-vault>',
    '<div class=card><h2>Kho SKU Cộng Đồng (32 mã chuẩn · 1 chạm để gán)</h2>',
    '<p class=dim>Phân biệt rõ mã <strong>iOS (<code>*.acq</code>)</strong> và mã <strong>Android Play (<code>Play ID</code>)</strong>. Lưu ý: KHÔNG bật MITM cho <code>*.apple.com</code> hoặc <code>*.icloud.com</code> để tránh lỗi StoreKit khi thanh toán.</p>',
    vaultHtml, '</div></section>',

    /* ---------- TAB 3: SCANNED SKUS ---------- */
    '<section class=pane id=pane-scanned>',
    '<div class=card><h2>Danh sách SKU thu thập được (Ưu tiên PROMO lên đầu)</h2>',
    '<p class=dim>Tổng: <strong>' + report.scan.skus.length + ' / 300</strong> mã (trích xuất trước khi ghi đè từ cả Web &amp; Native).</p>',
    report.scan.truncated ? '<p class="alert alert-err">Đã đạt giới hạn 300 mã; hãy xuất JSON rồi xóa danh sách quét trước khi thu thập đợt mới.</p>' : '',
    '<input class=flt-radio type=radio name=skuflt id=flt-all checked>',
    '<input class=flt-radio type=radio name=skuflt id=flt-promo>',
    '<input class=flt-radio type=radio name=skuflt id=flt-ios>',
    '<div class=flt-bar>',
    '<label class=pill for=flt-all>Tất cả (' + report.scan.skus.length + ')</label>',
    '<label class=pill for=flt-promo>Chỉ mã PROMO</label>',
    '<label class=pill for=flt-ios>Chỉ mã gốc iOS (g1.ios.*)</label>',
    '</div>',
    scannedTable(report.scan.skus), '</div></section>',

    /* ---------- TAB 4: DIAGNOSTICS ---------- */
    '<section class=pane id=pane-diag>',
    '<div class=card><h2>Mẹo xử lý khi báo "Purchase not completed"</h2>',
    '<ol class=dim style="margin:6px 0 0;padding-left:20px;line-height:1.65;">',
    '<li>Đổi sang <strong>Gmail phụ sạch</strong> chưa từng đăng ký Google One (nguyên nhân phổ biến nhất khi thanh nổi đã khớp SKU).</li>',
    '<li>Nếu cùng 1 Apple ID đã dùng ~3 lượt bị kẹt trên app Google chính, chuyển sang đăng ký từ app Google khác (<strong>Gemini</strong>, <strong>Google One</strong>, <strong>Gmail</strong>, <strong>Google Photos</strong>, <strong>NotebookLM</strong>).</li>',
    '<li>Đảm bảo Apple ID đã liên kết thẻ hợp lệ, <strong>KHÔNG</strong> bật MITM cho <code>*.apple.com</code> / <code>*.icloud.com</code>, và hủy tự động gia hạn ngay sau khi kích hoạt gói 1 tháng 0đ.</li>',
    '<li>Nếu đã dùng Gmail sạch mà cả <strong>1M Free</strong> và <strong>90p</strong> đều báo lỗi (do Google tạm khóa ưu đãi đó), hãy đổi Profile sang <strong>Ultra 75p cố định (v7.8)</strong> để thử gói giảm 75% (trả 25% trong 3 tháng).</li>',
    '</ol></div>',
    '<div class=card><h2>Lịch sử 10 lần ghi đè gần nhất</h2>' + recentRewriteTable(report.test.recentRewrites) + '</div>',
    '<div class=card><h2>Chẩn đoán 10 response quét gần nhất</h2>',
    '<p class=dim>Script quét: <code>' + escape(report.scan.version || "Chưa có") + '</code> · Văn bản: <strong>' + report.scan.scannedResponses +
      '</strong> · Phi văn bản: <strong>' + report.scan.nonTextResponses + '</strong> · Có SKU: <strong>' + report.scan.matchedResponses +
      '</strong> · Cập nhật: ' + escape(shortTime(report.scan.updatedAt)) + '</p>',
    latestScan ? '<p class=dim>Response gần nhất: <strong>' + scanStatuses[latestScan.status] + '</strong> (thấy ' +
      latestScan.candidateCount + ', mới ' + latestScan.addedCount + ', bỏ qua ' + latestScan.omittedCount + ').</p>' : '',
    recentScanTable(report.scan.recentResponses), '</div></section>',

    /* ---------- TAB 5: SYSTEM ---------- */
    '<section class=pane id=pane-system>',
    '<div class=card><h2>Giao diện &amp; Chủ đề (Minimal Specular Liquid Glass)</h2>',
    '<div class=pill-row>',
    '<a class="pill' + (currentConfig.theme === "auto" ? " active" : "") + '" href="' + ROOT + '?action=theme&theme=auto&tab=system">Tự động theo iOS</a>',
    '<a class="pill' + (currentConfig.theme === "dark" ? " active" : "") + '" href="' + ROOT + '?action=theme&theme=dark&tab=system">Dark Glass</a>',
    '<a class="pill' + (currentConfig.theme === "light" ? " active" : "") + '" href="' + ROOT + '?action=theme&theme=light&tab=system">Light Glass</a>',
    '</div></div>',

    '<div class=card><h2>Sao lưu &amp; Khôi phục cấu hình JSON</h2>',
    '<p class=dim>Copy đoạn JSON dưới để lưu cấu hình + Custom Rules, hoặc dán vào ô nhập để khôi phục nhanh.</p>',
    '<div class=field><label for=cfgOut>Cấu hình hiện tại</label><textarea id=cfgOut rows=4 readonly>' + escape(JSON.stringify(currentConfig)) + '</textarea></div>',
    '<form method=get action="' + ROOT + '" style="margin-top:10px;"><input type=hidden name=action value=import-cfg><input type=hidden name=tab value=system>',
    '<div class=field><label for=cfgIn>Nhập JSON cấu hình</label><textarea id=cfgIn name=cfg rows=3 placeholder=\'{"schemaVersion":1,"profile":"hybrid-combo",...}\'></textarea></div>',
    '<button class="btn btn-pri" type=submit style="margin-top:8px;">Khôi phục cấu hình</button></form></div>',

    '<div class=card><h2>Dọn dữ liệu cục bộ</h2>',
    '<div class=pill-row>',
    '<form method=get action="' + ROOT + '"><button class="btn btn-danger" name=clear value=1>Xóa dữ liệu quét &amp; test</button></form>',
    '<form method=get action="' + ROOT + '"><button class="btn btn-sec" name=clear value=scan>Chỉ xóa danh sách quét</button></form>',
    '<form method=get action="' + ROOT + '"><button class="btn btn-sec" name=clear value=test>Chỉ xóa kết quả test</button></form>',
    '<form method=get action="' + ROOT + '"><button class="btn btn-sec" name=clear value=config>Đặt lại cấu hình ALL IN ONE_V1</button></form>',
    '</div></div></section>',

    '</main></div>',

    '<nav class=dock aria-label="Thanh điều hướng nhanh">' +
      navItems.map(function (item) {
        return '<label class=dock-item for="tab-' + item.id + '">' + item.icon + '<span>' + item.label + '</span></label>';
      }).join("") +
    '</nav></body></html>'
  ].join("");
  $done({ response: { status: 200, headers: headers, body: html } });
})();
