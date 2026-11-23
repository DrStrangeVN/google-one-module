/* Local-only report served by a Shadowrocket http-request script. */
"use strict";

(function () {
  var ROOT = "https://one.google.com/g1-sku-report";
  var SCAN_KEY = "g1.sku.scan.v1";
  var TEST_KEY = "g1.pro.annual.test.v1";
  var url = typeof $request === "object" && $request ? $request.url : "";
  if (typeof url !== "string" || !/^https:\/\/one\.google\.com\/g1-sku-report(?:\?|$)/.test(url)) {
    $done({});
    return;
  }

  var storageAvailable = typeof $persistentStore !== "undefined" &&
    typeof $persistentStore.read === "function";
  var clearMessage = "";
  if (/(?:\?|&)clear=1(?:&|$)/.test(url)) {
    try {
      var scanCleared = $persistentStore.write("{}", SCAN_KEY);
      var testCleared = $persistentStore.write("{}", TEST_KEY);
      clearMessage = scanCleared && testCleared ? "Đã xóa hai bản ghi cục bộ của công cụ." : "Chưa thể xóa hoàn toàn bản ghi cục bộ.";
    } catch (error) {
      clearMessage = "Giao diện lưu trữ cục bộ chưa sẵn sàng.";
    }
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
  function text(value, length) {
    return typeof value === "string" ? value.slice(0, length || 180) : "";
  }
  function count(value) {
    var number = Number(value);
    return isFinite(number) && number > 0 ? Math.floor(number) : 0;
  }
  function rows(value, withTime) {
    if (!Array.isArray(value)) return [];
    return value.slice(0, 300).filter(function (row) {
      return row && typeof row.id === "string" &&
        /^(?:g1\.|com\.google\.one\.)[A-Za-z0-9._-]{1,160}$/.test(row.id);
    }).map(function (row) {
      var out = { id: row.id, count: count(row.count) };
      if (withTime) {
        out.lastSeen = text(row.lastSeen, 32);
      } else {
        out.to = typeof row.to === "string" && /^g1\.[A-Za-z0-9._-]{1,160}$/.test(row.to) ?
          row.to : row.id.indexOf("g1.ios.2tb.") === 0 ? "g1.2tb.ai.annual" : "";
        out.fallback = row.fallback === true;
      }
      return out;
    }).sort(function (a, b) { return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; });
  }

  var scanRaw = load(SCAN_KEY);
  var testRaw = load(TEST_KEY);
  var matchedFrom = rows(testRaw.matchedFrom, false);
  var annualHitCount = typeof testRaw.annualHitCount === "number" ? count(testRaw.annualHitCount) :
    matchedFrom.reduce(function (total, row) {
      return total + (row.id.indexOf("g1.ios.2tb.") === 0 ? row.count : 0);
    }, 0);
  var report = {
    schemaVersion: 1,
    storageAvailable: storageAvailable,
    scan: {
      updatedAt: text(scanRaw.updatedAt, 32),
      scannedResponses: count(scanRaw.scannedResponses),
      matchedResponses: count(scanRaw.matchedResponses),
      truncated: scanRaw.truncated === true,
      limit: 300,
      skus: rows(scanRaw.skus, true)
    },
    test: {
      version: text(testRaw.version, 32),
      updatedAt: text(testRaw.updatedAt, 32),
      sourcePrefix: "g1.ios.2tb.",
      target: "g1.2tb.ai.annual",
      status: text(testRaw.status, 32),
      hitCount: count(testRaw.hitCount),
      annualHitCount: annualHitCount,
      matchedFrom: matchedFrom
    }
  };

  var headers = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"
  };
  if (/(?:\?|&)format=json(?:&|$)/.test(url)) {
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
      (withTime ? "<th>Lần thấy gần nhất (UTC)</th>" : "<th>SKU đích thực tế</th><th>Dự phòng</th>") + "</tr></thead><tbody>" +
      items.map(function (row) {
        return "<tr><td><code>" + escape(row.id) + "</code></td><td>" + row.count + "</td>" +
          (withTime ? "<td>" + escape(row.lastSeen) + "</td>" :
            "<td><code>" + escape(row.to || "Chưa ghi nhận") + "</code></td><td>" + (row.fallback ? "75p" : "Không") + "</td>") + "</tr>";
      }).join("") + "</tbody></table></div>";
  }
  var statuses = {
    "rewritten": "Đã thực hiện ghi đè chuỗi",
    "no-match": "Response lần này không khớp SKU nguồn nào trong 3 mức",
    "non-text": "Response lần này không có nội dung văn bản để xử lý"
  };
  var status = Object.prototype.hasOwnProperty.call(statuses, report.test.status) ?
    statuses[report.test.status] : "Chưa có bản ghi chạy test";
  if (report.test.version === "pro-annual-test-v1" && report.test.status === "no-match") {
    status = "Bản ghi v1 cũ: response không khớp tiền tố iOS 2TB";
  }
  var html = [
    "<!doctype html><html lang=vi><meta charset=utf-8>",
    "<meta name=viewport content=\"width=device-width,initial-scale=1\"><title>Báo cáo Google One SKU nội bộ</title>",
    "<style>body{font:16px/1.6 -apple-system,BlinkMacSystemFont,sans-serif;max-width:960px;margin:24px auto;padding:0 18px;color:#1c2737;background:#f5f7fa}section{background:white;border:1px solid #dde3ec;border-radius:12px;padding:18px;margin:18px 0}h1{font-size:24px}h2{font-size:20px}code{overflow-wrap:anywhere}a{color:#1259be;margin-right:18px}table{border-collapse:collapse;width:100%;font-size:14px}td,th{padding:9px;border-bottom:1px solid #ddd;text-align:left;vertical-align:top}.scroll{overflow:auto}.note{color:#46556b}button{font:inherit;padding:8px 14px}</style>",
    "<h1>Báo cáo Google One SKU nội bộ</h1>",
    "<p class=note>Trang này được tạo trực tiếp bởi script Shadowrocket trên máy; không gửi dữ liệu ra ngoài.</p>",
    "<p><a href=\"" + ROOT + "\">Làm mới</a><a href=\"" + ROOT + "?format=json\">Xuất JSON</a></p>",
    clearMessage ? "<p>" + escape(clearMessage) + "</p>" : "",
    storageAvailable ? "" : "<p>Giao diện lưu trữ cục bộ chưa sẵn sàng; chưa thể đọc bản ghi.</p>",
    "<section><h2>Lần chạy mapping 3 mức gần nhất</h2>",
    "<p>Phiên bản: " + escape(report.test.version || "Chưa có") + "<br>Trạng thái: " + escape(status) + "; Tổng số lần thay thế: " + report.test.hitCount + "; Trong đó 2TB: " + report.test.annualHitCount + "</p>",
    "<p>Tiền tố nguồn 2TB: <code>g1.ios.2tb.</code><br>Đích cố định 2TB: <code>g1.2tb.ai.annual</code><br>20TB / 30TB giữ nguyên mapping ưu đãi cũ &amp; fallback 75p; chi tiết xem bảng dưới.<br>Thời gian chạy (UTC): " + escape(report.test.updatedAt || "Chưa có") + "</p>",
    "<p class=note>Đây là kết quả thực thi script; việc App Store có nhận diện gói, giá và chu kỳ hay không cần kiểm tra trực tiếp trên bảng thanh toán.</p>",
    table(report.test.matchedFrom, false), "</section>",
    "<section><h2>SKU thu thập được khi duyệt trang</h2>",
    "<p>Số response đã quét: " + report.scan.scannedResponses + "; Response có SKU: " + report.scan.matchedResponses + "; Tổng số mã: " + report.scan.skus.length + "</p>",
    "<p class=note>Dữ liệu trích từ chuỗi xuất hiện trên các trang one.google.com đã mở, không phải toàn bộ danh mục Store; bộ thu thập giữ nguyên response gốc.</p>",
    report.scan.truncated ? "<p>Đã đạt giới hạn 300 mã; hãy xóa dữ liệu cũ rồi quét lại trang mục tiêu.</p>" : "",
    table(report.scan.skus, true),
    "<p>Thời gian cập nhật (UTC): " + escape(report.scan.updatedAt || "Chưa có") + "</p></section>",
    "<form method=get action=\"" + ROOT + "\"><button name=clear value=1>Xóa dữ liệu quét &amp; test của công cụ</button></form>",
    "<p class=note>Khi quét chỉ bật G1 SKU Scan; khi test chỉ bật G1 ACQ, tắt bộ quét và module G1 Pro Annual Test trùng lặp.</p></html>"
  ].join("");
  $done({ response: { status: 200, headers: headers, body: html } });
})();
