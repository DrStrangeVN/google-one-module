# Hướng dẫn test gói năm Pro & quét SKU Google One

Tài liệu chi tiết cho bộ module **G1 ACQ (`g1-acq-v7`)** và **G1 SKU Scan** trên Shadowrocket (iOS).

## 1. Link cài đặt & Nguyên tắc bật/tắt

* **Shadowrocket — G1 ACQ** (ghi đè 3 mức):
  ```text
  https://raw.githubusercontent.com/DrStrangeVN/google-one-module/main/g1-acq-v7.sgmodule
  ```
* **Shadowrocket — G1 SKU Scan** (quét thụ động):
  ```text
  https://raw.githubusercontent.com/DrStrangeVN/google-one-module/main/g1-sku-scan.sgmodule
  ```
* **Loon — G1 ACQ** (ghi đè 3 mức):
  ```text
  https://raw.githubusercontent.com/DrStrangeVN/google-one-module/main/loon/g1-acq-v7.plugin
  ```
* **Loon — G1 SKU Scan** (quét thụ động):
  ```text
  https://raw.githubusercontent.com/DrStrangeVN/google-one-module/main/loon/g1-sku-scan.plugin
  ```

Không bật cùng lúc cả hai module. Chuyển giai đoạn nào thì bật đúng module đó, tắt module còn lại và **ngắt/kết nối lại VPN**.

| Giai đoạn | G1 SKU Scan | G1 ACQ | Module khác |
|---|---|---|---|
| Quét SKU gốc | Bật | Tắt | Tắt |
| Test mapping 3 mức | Tắt | Bật | Tắt |

## 2. Cấu hình HTTPS Decryption (MITM)

1. Vào tab **Config** → bấm **(i)** cạnh file cấu hình đang active → **HTTPS Decryption**.
2. Bật **HTTPS Decryption**.
3. Tạo/cài chứng chỉ nếu chưa có, sau đó vào iOS **Cài đặt → Cài đặt chung → Quản lý VPN & Thiết bị** cài profile, và bật tin cậy tại **Cài đặt chung → Giới thiệu → Cài đặt tin cậy chứng nhận**.
4. Đảm bảo `one.google.com` có trong danh sách **Hostname** của HTTPS Decryption (không phải DNS Hosts) và **không** nằm trong **Skip Proxy**.
5. Đặt **Global Routing** ở chế độ **Config** (hoặc Proxy), tránh để Direct làm bỏ qua rule/script.

## 3. Quét SKU gốc đúng cách

1. Chỉ bật **G1 SKU Scan**, kết nối lại VPN.
2. Mở **Google App (chữ G nhiều màu)** → vào **Quản lý Google One** (không mở app Google One đứng riêng vì app riêng dùng StoreKit native, không đi qua webview `one.google.com`).
3. Mở xem các gói **2TB / Pro**, **20TB**, **30TB**, gạt qua lại giữa **Tháng / Năm** nếu có và đợi trang tải xong.
4. Mở Safari vào `https://one.google.com/g1-sku-report` để kiểm tra danh sách SKU đã thu thập.

## 4. Test ghi đè 3 mức & Kiểm tra kết quả

1. Tắt **G1 SKU Scan**, chỉ bật **G1 ACQ**, kết nối lại VPN.
2. Mở lại Google App → vào trang gói cước Google One → chọn gói cần test.
3. Khi khung thanh toán **App Store** hiện lên, kiểm tra kỹ tên gói, chu kỳ và giá thực tế trước khi bấm xác nhận.

## 5. Xử lý sự cố thường gặp

| Hiện tượng | Cách kiểm tra & xử lý |
|---|---|
| Safari mở `/g1-sku-report` ra 404 của Google | Kiểm tra VPN đã bật chưa, 1 trong 2 module có đang bật không, `one.google.com` đã có trong HTTPS Decryption chưa, chứng chỉ đã tin cậy chưa. |
| Trang báo cáo ghi `Chưa có bản ghi` hoặc `scannedResponses = 0` | Kiểm tra **Skip Proxy** có chứa `google.com` không; đảm bảo mở bằng **Google App (icon chữ G)** chứ không phải app Google One riêng; thử tắt/bật lại VPN. |
| `scannedResponses > 0` nhưng không có SKU nào | Trang vừa mở không chứa chuỗi `g1.*` / `com.google.one.*`; thử bấm sâu vào từng gói 2TB / Pro / 20TB / 30TB và chuyển đổi tháng/năm. |
| `status=rewritten`, `hitCount > 0` nhưng `annualHitCount = 0` | Response chỉ khớp 20TB hoặc 30TB, chưa khớp tiền tố `g1.ios.2tb.`. |
| Quét chạm mốc 300 mã | Xuất JSON để lưu lại rồi bấm nút xóa trên trang báo cáo (hoặc mở `?clear=1`), sau đó quay lại URL gốc không có `?clear=1` để quét tiếp. |
