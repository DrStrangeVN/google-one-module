# Hướng dẫn test & chẩn đoán Google One SKU (v7.5.0 + All-in-One)

Tài liệu chi tiết cho bộ module **G1 All-in-One** (khuyên dùng) và 2 bản lẻ backup **G1 ACQ / G1 SKU Scan** trên Shadowrocket & Loon (iOS).

## 1. Link cài đặt & Nguyên tắc chọn module

### Khuyên dùng — Bản gộp All-in-One (chỉ bật 1 cái)
* **Shadowrocket:** `https://raw.githubusercontent.com/DrStrangeVN/google-one-module/main/g1-all-in-one.sgmodule`
* **Loon:** `https://raw.githubusercontent.com/DrStrangeVN/google-one-module/main/loon/g1-all-in-one.plugin`

Khi dùng **G1 All-in-One**, tắt toàn bộ **G1 ACQ**, **G1 SKU Scan**, **G1 Pro Annual Test** để tránh chạy trùng. Việc đổi chế độ (`Tự động`, `Chỉ quét gốc`, `Chỉ ghi đè`) hoặc đổi mã đích 2TB thực hiện trực tiếp trên trang báo cáo `https://one.google.com/g1-sku-report`.

### Bản lẻ Backup (nếu dùng tách rời)
* **Shadowrocket — G1 ACQ (v7.5.0):** `https://raw.githubusercontent.com/DrStrangeVN/google-one-module/main/g1-acq-v7.sgmodule`
* **Shadowrocket — G1 SKU Scan (v7.5.0):** `https://raw.githubusercontent.com/DrStrangeVN/google-one-module/main/g1-sku-scan.sgmodule`
* **Loon — G1 ACQ (v7.5.0):** `https://raw.githubusercontent.com/DrStrangeVN/google-one-module/main/loon/g1-acq-v7.plugin`
* **Loon — G1 SKU Scan (v7.5.0):** `https://raw.githubusercontent.com/DrStrangeVN/google-one-module/main/loon/g1-sku-scan.plugin`

*(Lưu ý: từ v7.5.0, ngay cả bản `G1 ACQ` đơn lẻ cũng tự quét SKU trước khi ghi đè; chỉ khi muốn hoàn toàn không sửa body web mới cần chuyển sang `G1 SKU Scan` hoặc chọn chế độ `Chỉ quét gốc` trong `G1 All-in-One`.)*

## 2. Cấu hình HTTPS Decryption (MITM)

1. Vào tab **Config** → bấm **(i)** cạnh file cấu hình đang dùng → **HTTPS Decryption** (hoặc **MITM** trên Loon).
2. Bật **HTTPS Decryption / MITM**.
3. Tạo/cài chứng chỉ nếu chưa có, sau đó vào iOS **Cài đặt → Cài đặt chung → Quản lý VPN & Thiết bị** cài profile, và bật tin cậy tại **Cài đặt chung → Giới thiệu → Cài đặt tin cậy chứng nhận**.
4. Đảm bảo `one.google.com` có trong danh sách **Hostname** của MITM và **không** nằm trong **Skip Proxy**.
5. Đặt **Global Routing** ở chế độ **Config** (hoặc Proxy), tránh để Direct làm bỏ qua script.

## 3. Quét & Test với Bảng điều khiển + Chẩn đoán v7.5.0

1. Bật **G1 All-in-One**, kết nối VPN.
2. Mở Safari vào `https://one.google.com/g1-sku-report` kiểm tra badge **Script nội bộ đang hoạt động · v7.5.0-vi** để chắc chắn MITM đã chạy.
3. Mở **Google App (icon chữ G 4 màu)** → **Quản lý Google One** (không dùng app Google One đứng riêng vì app riêng dùng StoreKit native).
4. Mở các gói **2TB / Pro**, **20TB**, **30TB** (gạt qua lại tháng/năm nếu có).
   * Với bản **All-in-One**: mặc định chạy chế độ `Tự động` — tự động quét & lưu SKU gốc vào bộ nhớ trước, sau đó ghi đè ngay trên response `/ai?` và bắn thông báo iOS.
   * Nếu muốn đổi mã đích 2TB (ví dụ thử `g1.2tb.ai.annual` thay cho `g1.2tb.ai.12months_ip_90p`), mở lại trang báo cáo Safari bấm chọn preset hoặc nhập mã mới rồi bấm **Lưu cấu hình**.
5. Khi bảng thanh toán **App Store** hiện lên, kiểm tra kỹ tên gói, chu kỳ, giá lần đầu và giá gia hạn thực tế trước khi bấm xác nhận.

## 4. Giải thích bảng chẩn đoán 10 response gần nhất (`recentResponses`)

| Trạng thái | Ý nghĩa |
|---|---|
| `new-skus` | Bắt được response văn bản có chứa ít nhất 1 mã SKU mới chưa từng thấy và đã lưu vào danh sách. |
| `known-skus` | Đã bắt được response và thấy SKU, nhưng toàn bộ các mã này đã có trong danh sách trước đó (chỉ tăng bộ đếm). |
| `no-skus` | Bắt được response văn bản từ `one.google.com`, nhưng không có chuỗi `g1.*` / `com.google.one.*` nào. |
| `limit-reached` | Đã chạm trần 300 mã nên không lưu thêm được mã mới; xuất JSON rồi xóa danh sách quét nếu cần quét đợt mới. |
| `non-text` | Response nhận được không phải dạng văn bản (ảnh, font, binary). |

## 5. Xử lý sự cố thường gặp

| Hiện tượng | Cách kiểm tra & xử lý |
|---|---|
| Safari mở `/g1-sku-report` ra 404 của Google | Kiểm tra VPN đã bật chưa, module có đang bật không, `one.google.com` đã có trong MITM Hostname chưa, chứng chỉ gốc iOS đã tin cậy chưa. |
| `scannedResponses`, `nonTextResponses` và thời gian đứng yên hoàn toàn | Kiểm tra **Skip Proxy** có chứa `*.google.com` hoặc `one.google.com` không; đảm bảo mở bằng **Google App (chữ G)** chứ không phải app Google One riêng; thử ngắt và kết nối lại VPN. |
| `scannedResponses` tăng & hiện `known-skus` nhưng không có mã mới | Script hoạt động bình thường; response Google gửi về lặp lại các mã đã lưu trước đó. |
| Đã thấy mã `g1.ios.2tb.*` trong danh sách quét nhưng `annualHitCount = 0` | Mã có thể nằm ở endpoint `/plans` hoặc `batchexecute` thay vì `/ai?`. Nếu dùng bản **G1 All-in-One**, thử chuyển **Phạm vi URL ghi đè** sang **Mở rộng** trong Bảng điều khiển rồi tải lại trang gói cước. |
| `status=rewritten`, `hitCount > 0` nhưng `annualHitCount = 0` | Chỉ khớp 20TB hoặc 30TB, chưa khớp gói 2TB. |
| Quét chạm mốc 300 mã | Bấm **Xuất JSON** để sao lưu, sau đó bấm **Chỉ xóa danh sách quét** (hoặc mở `?clear=scan`) để dọn chỗ cho đợt quét mới mà không mất cấu hình All-in-One. |
