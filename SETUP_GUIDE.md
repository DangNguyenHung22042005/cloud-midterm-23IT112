# Hướng dẫn triển khai Cloud Midterm 23IT112

Tài liệu này liệt kê các thao tác cần thực hiện sau khi mã nguồn đã được tạo. Không ghi mật khẩu, connection string thật hoặc session secret vào tài liệu và ảnh báo cáo.

## 1. Tạo MongoDB Atlas deployment

1. Đăng nhập MongoDB Atlas và tạo một Project riêng cho bài giữa kỳ.
2. Chọn **Build a Database** và tạo Free/Flex cluster ở AWS Singapore nếu có thể.
3. Chờ cluster chuyển sang trạng thái sẵn sàng.
4. Mở **Database > Browse Collections**.
5. Chọn **Create Database**.
6. Nhập database `DB_23IT112` và collection `books`.
7. Trong database vừa tạo, tạo thêm collection `sessions`.

Chụp ảnh database và hai collection, nhưng không để lộ thông tin đăng nhập.

## 2. Tạo TTL index cho session

1. Mở collection `DB_23IT112.sessions`.
2. Chọn tab **Indexes** và chọn **Create Index**.
3. Nhập field `expires` với kiểu tăng dần `1`.
4. Bật tùy chọn TTL và đặt `Expire After Seconds` bằng `0`.
5. Tạo index và chụp ảnh kết quả.

Ứng dụng đã đặt `autoRemove: disabled` vì TTL index được quản trị trước trên Atlas. Tài khoản chạy ứng dụng vì vậy không cần quyền `CREATE_INDEX`.

## 3. Tạo custom database roles

Mở **Security > Database & Network Access > Custom Roles**.

### role_book_reader_23IT112

Tạo role `role_book_reader_23IT112` với một privilege:

| Action | Database | Collection |
|---|---|---|
| FIND | DB_23IT112 | books |

### role_book_writer_23IT112

Tạo role `role_book_writer_23IT112` với các privilege:

| Action | Database | Collection |
|---|---|---|
| INSERT | DB_23IT112 | books |
| FIND | DB_23IT112 | sessions |
| INSERT | DB_23IT112 | sessions |
| UPDATE | DB_23IT112 | sessions |
| REMOVE | DB_23IT112 | sessions |

Writer không có `FIND` trên `books`. Các quyền trên `sessions` chỉ phục vụ kho session kỹ thuật.

## 4. Tạo hai database users

Mở tab **Database Users** và tạo:

1. `reader_23IT112`, dùng mật khẩu ngẫu nhiên riêng, gán custom role `role_book_reader_23IT112`.
2. `writer_23IT112`, dùng mật khẩu ngẫu nhiên khác, gán custom role `role_book_writer_23IT112`.

Không gán thêm built-in role `readWrite`, `atlasAdmin` hoặc quyền trên mọi database.

## 5. Cấu hình Network Access cho local

1. Mở **Security > Database & Network Access > IP Access List**.
2. Chọn **Add IP Address**.
3. Chọn **Add Current IP Address** và ghi chú `Development computer`.
4. Không dùng `0.0.0.0/0` nếu không thật sự cần thiết.

## 6. Lấy hai connection strings

Tại cluster, chọn **Connect > Drivers > Node.js** và sao chép URI mẫu. Tạo hai URI có cùng hostname nhưng khác username và password.

Nếu mật khẩu chứa ký tự đặc biệt, URL-encode mật khẩu trước khi đặt vào URI.

## 7. Chạy ứng dụng local

Trong thư mục `Workspace/Implement`:

```powershell
Copy-Item .env.example .env
```

Mở `.env` và thay các placeholder của `MONGODB_READ_URI`, `MONGODB_WRITE_URI` và `SESSION_SECRET`. Có thể tạo secret bằng PowerShell:

```powershell
$bytes = New-Object byte[] 48
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

Sau đó chạy:

```powershell
npm install
npm run dev
```

Mở `http://localhost:3000/books` và `http://localhost:3000/health`.

## 8. Kiểm thử chức năng

1. Thêm `112BOOK001`, tên `Cloud Computing`, tác giả tùy chọn, giá `100000`.
2. Xác nhận bảng hiển thị VAT `8%` và giá sau thuế `108.000 ₫`.
3. Nhập mã `111BOOK001`; trình duyệt và server phải từ chối.
4. Tải lại trang vài lần; số lượt xem session tăng.
5. Vào Atlas và xác nhận collection `sessions` có document.
6. Dừng rồi chạy lại server; mở lại cùng trình duyệt và xác nhận session vẫn tiếp tục nếu chưa hết hạn.

