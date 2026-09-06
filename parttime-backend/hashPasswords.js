const db = require('./config/db');
const bcrypt = require('bcrypt');

async function encryptExistingPasswords() {
    try {
        console.log("⏳ Đang quét danh sách tài khoản...");
        const [users] = await db.query('SELECT id, mat_khau FROM nguoi_dung');

        for (let user of users) {
            // Chỉ mã hóa nếu mật khẩu chưa có định dạng của bcrypt (bắt đầu bằng $)
            if (!user.mat_khau.startsWith('$')) {
                const hashedPassword = await bcrypt.hash(user.mat_khau, 10);
                await db.query('UPDATE nguoi_dung SET mat_khau = ? WHERE id = ?', [hashedPassword, user.id]);
                console.log(`✅ Đã mã hóa mật khẩu cho User ID: ${user.id}`);
            }
        }
        
        console.log("🎉 Hoàn tất mã hóa toàn bộ mật khẩu trong Database!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Có lỗi xảy ra:", error);
        process.exit(1);
    }
}

encryptExistingPasswords();