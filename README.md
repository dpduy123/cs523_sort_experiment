# SortEx – Ứng dụng Sắp xếp & Minh họa Thuật toán (Flask)

Ứng dụng **SortEx** cho phép người dùng chọn lựa tập tin dữ liệu nhị phân chứa các số thực (8 bytes), thực hiện sắp xếp tăng dần và minh họa trực quan quá trình sắp xếp bằng biểu đồ động.

## Cấu trúc dự án
- `app.py`: Backend Flask phục vụ ứng dụng.
- `requirements.txt`: Danh sách các thư viện Python cần thiết.
- `templates/`: Thư mục chứa giao diện HTML.
  - `index.html`: Trang chính thực hiện sắp xếp và minh họa.
  - `generate_data.html`: Công cụ tạo dữ liệu nhị phân mẫu.
- `static/`: Thư mục chứa tài nguyên tĩnh (CSS, JavaScript).
  - `index.css`: Định dạng giao diện hiện đại (glassmorphism).
  - `index.js`: Xử lý logic thuật toán và điều khiển hoạt động canvas.

## Hướng dẫn cài đặt và khởi chạy

### 1. Cài đặt các thư viện cần thiết
Mở terminal tại thư mục dự án và chạy lệnh:
```bash
pip install -r requirements.txt
```

### 2. Khởi chạy ứng dụng
Chạy tệp `app.py` bằng Python:
```bash
python3 app.py
```
Sau khi chạy, truy cập địa chỉ: **[http://localhost:3000](http://localhost:3000)** trên trình duyệt.

## Quy trình sử dụng

### Bước 1: Tạo dữ liệu mẫu
- Bạn có thể nhấn nút **🎲 Sinh dữ liệu mẫu...** ngay tại trang chủ.
- Nhập số lượng phần tử (ví dụ: 20) và phạm vi giá trị.
- Nhấn **🚀 Tạo & Tải lên** để dữ liệu tự động được nạp vào hệ thống sắp xếp.
- Bạn có thể nhấn nút **💾 Tải tập tin gốc (.bin)** trong bảng thông tin tệp để lưu lại tệp dữ liệu vừa tạo.
- Ngoài ra, bạn vẫn có thể sử dụng trang riêng tại: `http://localhost:3000/generate`.



### Bước 2: Sắp xếp và Minh họa
- Truy cập trang chủ: `http://localhost:3000/`.
- Nhấn vào khu vực **Chọn tập tin nhị phân** để tải tệp `.bin` vừa tạo lên.
- Chọn thuật toán sắp xếp (Bubble, Selection, Insertion, Merge, Quick).
- Nhấn **Chạy** để xem quá trình thuật toán hoạt động trên biểu đồ.
- Bạn có thể điều chỉnh thanh **Tốc độ** hoặc nhấn **Bước** để xem từng thay đổi nhỏ.

### Bước 3: Lưu kết quả
- Sau khi quá trình sắp xếp kết thúc (hoàn tất 100%), nhấn nút **Tải kết quả (.bin)** để lưu lại tệp dữ liệu đã được sắp xếp tăng dần.

---
*Dự án thực hiện cho học phần CS523.*
