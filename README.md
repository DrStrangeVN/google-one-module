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

*(Tách riêng để test song song mà không ảnh hưởng bản chính; chỉ bật 1 module/plugin tại một thời điểm.)*

* **Link cài đặt `ALL IN ONE_V1` (v2.9.3 — Tối ưu ưu tiên cho Loon iOS):**
  * **Loon (`.plugin` — Khuyên dùng, chuẩn Loon 3.x):**
    ```text
    https://raw.githubusercontent.com/DrStrangeVN/google-one-module/main/loon/g1-all-in-one-v1.plugin
    ```
    *Cài nhanh 1 chạm trên Loon:* [Mở trong Loon](https://www.nsloon.com/openloon/import?plugin=https%3A%2F%2Fraw.githubusercontent.com%2FDrStrangeVN%2Fgoogle-one-module%2Fmain%2Floon%2Fg1-all-in-one-v1.plugin)
  * **Shadowrocket (`.sgmodule`):**
    ```text
    https://raw.githubusercontent.com/DrStrangeVN/google-one-module/main/g1-all-in-one-v1.sgmodule
    ```
  * **Surge (`.sgmodule`):**
    ```text
    https://raw.githubusercontent.com/DrStrangeVN/google-one-module/main/surge/g1-all-in-one-v1.sgmodule
    ```
* **Checklist chuẩn cho Loon (iOS):**
  1. Bật đủ 3 công tắc tổng trong Loon: **MITM**, **Rewrite**, và **Script**; cài + bật Tin cậy chứng chỉ gốc trong Cài đặt iOS.
  2. Chỉ bật duy nhất plugin **`G1 ALL IN ONE_V1`**, tắt các plugin Google One cũ (`G1 All-in-One`, `G1 ACQ`).
  3. Plugin đã gắn sẵn rule 2 vế `AND,((DOMAIN-SUFFIX,google.com),(PROTOCOL,UDP)),REJECT` để chặn Cronet gộp kết nối QUIC (không dùng `max-size=` gây lỗi phân tích Loon). Sau khi bấm **Cập nhật plugin** trong Loon, vuốt đóng hẳn app đang dùng (**Google One / Gemini / Photos / Drive / Gmail**) rồi mở lại để xả kết nối QUIC cũ.
  4. Bấm nút mở trang ngay trong chi tiết plugin (`#!openUrl`) hoặc **chạm trực tiếp banner Thông báo iOS của Loon** (`openUrl`) để nhảy thẳng vào Studio (`https://one.google.com/g1-sku-report`).
* **Nâng cấp v2.9.3 Studio (Đồng bộ thực tế iOS ngày `2026-11-26 / 27` + `crhywun/g1-acq` v7.13.0 & `Dgkncn/g1-acq-plus` v9.6.0):**
  * **Top 5 Gói 1 Chạm cho iPhone (Cả 3 gói sống `#1`, `#2`, `#3` đều bật sẵn `Native Rewrite` mặc định):**
    1. **`#1 Pro 3T 99% (1-Slot 20TB)` — Đang sống:** Mượn duy nhất nút 20TB (`g1.ios.20tb.m.v2` → `com.google.gemini.2tb.ai.m.3month_ip_99p`) để mở **Google AI Pro (5TB/2TB) giảm 99% trong 3 tháng** (không phải Ultra 20TB; tránh xung đột nhiều nút gây `Purchase not completed`). Đã bật sẵn **Native Protobuf Rewrite**, chạy trực tiếp trên **App Google One / Photos / Drive / Gmail** (hoặc Google App, bấm nút 20TB); giá xác nhận 26–27/11: **VN ~7.000₫/T** (sau 3T 489.000₫/T), IN ₹9–10/T, ID Rp 3.000/T, TR ₺5,39–8,69/T, US $0,29/T, SG S$0,48/T + tặng thêm **3 link mời AI Pro 4 tháng** trên `one.google.com`.
    2. **`#2 Pro 3T 99% (Pro tháng · v7.13)` — Đang sống (chuẩn `crhywun v7.13.0`):** Chỉ map chính xác 3 mã Pro/AI tháng (`g1.ios.2tb.ai.m`, `g1.ios.ai.2tb.m.ip_3mo_75p.acq`, `com.google.gemini.2tb.ai.m` → `com.google.gemini.2tb.ai.m.3month_ip_99p`), bỏ gói năm & 20TB/30TB tránh trùng ID trên StoreKit. Đã bật sẵn **Native Rewrite**, chạy mượt trên **App Gemini (iOS) / App Google One / Photos / Drive / Gmail** → Upgrade.
    3. **`#3 TR Ultra 20TB + 30TB giá cũ` — Đang sống (TR Apple ID):** Đổi `g1.ios.20tb.m.v2` → `g1.ios.20tb.m` (`1.989,99 TRY/tháng`, mới v7.12.0) và `g1.ios.30tb.ai.pro.m` → `g1.ios.30tb.m` (`2.949,99 TRY/tháng`), giữ nguyên 2TB. Đã bật sẵn **Native Rewrite** cho App Google One (TR Apple ID) lẫn Photos / Drive.
    4. **`#4 Pro 12T 90p` — Cảnh báo `Tắt promo`:** StoreKit vẫn hiện bảng thanh toán nhưng Google đang tạm tắt giảm 90% (thường báo giá gốc `$19,99/tháng`). Luôn kiểm tra kỹ giá StoreKit trước khi bấm mua.
    5. **`#5 Ultra 1M Free / 75p Dự phòng` — Cảnh báo `Đã khóa 26/11`:** Các mã Ultra `.acq` (1M Free, 75p, 90p) hiện báo `Purchase not completed` trên iOS; giữ làm gói dự phòng (2TB → Ultra 1M Free, 20TB/30TB → Ultra 3T 75p) khi Google mở lại.
  * **Thanh nổi HUD Frame-1 & Ẩn tức thì 0ms không rời trang (`v2.9.3`):** Bấm **`Ẩn thanh nổi`** ẩn ngay tại chỗ bằng CSS-only + tự kế thừa CSP `nonce` (không điều hướng WebView gây màn hình kẹt), kèm nút tròn **`G1`** ở góc dưới phải để mở lại bất cứ lúc nào. Chỉ chèn sau `<body>` trên response **`HTTP 200` + `text/html` + không có `Location`**, tự bỏ qua file tĩnh (`CSS/image/font`) và `3xx/204/304`.
  * **Giao diện Minimal Specular Liquid Glass (`aio-v2.9.3`):** 5 tab tức thì (`Studio`, `Kho SKU`, `Đã Quét`, `Chẩn Đoán`, `Hệ Thống`), nhận diện tự động môi trường chạy (`Loon` / `Surge` / `Shadowrocket`), tích hợp sẵn **Checklist tối ưu cho Loon (iOS)**, hỗ trợ `Auto / Dark / Light` và sao lưu/khôi phục JSON.
  * **10 Profile chuyển 1 chạm:**
    1. `pro-99p-slot20` (**Đang sống**): 1-Slot `g1.ios.20tb.m.v2` → `com.google.gemini.2tb.ai.m.3month_ip_99p` (chống xung đột nhiều nút).
    2. `pro-99p-monthly` (**Đang sống · v7.13**): Chỉ khớp chính xác 3 mã Pro/AI tháng (`g1.ios.2tb.ai.m`, `g1.ios.ai.2tb.m.ip_3mo_75p.acq`, `com.google.gemini.2tb.ai.m`) → `com.google.gemini.2tb.ai.m.3month_ip_99p` (tránh trùng nút gói năm).
    3. `tr-ultra-legacy` (**Đang sống · TR ID**): `20TB → g1.ios.20tb.m` (`1.989,99 TRY`) & `30TB → g1.ios.30tb.m` (`2.949,99 TRY`).
    4. `promo-90p` (Mặc định): Mapping 2TB (theo mã đích chọn) + 20TB/30TB `90p`/`75p`.
    5. `ultra-75p` (Dự phòng v7.8): 20TB & 30TB cố định **3 tháng giảm 75%**.
    6. `v7.6-eft` (Dự phòng v7.6): 20TB & 30TB ưu tiên **1 tháng Free (`.acq`)** và fallback `90p`.
    7. `hybrid-combo` (Dự phòng): 2TB → Ultra 1T Free; 20TB/30TB giữ `90p`/`75p`.
    8. `ultra-1m-free` (Dự phòng): Ánh xạ mọi nút `g1.ios.*` → `g1.ai.ultra.1month_eft.acq`.
    9. `ultra-free-probe`: Dò cùng lúc 11 nút Tháng/Năm sang các mã `_eft` dài hạn (1–12 tháng).
    10. `custom-only`: Chỉ chạy các **Custom Rules** do bạn tự map.
  * **Kho 33 SKU gắn nhãn trạng thái 26/11 + Custom Rules Longest-Prefix + Anti-Wipe History:** Bổ sung `g1.ios.20tb.m` (`1.989,99 TRY`), đưa nhóm **`Đang sống (26/11)`** lên đầu Kho SKU, gắn nhãn rõ `Đang sống` / `Tắt promo` / `Đã khóa 26/11`, hỗ trợ đầy đủ 2 namespace `g1.*` & `com.google.gemini.*`.
  * **Header ổn định & Không MITM Apple:** Chỉ xóa header nén/cache cơ bản (`Accept-Encoding`, `If-None-Match`, `If-Modified-Since`, `Alt-Svc`) và giải mã riêng `one.google.com`, `subscriptionsmobile-pa.googleapis.com`; tuyệt đối giữ nguyên `*.apple.com` / `*.icloud.com`.

### 3. Bản lẻ Backup (Giữ nguyên 2 module tách rời)

*(Chỉ dùng khi muốn chạy độc lập từng chức năng; luôn tắt các module trùng lặp để tránh chạy đè nhau.)*

* **Shadowrocket (`.sgmodule`):**
  * **G1 ACQ (v7.8.0 — vừa quét vừa ghi đè cố định 75p):**
    ```text
    https://raw.githubusercontent.com/DrStrangeVN/google-one-module/main/g1-acq-v7.sgmodule
    ```
  * **G1 SKU Scan (v7.5.0 — chỉ quét thụ động):**
    ```text
    https://raw.githubusercontent.com/DrStrangeVN/google-one-module/main/g1-sku-scan.sgmodule
    ```
* **Loon (`.plugin`):**
  * **G1 ACQ (v7.8.0):**
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
