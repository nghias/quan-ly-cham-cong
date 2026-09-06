const db = require('../config/db');

// NHÂN VIÊN: Đăng ký ca làm
exports.dangKyCa = async (req, res) => {
    try {
        const { ngay_dang_ky, gio_bat_dau, gio_ket_thuc } = req.body;
        await db.query(
            'INSERT INTO dang_ky_lich_lam (id_nguoi_dung, ngay_dang_ky, gio_bat_dau, gio_ket_thuc) VALUES (?, ?, ?, ?)',
            [req.user.id, ngay_dang_ky, gio_bat_dau, gio_ket_thuc]
        );
        res.json({ message: "Đăng ký lịch làm thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// QUẢN LÝ: Xếp ca & Tự động tính lương
exports.getShifts = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const [rows] = await db.query(`
            SELECT l.*, u.ho_ten, c.ten_chi_nhanh 
            FROM lich_lam_viec l
            JOIN nguoi_dung u ON l.id_nguoi_dung = u.id
            JOIN chi_nhanh c ON l.id_chi_nhanh = c.id
            WHERE l.thoi_gian_bat_dau >= ? AND l.thoi_gian_ket_thuc <= ?
        `, [startDate, endDate]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.xepLich = async (req, res) => {
    try {
        const { id_nguoi_dung, id_chi_nhanh, thoi_gian_bat_dau, thoi_gian_ket_thuc } = req.body;

        // Kiểm tra trùng giờ làm việc thực tế
        const [existingShifts] = await db.query(`
            SELECT * FROM lich_lam_viec 
            WHERE id_nguoi_dung = ? 
              AND (? < thoi_gian_ket_thuc AND ? > thoi_gian_bat_dau)
        `, [id_nguoi_dung, thoi_gian_bat_dau, thoi_gian_ket_thuc]);

        if (existingShifts.length > 0) {
            return res.status(400).json({ error: "Thời gian làm việc bị trùng lặp với ca khác trong ngày!" });
        }

        const [branches] = await db.query('SELECT * FROM chi_nhanh WHERE id = ?', [id_chi_nhanh]);
        const b = branches[0];

        const start = new Date(thoi_gian_bat_dau);
        const end = new Date(thoi_gian_ket_thuc);
        const totalHours = (end - start) / (1000 * 60 * 60);

        let otMinutes = 0;
        let current = new Date(start);
        while (current < end) {
            const hour = current.getHours();
            if (hour >= 22 || hour < 4) otMinutes++;
            current.setMinutes(current.getMinutes() + 1);
        }

        const otHours = otMinutes / 60;
        const normalHours = totalHours - otHours;
        const heSo = 1.0; 

        const luong_co_ban = parseFloat(b.luong_co_ban_mot_gio);
        const pc_gio = parseFloat(b.phu_cap_theo_gio || 0);
        const pc_cd = parseFloat(b.phu_cap_co_dinh || 0);
        const kt_gio = parseFloat(b.khau_tru_theo_gio || 0);

        const basePay = (normalHours * luong_co_ban * heSo) + (otHours * luong_co_ban * 1.5 * heSo);
        const allowance = (totalHours * pc_gio) + pc_cd;
        const deduction = totalHours * kt_gio;
        const netPay = basePay + allowance - deduction;

        await db.query(`
            INSERT INTO lich_lam_viec 
            (id_nguoi_dung, id_chi_nhanh, thoi_gian_bat_dau, thoi_gian_ket_thuc, he_so_ngay_le, 
             luong_co_ban_luu_tru, phu_cap_gio_luu_tru, phu_cap_co_dinh_luu_tru, khau_tru_gio_luu_tru, 
             so_gio_lam_thuong, so_gio_tang_ca_dem, tong_tien_khau_tru, luong_thuc_lanh, trang_thai) 
            VALUES (?, ?, ?, ?, 1.0, ?, ?, ?, ?, ?, ?, ?, ?, 'DA_XEP_LICH')
        `, [
            id_nguoi_dung, id_chi_nhanh, thoi_gian_bat_dau, thoi_gian_ket_thuc,
            luong_co_ban, pc_gio, pc_cd, kt_gio, normalHours, otHours, deduction, netPay
        ]);

        res.status(201).json({ message: "Xếp lịch thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.capNhatLich = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_chi_nhanh, thoi_gian_bat_dau, thoi_gian_ket_thuc } = req.body;

        const [currentShift] = await db.query('SELECT id_nguoi_dung FROM lich_lam_viec WHERE id = ?', [id]);
        if (currentShift.length === 0) return res.status(404).json({ error: "Không tìm thấy ca làm!" });
        const id_nguoi_dung = currentShift[0].id_nguoi_dung;

        const [existingShifts] = await db.query(`
            SELECT * FROM lich_lam_viec 
            WHERE id_nguoi_dung = ? AND id != ?
              AND (? < thoi_gian_ket_thuc AND ? > thoi_gian_bat_dau)
        `, [id_nguoi_dung, id, thoi_gian_bat_dau, thoi_gian_ket_thuc]);

        if (existingShifts.length > 0) {
            return res.status(400).json({ error: "Thời gian làm việc bị trùng lặp với ca khác trong ngày!" });
        }

        const [branches] = await db.query('SELECT * FROM chi_nhanh WHERE id = ?', [id_chi_nhanh]);
        const b = branches[0];

        const start = new Date(thoi_gian_bat_dau);
        const end = new Date(thoi_gian_ket_thuc);
        const totalHours = (end - start) / (1000 * 60 * 60);

        let otMinutes = 0;
        let current = new Date(start);
        while (current < end) {
            const hour = current.getHours();
            if (hour >= 22 || hour < 4) otMinutes++;
            current.setMinutes(current.getMinutes() + 1);
        }

        const otHours = otMinutes / 60;
        const normalHours = totalHours - otHours;
        const heSo = 1.0;

        const luong_co_ban = parseFloat(b.luong_co_ban_mot_gio);
        const pc_gio = parseFloat(b.phu_cap_theo_gio || 0);
        const pc_cd = parseFloat(b.phu_cap_co_dinh || 0);
        const kt_gio = parseFloat(b.khau_tru_theo_gio || 0);

        const basePay = (normalHours * luong_co_ban * heSo) + (otHours * luong_co_ban * 1.5 * heSo);
        const allowance = (totalHours * pc_gio) + pc_cd;
        const deduction = totalHours * kt_gio;
        const netPay = basePay + allowance - deduction;

        await db.query(`
            UPDATE lich_lam_viec 
            SET id_chi_nhanh = ?, thoi_gian_bat_dau = ?, thoi_gian_ket_thuc = ?, 
                so_gio_lam_thuong = ?, so_gio_tang_ca_dem = ?, tong_tien_khau_tru = ?, luong_thuc_lanh = ?
            WHERE id = ?
        `, [id_chi_nhanh, thoi_gian_bat_dau, thoi_gian_ket_thuc, normalHours, otHours, deduction, netPay, id]);

        res.json({ message: "Cập nhật ca làm thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.xoaLich = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM lich_lam_viec WHERE id = ?', [id]);
        res.json({ message: "Xóa ca làm thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// XEM LỊCH LÀM THỰC TẾ
exports.layLichLam = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = `
            SELECT l.*, n.ho_ten, c.ten_chi_nhanh 
            FROM lich_lam_viec l
            JOIN nguoi_dung n ON l.id_nguoi_dung = n.id
            JOIN chi_nhanh c ON l.id_chi_nhanh = c.id
            WHERE l.thoi_gian_bat_dau >= ? AND l.thoi_gian_ket_thuc <= ?
            ORDER BY l.thoi_gian_bat_dau ASC
        `;
        const params = [startDate, endDate];

        if (req.user.vai_tro === 'NHAN_VIEN') {
            query += ` AND l.id_nguoi_dung = ?`;
            params.push(req.user.id);
        }

        const [lich] = await db.query(query, params);
        res.json(lich);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// XEM LỊCH ĐĂNG KÝ (QUẢN LÝ)
exports.layDangKyCa = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const [dangKy] = await db.query(`
            SELECT d.*, n.ho_ten 
            FROM dang_ky_lich_lam d
            JOIN nguoi_dung n ON d.id_nguoi_dung = n.id
            WHERE d.ngay_dang_ky >= ? AND d.ngay_dang_ky <= ?
            ORDER BY d.ngay_dang_ky ASC
        `, [startDate, endDate]);
        res.json(dangKy);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// LẤY DANH SÁCH CHI NHÁNH
exports.layDanhSachChiNhanh = async (req, res) => {
    try {
        const [branches] = await db.query('SELECT id, ten_chi_nhanh FROM chi_nhanh');
        res.json(branches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy danh sách đăng ký ca trong khoảng thời gian
exports.getRegistrations = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const [rows] = await db.query(`
            SELECT * FROM dang_ky_lich_lam 
            WHERE ngay_dang_ky BETWEEN ? AND ?
        `, [startDate, endDate]);
        res.json(rows);
    } catch (error) {
        console.error("LỖI GET REGISTRATIONS:", error);
        res.status(500).json({ error: error.message });
    }
};

// Thêm đăng ký ca mới (Khi bấm vào ô trống)
exports.createRegistration = async (req, res) => {
    try {
        const { id_nguoi_dung, ngay_dang_ky, gio_bat_dau, gio_ket_thuc } = req.body;

        await db.query(`
            INSERT INTO dang_ky_lich_lam (id_nguoi_dung, ngay_dang_ky, gio_bat_dau, gio_ket_thuc, trang_thai)
            VALUES (?, ?, ?, ?, 'CHO_DUYET')
        `, [id_nguoi_dung, ngay_dang_ky, gio_bat_dau, gio_ket_thuc]);

        res.status(201).json({ message: "Đăng ký ca thành công!" });
    } catch (error) {
        console.error("❌ LỖI KHI TẠO ĐĂNG KÝ:", error);
        res.status(500).json({ error: error.message });
    }
};

// Cập nhật đăng ký ca (Khi bấm vào ô đã có sẵn lịch)
exports.updateRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_nguoi_dung, gio_bat_dau, gio_ket_thuc } = req.body;
        console.log(`🔥 [PUT] CẬP NHẬT ĐĂNG KÝ ID ${id} CHO USER ID:`, id_nguoi_dung, req.body);

        // Cho phép cập nhật cả thời gian lẫn đổi sang id_nguoi_dung mới nếu cần
        await db.query(`
            UPDATE dang_ky_lich_lam 
            SET id_nguoi_dung = ?, gio_bat_dau = ?, gio_ket_thuc = ? 
            WHERE id = ?
        `, [id_nguoi_dung, gio_bat_dau, gio_ket_thuc, id]);

        res.json({ message: "Cập nhật đăng ký thành công!" });
    } catch (error) {
        console.error("❌ LỖI KHI CẬP NHẬT ĐĂNG KÝ:", error);
        res.status(500).json({ error: error.message });
    }
};

// Hủy/Xóa đăng ký ca
exports.deleteRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🔥 [DELETE] HỦY ĐĂNG KÝ ID ${id}`);
        await db.query('DELETE FROM dang_ky_lich_lam WHERE id = ?', [id]);
        res.json({ message: "Hủy đăng ký thành công!" });
    } catch (error) {
        console.error("❌ LỖI KHI HỦY ĐĂNG KÝ:", error);
        res.status(500).json({ error: error.message });
    }
};