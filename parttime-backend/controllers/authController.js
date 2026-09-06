const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.login = async (req, res) => {
    try {
        const { ma_nhan_vien, mat_khau } = req.body;
        const [users] = await db.query('SELECT * FROM nguoi_dung WHERE ma_nhan_vien = ?', [ma_nhan_vien]);
        
        if (users.length === 0 || !users[0].trang_thai_hoat_dong) {
            return res.status(404).json({ message: "Tài khoản không tồn tại hoặc đã bị vô hiệu hóa!" });
        }
        
        const user = users[0];
        // So sánh mật khẩu đã mã hóa
        const isMatch = await bcrypt.compare(mat_khau, user.mat_khau);
        if (!isMatch) {
            return res.status(401).json({ message: "Mật khẩu không chính xác!" });
        }

        const token = jwt.sign(
            { id: user.id, vai_tro: user.vai_tro }, 
            process.env.JWT_SECRET, 
            { expiresIn: '60d' } // <--- Đổi thành 60 ngày
        );

        res.json({ message: "Đăng nhập thành công", token, vai_tro: user.vai_tro, ho_ten: user.ho_ten });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// NHÂN VIÊN tự đổi mật khẩu
exports.doiMatKhau = async (req, res) => {
    try {
        const { mat_khau_cu, mat_khau_moi } = req.body;
        const [users] = await db.query('SELECT mat_khau FROM nguoi_dung WHERE id = ?', [req.user.id]);
        
        const isMatch = await bcrypt.compare(mat_khau_cu, users[0].mat_khau);
        if (!isMatch) return res.status(400).json({ message: "Mật khẩu cũ không đúng!" });

        const hashedNewPassword = await bcrypt.hash(mat_khau_moi, 10);
        await db.query('UPDATE nguoi_dung SET mat_khau = ? WHERE id = ?', [hashedNewPassword, req.user.id]);
        
        res.json({ message: "Đổi mật khẩu thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};