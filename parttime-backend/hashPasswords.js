const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Đọc cấu hình từ file .env

async function updatePasswords() {
    try {
        console.log("Đang kết nối tới TiDB Cloud...");
        
        // Thiết lập kết nối trực tiếp sử dụng biến môi trường và file chứng chỉ SSL
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: Number(process.env.DB_PORT) || 4000,
            ssl: {
                minVersion: 'TLSv1.2',
                ca: fs.readFileSync(path.join(__dirname, 'isrgrootx1.pem')) // Đường dẫn tới file chứng chỉ bảo mật
            }
        });

        console.log("✅ Kết nối TiDB Cloud thành công!");

        // Tạo mã băm bcrypt cho mật khẩu '12345678'
        const plainPassword = '12345678';
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // Thực hiện câu lệnh SQL cập nhật mật khẩu cho toàn bộ bảng users
        const [result] = await connection.execute(
            'UPDATE nguoi_dung SET mat_khau = ?', 
            [hashedPassword]
        );

        console.log(`🚀 Đã cập nhật thành công mật khẩu thành '12345678' cho tất cả tài khoản! Số bản ghi được cập nhật: ${result.affectedRows}`);
        
        await connection.end();
        process.exit(0);
    } catch (err) {
        console.error("❌ Lỗi khi cập nhật mật khẩu:", err);
        process.exit(1);
    }
}

updatePasswords();