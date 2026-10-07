# Cloud Computing Midterm 23IT112

Ứng dụng quản lý sách của Đặng Nguyễn Hưng, MSSV 23IT112. Hệ thống sử dụng hai tài khoản MongoDB Atlas độc lập, tự định tuyến truy vấn đọc và ghi, lưu session tập trung trên Atlas và triển khai bằng Render.

## Quy tắc cá nhân hóa

- Database: `DB_23IT112`
- Collection nghiệp vụ: `books`
- Collection session: `sessions`
- Tiền tố mã sản phẩm: `112`
- VAT: `(2 + 6)% = 8%`

## Chạy local

Yêu cầu Node.js 20 trở lên.

```powershell
npm install
Copy-Item .env.example .env
```

Cập nhật ba giá trị bí mật trong `.env`, sau đó chạy:

```powershell
npm run dev
```

Mở `http://localhost:3000/books`.

## Kiểm thử phân quyền

```powershell
npm run verify:permissions
```

Kết quả đúng phải cho thấy reader đọc được nhưng không ghi được, còn writer ghi được nhưng không đọc được collection `books`.

## Biến môi trường Render

- `NODE_ENV=production`
- `DB_NAME=DB_23IT112`
- `MONGODB_READ_URI`
- `MONGODB_WRITE_URI`
- `SESSION_SECRET`

Không commit file `.env` hoặc mật khẩu Atlas lên GitHub.
