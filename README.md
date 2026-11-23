# g1-acq-vi

Công cụ thu thập và ghi đè mã SKU gói cước Google One (iOS) dành cho **Shadowrocket** (bản tiếng Việt, clone & cập nhật link script độc lập từ `crhywun/g1-acq`).

**G1 ACQ (`g1-acq-v7`) gộp 3 mức ghi đè:** chuyển gói iOS 2TB gốc (`g1.ios.2tb.*`) → `g1.2tb.ai.annual` (gói năm), đồng thời giữ nguyên mapping ưu đãi 20TB / 30TB và logic fallback 75p độc lập. Chi tiết quy trình quét, test và kiểm tra thực tế xem tại [Hướng dẫn test gói năm Pro & quét SKU](docs/pro-annual-test.md).

> Lưu ý: Chuỗi mã SKU xuất hiện trong response chỉ chứng minh trang web có mang chuỗi đó, không đồng nghĩa với việc App Store cho phép mua. Tên gói, chu kỳ, giá lần đầu và giá gia hạn phải kiểm tra trực tiếp trên bảng thanh toán App Store (StoreKit).

## Link cài đặt Module (Shadowrocket)

**G1 ACQ: Ghi đè 3 mức & Trang báo cáo nội bộ**

```text
https://raw.githubusercontent.com/DrStrangeVN/g1-acq-vi/main/g1-acq-v7.sgmodule
```

**G1 SKU Scan: Thu thập thụ động SKU từ webview**

```text
https://raw.githubusercontent.com/DrStrangeVN/g1-acq-vi/main/g1-sku-scan.sgmodule
```

* `G1 SKU Scan` đọc các chuỗi `g1.*` và `com.google.one.*` trong response của `one.google.com/`, lọc trùng và đếm số lần xuất hiện (tối đa 300 mã), giữ nguyên response gốc (`$done({})`), chỉ lưu cục bộ trên máy.
* `g1-pro-annual-test.sgmodule` là file tương thích dùng chung `g1-acq.js`, không cần bật thêm nếu đã dùng `G1 ACQ`.

## Bảng mapping 3 mức

Script khớp URL `^https://one\.google\.com/ai\?` và thay thế theo bảng sau:

| SKU nguồn đầy đủ trong response | Đích mặc định | Đích dự phòng (Fallback) |
|---|---|---|
| Tiền tố `g1.ios.2tb.` | `g1.2tb.ai.annual` | Không |
| `g1.ios.20tb.m.v2` | `g1.20tb.3months_ip_90p.acq` | `g1.20tb.3months_ip_75p.acq` |
| `g1.ios.30tb.ai.pro.m` | `g1.ai.ultra.3months_ip_90p.acq` | `g1.ai.ultra.3months_ip_75p.acq` |

Logic fallback 20TB / 30TB: nếu đích `90p` mặc định không xuất hiện trong response gốc mà `75p` có xuất hiện thì mới dùng `75p`; ngược lại vẫn dùng `90p`. Nếu cả 3 mức đều không khớp, trả về nguyên bản response gốc.

## Cài đặt trên Shadowrocket

Vào **Config → bấm biểu tượng (i) cạnh file cấu hình đang dùng → HTTPS Decryption**.

![Cửa sổ Config: bấm (i) cạnh file cấu hình để mở HTTPS Decryption](docs-config-entry.png)

1. Thêm module bằng URL ở trên trong tab **Module** của Shadowrocket.
2. Trong **HTTPS Decryption**, bật công tắc giải mã HTTPS.
3. Nếu chưa có chứng chỉ: tạo & cài chứng chỉ trong mục đó → vào iOS **Cài đặt → Cài đặt chung → Quản lý VPN & Thiết bị** để cài profile Shadowrocket → vào **Cài đặt chung → Giới thiệu → Cài đặt tin cậy chứng nhận** và bật tin cậy chứng chỉ gốc.
4. Kiểm tra trong danh sách **Hostname** của HTTPS Decryption đã có `one.google.com` (module tự thêm qua `%APPEND% one.google.com`). Kiểm tra **Skip Proxy** trong Config không chứa `*.google.com` hay `one.google.com`.
5. Sau mỗi lần bật/tắt module hoặc sửa cấu hình, **ngắt và kết nối lại VPN** rồi mới mở lại Google App.

