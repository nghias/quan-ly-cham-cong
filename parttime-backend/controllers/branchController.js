const db = require('../config/db');

// 1. Lấy danh sách tất cả chi nhánh kèm đầy đủ cấu hình lương, phụ cấp, khấu trừ
exports.getAllBranches = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM chi_nhanh');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. Thêm chi nhánh mới với đầy đủ thuộc tính
exports.createBranch = async (req, res) => {
    try {
        const { 
            ten_chi_nhanh, 
            luong_co_ban_mot_gio, 
            phu_cap_theo_gio, 
            phu_cap_co_dinh, 
            khau_tru_theo_gio, 
            ly_do_khau_tru 
        } = req.body;

        await db.query(`
            INSERT INTO chi_nhanh 
            (ten_chi_nhanh, luong_co_ban_mot_gio, phu_cap_theo_gio, phu_cap_co_dinh, khau_tru_theo_gio, ly_do_khau_tru) 
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            ten_chi_nhanh, 
            luong_co_ban_mot_gio || 25000, 
            phu_cap_theo_gio || 0, 
            phu_cap_co_dinh || 0, 
            khau_tru_theo_gio || 0, 
            ly_do_khau_tru || ''
        ]);

        res.status(201).json({ message: "Thêm chi nhánh thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. Cập nhật thông tin và cấu hình chi nhánh
exports.updateBranch = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            ten_chi_nhanh, 
            luong_co_ban_mot_gio, 
            phu_cap_theo_gio, 
            phu_cap_co_dinh, 
            khau_tru_theo_gio, 
            ly_do_khau_tru 
        } = req.body;

        await db.query(`
            UPDATE chi_nhanh 
            SET ten_chi_nhanh = ?, 
                luong_co_ban_mot_gio = ?, 
                phu_cap_theo_gio = ?, 
                phu_cap_co_dinh = ?, 
                khau_tru_theo_gio = ?, 
                ly_do_khau_tru = ?
            WHERE id = ?
        `, [
            ten_chi_nhanh, 
            luong_co_ban_mot_gio, 
            phu_cap_theo_gio, 
            phu_cap_co_dinh, 
            khau_tru_theo_gio, 
            ly_do_khau_tru, 
            id
        ]);

        res.json({ message: "Cập nhật chi nhánh thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. Xóa chi nhánh
exports.deleteBranch = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM chi_nhanh WHERE id = ?', [id]);
        res.json({ message: "Xóa chi nhánh thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};