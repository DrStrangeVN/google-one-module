# google-one-module

Bộ module/plugin tiếng Việt cho **Shadowrocket** và **Loon** (iOS) dùng để thu thập và ghi đè mã SKU gói cước Google One trên `one.google.com` (đồng bộ theo bản gốc `crhywun/g1-acq` v7.5.0 và nâng cấp thêm bản gộp **G1 All-in-One**).

> Lưu ý: Chuỗi mã SKU xuất hiện trong response chỉ chứng minh trang web có mang chuỗi đó, không đồng nghĩa với việc App Store cho phép mua. Tên gói, chu kỳ, giá lần đầu và giá gia hạn phải kiểm tra trực tiếp trên bảng thanh toán App Store (StoreKit).

## Tính năng mới (v7.5.0 + All-in-One)

* **Bản gộp G1 All-in-One (Khuyên dùng)**: Chỉ cần cài & bật **1 module duy nhất**, không phải tắt/bật qua lại giữa bản quét và bản ghi đè, không cần ngắt VPN khi đổi chế độ:
  * **Bảng điều khiển trực tiếp ngay trên Safari** (`https://one.google.com/g1-sku-report`): đổi nhanh chế độ (`Tự động Quét + Ghi đè`, `Chỉ quét gốc`, `Chỉ ghi đè`), chọn nhanh hoặc nhập tay mã đích 2TB, bật/tắt riêng từng gói `2TB / 20TB / 30TB`, mở rộng phạm vi URL (`/ai?`, `/plans`, `batchexecute`), bật/tắt thông báo iOS và xóa riêng từng phần dữ liệu.
  * **Thông báo iOS (`$notification.post`)**: tự báo banner ngay khi phát hiện SKU mới hoặc vừa ghi đè thành công.
* **Cập nhật từ repo gốc v7.5.0**:
  * Đích 2TB mặc định mới: `g1.2tb.ai.12months_ip_90p` (thử nghiệm gói 12 tháng 90p).
  * Thu thập SKU gốc **trước khi ghi đè** (không lưu nhầm mã đích vào danh sách SKU quét được).
  * Bảng **10 response gần nhất** (`recentResponses`) chẩn đoán chi tiết từng lượt tải trang: `new-skus`, `known-skus`, `no-skus`, `limit-reached`, `non-text`.

---

## Link cài đặt Module / Plugin

### 1. Bản gộp All-in-One (Bản ổn định đang dùng chính)

* **Shadowrocket (`.sgmodule`):**
  ```text
  https://raw.githubusercontent.com/DrStrangeVN/google-one-module/main/g1-all-in-one.sgmodule
  ```
* **Loon (`.plugin`):**
  ```text
  https://raw.githubusercontent.com/DrStrangeVN/google-one-module/main/loon/g1-all-in-one.plugin
  ```

### 2. Bản nâng cấp thử nghiệm: **G1 ALL IN ONE_V1**

*(Tách riêng để test song song mà không ảnh hưởng bản chính; chỉ bật 1 module tại một thời điểm.)*

* **Nâng cấp so với bản chính (v1.1 — tích hợp ý tưởng từ `crhywun/g1-acq`, `shelken/proxy`, `xinnyu/g1-acq-surge`, `kawhaiyoung/rule` & `tameruict/gg-ultra-1M`):**
  * **3 Profile chuyển nhanh trên web báo cáo:**
    1. `promo-90p` (Mặc định): Mapping 2TB (`g1.2tb.ai.12months_ip_90p` / tùy chỉnh) + 20TB/30TB `90p`/`75p` fallback.
    2. `ultra-1m-free` (từ `gg-ultra-1M`): Ánh xạ **mọi** nút `g1.ios.*` sang `g1.ai.ultra.1month_eft.acq` (Ultra 30TB dùng thử miễn phí 1 tháng).
    3. `ultra-free-probe` (từ `gg-ultra-1M` v3.1): Dò cùng lúc 11 nút Tháng/Năm sang các mã `_eft.acq` / `_eft` dài hạn (1/2/3/6/12 tháng).
  * **Bảng nổi `<details>` ngay trên trang Google App** (`overlayPanel`): Xem nhanh các cặp SKU vừa bị sửa ngay trong WebView không cần chuyển app.
  * **Chặn QUIC theo domain**: Chỉ chặn `UDP 443` trên `one.google.com` & `subscriptionsmobile-pa.googleapis.com` (không làm chậm HTTP/3 của app khác).
  * **Ép response thuần & mở rộng URL**: Tự xóa `Accept-Encoding`, `If-None-Match`, `If-Modified-Since`, `Alt-Svc` + giải mã `Uint8Array`; phạm vi mở rộng hỗ trợ `/ai?`, `/upsell`, `/plans`, `/storage`, `batchexecute`.
  * **Hỗ trợ Native Protobuf (app Google One riêng)**: Bắt và giải mã API `GetDynamicStorefrontInfo` (*Chỉ quét* hoặc *Quét + Ghi đè Protobuf*).
  * **Strict Catalog & Highlight PROMO**: Tùy chọn chỉ ghi đè khi tài khoản có sẵn mã khuyến mãi + đẩy mã PROMO lên đầu bảng với nút gán 1 chạm.