## Quy trình sử dụng trên iPhone

| Giai đoạn | G1 SKU Scan | G1 ACQ | Module rewrite khác |
|---|---|---|---|
| Quét SKU gốc | **Bật** | Tắt | Tắt |
| Test ghi đè 3 mức | Tắt | **Bật** | Tắt |

1. **Giai đoạn quét**: Chỉ bật **G1 SKU Scan**, kết nối lại VPN. Mở **Google App (icon chữ G) → Quản lý Google One** (không dùng app Google One riêng), duyệt qua các gói **2TB / Pro**, **20TB**, **30TB** (gạt qua lại tháng/năm nếu có). Sau đó mở Safari vào `https://one.google.com/g1-sku-report` để xem SKU thu thập được.
2. **Giai đoạn test**: Tắt **G1 SKU Scan**, chỉ bật **G1 ACQ**, kết nối lại VPN. Mở lại Google App → vào trang gói cước → chọn gói cần test và kiểm tra thông tin thực tế trên bảng thanh toán **App Store**.

![Minh họa bảng chọn gói Google One](docs-ultra-plans.png)

## Xem báo cáo & Gỡ lỗi

Khi VPN đang bật và 1 trong 2 module đang mở, dùng Safari truy cập:
* Xem báo cáo HTML: `https://one.google.com/g1-sku-report`
* Xuất file JSON: `https://one.google.com/g1-sku-report?format=json`
* Xóa 2 key lưu trữ của công cụ (`g1.sku.scan.v1`, `g1.pro.annual.test.v1`): `https://one.google.com/g1-sku-report?clear=1`

Các trường cần chú ý trong báo cáo / log Shadowrocket (`[g1-acq]`):
* `test.version`: Phải là `g1-acq-v7`.
* `test.hitCount`: Tổng số lần ghi đè cả 3 mức.
* `test.annualHitCount`: Số lần ghi đè riêng gói **2TB năm**.
* `fallback=75p`: Mức 20TB hoặc 30TB đã lùi về gói `75p` có trong response gốc.

*(Ghi chú: Cả hai module có rule chặn `UDP 443` để ép HTTP/3/QUIC lùi về TCP cho MITM hoạt động, có thể ảnh hưởng lưu lượng HTTP/3 của app khác khi đang bật.)*

## Cấu trúc file

| File | Chức năng |
|---|---|
| [g1-acq-v7.sgmodule](g1-acq-v7.sgmodule) | Module chính G1 ACQ (`g1-acq-v7`) & trang báo cáo nội bộ |
| [g1-pro-annual-test.sgmodule](g1-pro-annual-test.sgmodule) | Module tương thích dùng chung `g1-acq.js` |
| [g1-sku-scan.sgmodule](g1-sku-scan.sgmodule) | Module quét SKU thụ động & trang báo cáo nội bộ |
| [g1-acq.js](g1-acq.js) | Script `g1-acq-v7` xử lý mapping 3 mức & lưu kết quả |
| [g1-sku-scan.js](g1-sku-scan.js) | Script quét, lọc trùng & đếm SKU |
| [g1-sku-report.js](g1-sku-report.js) | Script tạo trang báo cáo HTML / xuất JSON / xóa dữ liệu cục bộ |
| [docs/pro-annual-test.md](docs/pro-annual-test.md) | Tài liệu chi tiết quy trình quét, kiểm tra & xử lý sự cố |

## Kiểm thử offline

Yêu cầu Node.js 18+:

```sh
node --test tests/sku-tools.test.cjs
```