## 9. Kiểm thử Least Privilege

Chạy:

```powershell
npm run verify:permissions
```

Kết quả phải có bốn dòng PASS:

- Reader đọc `books` thành công.
- Reader ghi `books` bị từ chối.
- Writer đọc `books` bị từ chối.
- Writer thêm sách thành công và reader đọc lại được.

Script tạo một bản ghi `112VERIFY...` để làm bằng chứng. Có thể xóa bản ghi này sau khi chụp ảnh bằng tài khoản quản trị Atlas.

## 10. Kiểm tra Git và bí mật

```powershell
git status
git log --graph --oneline --decorate --all
git check-ignore -v .env
git ls-files
git grep -n "mongodb+srv"
```

`.env` phải được ignore. Kết quả tìm `mongodb+srv` chỉ được xuất hiện trong `.env.example` dưới dạng placeholder.

## 11. Tạo GitHub repository

1. Tạo repository trống trên GitHub, không thêm README hoặc `.gitignore` từ GitHub.
2. Chạy các lệnh do GitHub cung cấp, ví dụ:

```powershell
git remote add origin https://github.com/USERNAME/cloud-midterm-23IT112.git
git push -u origin main
git push origin feature/database-23IT112
git push origin feature/session-23IT112
```

3. Mở tab **Insights > Network** hoặc trang commit graph và chụp ảnh hai merge node.

## 12. Tạo Render Web Service

1. Đăng nhập Render, chọn **New > Web Service**.
2. Kết nối GitHub repository vừa tạo.
3. Chọn branch `main`.
4. Chọn region Singapore.
5. Build command: `npm ci`.
6. Start command: `npm start`.
7. Health check path: `/health`.
8. Chọn paid Starter nếu yêu cầu đúng nghĩa chạy 24/7. Free service sẽ sleep khi không có truy cập.

Thêm các environment variables:

| Key | Value |
|---|---|
| NODE_ENV | production |
| DB_NAME | DB_23IT112 |
| MONGODB_READ_URI | URI reader thật |
| MONGODB_WRITE_URI | URI writer thật |
| SESSION_SECRET | secret dài ngẫu nhiên |

Không đặt URI hoặc mật khẩu trong `render.yaml`.

## 13. Cho phép Render kết nối Atlas

1. Sau khi service được tạo, mở service trên Render.
2. Chọn **Connect > Outbound** và sao chép toàn bộ CIDR ranges.
3. Quay lại Atlas **IP Access List**.
4. Thêm từng CIDR range và ghi chú `Render Singapore`.
5. Chọn **Manual Deploy > Deploy latest commit** nếu lần deploy trước thất bại do chưa cho phép IP.

## 14. Kiểm thử production

1. Mở URL `https://<service>.onrender.com/health`; phải nhận `status: ok` và `studentId: 23IT112`.
2. Mở `/books`.
3. Thêm một sách mã bắt đầu bằng `112`.
4. Xác nhận giá sau thuế đúng 8%.
5. Xác nhận session xuất hiện trong Atlas.
6. Tải lại trang và xác nhận lượt xem tăng.
7. Kiểm tra Render Logs không có connection string hoặc password.

## 15. Danh sách ảnh báo cáo

1. Cluster Atlas hoạt động.
2. Database `DB_23IT112` và hai collections.
3. TTL index `expires_1`.
4. Custom role reader.
5. Custom role writer.
6. Hai database users.
7. Kết quả `npm run verify:permissions`.
8. Trường hợp mã `111...` bị từ chối.
9. Sách hợp lệ có VAT 8% và giá sau thuế.
10. Document session trong Atlas.
11. Cây Git có hai merge node.
12. GitHub repository.
13. Render deploy thành công.
14. Danh sách tên environment variables, che toàn bộ value.
15. Trang ứng dụng production và footer sinh viên.

## 16. Tiêu chí hoàn tất

- Không có secret trong Git.
- Reader không ghi được `books`.
- Writer không đọc được `books`.
- Mọi mã sách đều bắt đầu bằng `112`.
- VAT luôn do server tính là 8%, không lấy từ form.
- Session tồn tại trong Atlas, không dùng MemoryStore.
- Git có hai nhánh tính năng và hai merge commit.
- GitHub chứa source và lịch sử đầy đủ.
- Render chạy từ branch `main` và nhận secrets qua dashboard.