* **Link cài đặt `ALL IN ONE_V1`:**
  * **Shadowrocket (`.sgmodule`):**
    ```text
    https://raw.githubusercontent.com/DrStrangeVN/google-one-module/main/g1-all-in-one-v1.sgmodule
    ```
  * **Loon (`.plugin`):**
    ```text
    https://raw.githubusercontent.com/DrStrangeVN/google-one-module/main/loon/g1-all-in-one-v1.plugin
    ```
    *Cài nhanh 1 chạm trên Loon:* [Mở trong Loon](https://www.nsloon.com/openloon/import?plugin=https%3A%2F%2Fraw.githubusercontent.com%2FDrStrangeVN%2Fgoogle-one-module%2Fmain%2Floon%2Fg1-all-in-one-v1.plugin)
  * **Surge (`.sgmodule`):**
    ```text
    https://raw.githubusercontent.com/DrStrangeVN/google-one-module/main/surge/g1-all-in-one-v1.sgmodule
    ```

### 3. Bản lẻ Backup (Giữ nguyên 2 module tách rời)

*(Chỉ dùng khi muốn chạy độc lập từng chức năng; luôn tắt các module trùng lặp để tránh chạy đè nhau.)*

* **Shadowrocket (`.sgmodule`):**
  * **G1 ACQ (v7.5.0 — vừa quét vừa ghi đè):**
    ```text
    https://raw.githubusercontent.com/DrStrangeVN/google-one-module/main/g1-acq-v7.sgmodule
    ```
  * **G1 SKU Scan (v7.5.0 — chỉ quét thụ động):**
    ```text
    https://raw.githubusercontent.com/DrStrangeVN/google-one-module/main/g1-sku-scan.sgmodule
    ```
* **Loon (`.plugin`):**
  * **G1 ACQ (v7.5.0):**
    ```text
    https://raw.githubusercontent.com/DrStrangeVN/google-one-module/main/loon/g1-acq-v7.plugin
    ```
  * **G1 SKU Scan (v7.5.0):**
    ```text
    https://raw.githubusercontent.com/DrStrangeVN/google-one-module/main/loon/g1-sku-scan.plugin
    ```

---

## Bảng mapping 3 mức

Script khớp URL theo phạm vi (`^https://one\.google\.com/ai\?` mặc định, hoặc mở rộng thêm `/plans` và `batchexecute` trong cấu hình All-in-One) và thay thế theo bảng sau:

| SKU nguồn đầy đủ trong response | Đích mặc định | Đích dự phòng (Fallback) |
|---|---|---|
| Tiền tố `g1.ios.2tb.` | `g1.2tb.ai.12months_ip_90p` (tùy chỉnh được ở bản All-in-One) | Không |
| `g1.ios.20tb.m.v2` | `g1.20tb.3months_ip_90p.acq` | `g1.20tb.3months_ip_75p.acq` |
| `g1.ios.30tb.ai.pro.m` | `g1.ai.ultra.3months_ip_90p.acq` | `g1.ai.ultra.3months_ip_75p.acq` |

Logic fallback 20TB / 30TB: nếu đích `90p` mặc định không xuất hiện trong response gốc mà `75p` có xuất hiện thì tự động dùng `75p`; ngược lại vẫn dùng `90p`.

## Cài đặt HTTPS Decryption (MITM)

Vào **Config → bấm biểu tượng (i) cạnh file cấu hình đang dùng → HTTPS Decryption** (hoặc mục **MITM** trong Loon).

![Cửa sổ Config: bấm (i) cạnh file cấu hình để mở HTTPS Decryption](docs-config-entry.png)

1. Cài 1 module/plugin ở trên (khuyên dùng **G1 All-in-One**) và bật lên, tắt các module Google One cũ khác.
2. Bật công tắc **HTTPS Decryption** (MITM).
3. Nếu chưa có chứng chỉ: tạo & cài chứng chỉ → vào iOS **Cài đặt → Cài đặt chung → Quản lý VPN & Thiết bị** cài profile → vào **Cài đặt chung → Giới thiệu → Cài đặt tin cậy chứng nhận** bật tin cậy chứng chỉ gốc.
4. Kiểm tra danh sách **Hostname** của MITM đã có `one.google.com`. Kiểm tra **Skip Proxy** trong Config không chứa `*.google.com` hay `one.google.com`.
5. Kết nối VPN (chọn Global Routing = **Config** trên Shadowrocket).

## Quy trình sử dụng nhanh (với bản G1 All-in-One)

1. Bật **G1 All-in-One** và kết nối VPN.
2. Mở **Google App (icon chữ G) → Quản lý Google One** (không dùng app Google One đứng riêng), lướt qua các gói **2TB / Pro**, **20TB**, **30TB** (gạt qua lại tháng/năm nếu có). Script tự động quét lưu danh sách SKU gốc rồi ghi đè gói đích và bắn thông báo iOS.
3. Mở Safari vào `https://one.google.com/g1-sku-report` để xem SKU thu thập được, bảng 10 response gần nhất, xuất JSON, hoặc đổi chế độ / đổi mã 2TB khác (`g1.2tb.ai.annual`, v.v.) mà không cần tắt VPN.

![Minh họa bảng chọn gói Google One](docs-ultra-plans.png)

## Xem báo cáo & Gỡ lỗi

* Trang báo cáo & Bảng điều khiển: `https://one.google.com/g1-sku-report`
* Xuất file JSON: `https://one.google.com/g1-sku-report?format=json`
* Xóa dữ liệu quét & test (giữ nguyên cấu hình All-in-One): `https://one.google.com/g1-sku-report?clear=1`

*(Ghi chú: Các module/plugin có rule chặn `UDP 443` để ép HTTP/3/QUIC lùi về TCP cho MITM hoạt động, có thể ảnh hưởng lưu lượng HTTP/3 của app khác khi đang bật.)*

## Cấu trúc file

| File | Chức năng |
|---|---|
| [g1-all-in-one-v1.sgmodule](g1-all-in-one-v1.sgmodule) | **Module thử nghiệm ALL IN ONE_V1 cho Shadowrocket** |
| [loon/g1-all-in-one-v1.plugin](loon/g1-all-in-one-v1.plugin) | **Plugin thử nghiệm ALL IN ONE_V1 cho Loon** |
| [surge/g1-all-in-one-v1.sgmodule](surge/g1-all-in-one-v1.sgmodule) | **Module thử nghiệm ALL IN ONE_V1 cho Surge** |
| [g1-all-in-one-v1.js](g1-all-in-one-v1.js) | Engine ALL IN ONE_V1 (Web + Native Protobuf + Strict Catalog) |
| [g1-sku-report-v1.js](g1-sku-report-v1.js) | Trang báo cáo & Bảng điều khiển cho ALL IN ONE_V1 |
| [g1-all-in-one.sgmodule](g1-all-in-one.sgmodule) | **Module gộp ổn định Shadowrocket** (dùng `g1-all-in-one.js` + `g1-sku-report.js`) |
| [loon/g1-all-in-one.plugin](loon/g1-all-in-one.plugin) | **Plugin gộp tối ưu Loon** (dùng `g1-all-in-one.js` + `g1-sku-report.js`) |
| [g1-all-in-one.js](g1-all-in-one.js) | Engine gộp v7.5: quét + ghi đè theo cấu hình động + thông báo iOS |
| [g1-acq-v7.sgmodule](g1-acq-v7.sgmodule) | Bản lẻ backup Shadowrocket: G1 ACQ v7.5.0 |
| [g1-sku-scan.sgmodule](g1-sku-scan.sgmodule) | Bản lẻ backup Shadowrocket: chỉ quét SKU v7.5.0 |
| [g1-pro-annual-test.sgmodule](g1-pro-annual-test.sgmodule) | Bản tương thích cũ (trỏ chung tới `g1-acq.js`) |
| [loon/g1-acq-v7.plugin](loon/g1-acq-v7.plugin) | Bản lẻ backup Loon: G1 ACQ v7.5.0 |
| [loon/g1-sku-scan.plugin](loon/g1-sku-scan.plugin) | Bản lẻ backup Loon: chỉ quét SKU v7.5.0 |
| [g1-acq.js](g1-acq.js) | Script G1 ACQ v7.5.0 (đồng bộ bản gốc) |
| [g1-sku-scan.js](g1-sku-scan.js) | Script quét thụ động nâng cấp chẩn đoán v7.5.0 |
| [g1-sku-report.js](g1-sku-report.js) | Trang báo cáo HTML tiếng Việt + Bảng điều khiển All-in-One + xuất JSON |
| [docs/pro-annual-test.md](docs/pro-annual-test.md) | Tài liệu chi tiết quy trình quét, chẩn đoán & xử lý sự cố |

## Kiểm thử offline

Yêu cầu Node.js 18+:

```sh
node --test tests/sku-tools.test.cjs
```
