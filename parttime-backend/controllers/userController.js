const db = require('../config/db');
const bcrypt = require('bcrypt');

// Tạo tài khoản nhân viên mới
exports.taoTaiKhoan = async (req, res) => {
    try {
        const { ho_ten, ma_nhan_vien, so_dien_thoai } = req.body;
        // Mật khẩu mặc định là mã nhân viên
        const hashedPassword = await bcrypt.hash(ma_nhan_vien, 10); 
        
        await db.query(
            'INSERT INTO nguoi_dung (ho_ten, ma_nhan_vien, so_dien_thoai, mat_khau) VALUES (?, ?, ?, ?)',
            [ho_ten, ma_nhan_vien, so_dien_thoai, hashedPassword]
        );
        res.json({ message: "Tạo tài khoản nhân viên thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Sửa thông tin tài khoản
exports.suaTaiKhoan = async (req, res) => {
    try {
        const { id } = req.params;
        const { ho_ten, so_dien_thoai } = req.body;
        await db.query(
            'UPDATE nguoi_dung SET ho_ten = ?, so_dien_thoai = ? WHERE id = ?',
            [ho_ten, so_dien_thoai, id]
        );
        res.json({ message: "Cập nhật thông tin thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Reset mật khẩu (Cập nhật thành mã nhân viên truyền lên từ Frontend)
exports.resetMatKhau = async (req, res) => {
    try {
        const { id } = req.params;
        const { mat_khau_moi } = req.body; // Bắt lấy "mat_khau_moi" được gửi từ frontend
        
        await db.query('UPDATE nguoi_dung SET mat_khau = ? WHERE id = ?', [mat_khau_moi, id]);
        
        res.json({ message: "Reset mật khẩu thành công!", mat_khau_moi });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Khóa hoặc mở khóa tài khoản (Cập nhật theo dữ liệu trạng thái được truyền lên từ Frontend)
exports.voHieuHoaTaiKhoan = async (req, res) => {
    try {
        const { id } = req.params;
        const { trang_thai_hoat_dong } = req.body; // Nhận biến trạng thái mới: 0 hoặc 1

        await db.query('UPDATE nguoi_dung SET trang_thai_hoat_dong = ? WHERE id = ?', [trang_thai_hoat_dong, id]);
        
        res.json({ message: "Cập nhật trạng thái hoạt động thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy danh sách toàn bộ nhân viên
exports.layDanhSachNhanVien = async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, ho_ten, ma_nhan_vien, so_dien_thoai, vai_tro, trang_thai_hoat_dong FROM nguoi_dung');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy thông tin cá nhân của người đang đăng nhập
exports.getMyProfile = async (req, res) => {
    try {
        const userId = req.user.id; // Lấy từ token qua verifyToken
        const [users] = await db.query('SELECT id, ho_ten, ma_nhan_vien, so_dien_thoai, vai_tro FROM nguoi_dung WHERE id = ?', [userId]);
        
        if (users.length === 0) return res.status(404).json({ error: "Không tìm thấy người dùng" });
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Đổi mật khẩu
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { oldPassword, newPassword } = req.body;

        // Lấy mật khẩu cũ từ DB để so sánh (Giả sử DB của bạn lưu mật khẩu dạng text thẳng)
        const [users] = await db.query('SELECT mat_khau FROM nguoi_dung WHERE id = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ error: "Không tìm thấy người dùng" });

        const currentDbPassword = users[0].mat_khau;

        if (currentDbPassword !== oldPassword) {
            return res.status(400).json({ error: "Mật khẩu cũ không chính xác!" });
        }

        // Cập nhật mật khẩu mới
        await db.query('UPDATE nguoi_dung SET mat_khau = ? WHERE id = ?', [newPassword, userId]);
        res.json({ message: "Đổi mật khẩu thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};