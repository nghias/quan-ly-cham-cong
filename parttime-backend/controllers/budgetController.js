const db = require('../config/db');

exports.kiemTraNganSach = async (req, res) => {
    try {
        const { ngay_bat_dau, ngay_ket_thuc } = req.query;

        // 1. Lấy ngân sách tối đa cấu hình cho tuần ở Quận 8 (id_chi_nhanh = 1)
        const [nganSachRows] = await db.query(`
            SELECT ngan_sach_toi_da 
            FROM ngan_sach_tuan 
            WHERE id_chi_nhanh = 1 
              AND ngay_bat_dau <= ? AND ngay_ket_thuc >= ?
        `, [ngay_bat_dau, ngay_ket_thuc]);

        const ngan_sach_toi_da = nganSachRows.length > 0 ? parseFloat(nganSachRows[0].ngan_sach_toi_da) : 2500000;

        // 2. Tính tổng tiền quỹ: Lấy số giờ làm thường + tăng ca nhân với lương cơ bản lưu trữ (25.000đ), không trừ tiền xe
        const [chiRows] = await db.query(`
            SELECT SUM((l.so_gio_lam_thuong + l.so_gio_tang_ca_dem) * l.luong_co_ban_luu_tru) as tong_chi
            FROM lich_lam_viec l
            JOIN nguoi_dung n ON l.id_nguoi_dung = n.id
            WHERE l.id_chi_nhanh = 1 
              AND n.vai_tro != 'QUAN_LY' 
              AND n.id != 2 -- Loại trừ Lương Văn Hiền (Kỹ thuật)
              AND l.thoi_gian_bat_dau >= ? AND l.thoi_gian_ket_thuc <= ?
        `, [`${ngay_bat_dau} 00:00:00`, `${ngay_ket_thuc} 23:59:59`]);

        const tong_luong_hien_tai = chiRows[0].tong_chi ? parseFloat(chiRows[0].tong_chi) : 0;
        const ty_le_su_dung = (tong_luong_hien_tai / ngan_sach_toi_da) * 100;
        const canh_bao = tong_luong_hien_tai > ngan_sach_toi_da;

        res.json({
            ngan_sach_toi_da,
            tong_luong_hien_tai,
            ty_le_su_dung: ty_le_su_dung.toFixed(2),
            canh_bao
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// QUẢN LÝ: Cập nhật hạn mức ngân sách tuần cho Quận 8
exports.capNhatNganSach = async (req, res) => {
    try {
        const { ngay_bat_dau, ngay_ket_thuc, ngan_sach_toi_da } = req.body;

        const [existing] = await db.query(
            'SELECT id FROM ngan_sach_tuan WHERE id_chi_nhanh = 1 AND ngay_bat_dau = ? AND ngay_ket_thuc = ?',
            [ngay_bat_dau, ngay_ket_thuc]
        );

        if (existing.length > 0) {
            await db.query(
                'UPDATE ngan_sach_tuan SET ngan_sach_toi_da = ? WHERE id = ?',
                [ngan_sach_toi_da, existing[0].id]
            );
        } else {
            await db.query(
                'INSERT INTO ngan_sach_tuan (id_chi_nhanh, ngay_bat_dau, ngay_ket_thuc, ngan_sach_toi_da) VALUES (1, ?, ?, ?)',
                [ngay_bat_dau, ngay_ket_thuc, ngan_sach_toi_da]
            );
        }

        res.json({ message: "Cập nhật ngân sách thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};